use async_trait::async_trait;
use chrono::{Duration, Utc};
use tokio::process::Command;

use crate::domain::{
    error::IntegrationError,
    model::{
        is_status_tag, AreaRef, BoardQuery, BoardSnapshot, CompletionStatus, CompletionWindow,
        KanbanStatus, ProjectRef, TagRef, ThingsId, Todo, BACKLOG_TAG, IN_PROGRESS_TAG, TODO_TAG,
    },
    ports::{ItemKind, ThingsRepository},
};

use super::runner::{apple_string, run};

pub struct AppleScriptThingsRepository;

fn things_show_url(id: &ThingsId) -> String {
    let encoded = id
        .as_str()
        .bytes()
        .map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                (byte as char).to_string()
            }
            _ => format!("%{byte:02X}"),
        })
        .collect::<String>();
    format!("things:///show?id={encoded}")
}

fn normalized_status_tags(todo: &Todo, target: KanbanStatus) -> Vec<String> {
    let mut tags: Vec<String> = todo
        .tags
        .iter()
        .filter(|tag| !is_status_tag(tag.name.as_str()))
        .map(|tag| tag.name.clone())
        .collect();
    let target_tag = match target {
        KanbanStatus::Backlog => Some(BACKLOG_TAG),
        KanbanStatus::Todo => Some(TODO_TAG),
        KanbanStatus::InProgress => Some(IN_PROGRESS_TAG),
        KanbanStatus::Done => None,
    };
    if let Some(tag) = target_tag {
        tags.push(tag.into());
    }
    tags
}

fn read_script(id_filter: Option<&ThingsId>) -> String {
    let source_todos = id_filter.map_or_else(
        || r#"(to dos) & (to dos of list "Logbook")"#.to_string(),
        |id| {
            let id = apple_string(id.as_str());
            format!(
                r#"(to dos whose id is "{id}") & (to dos of list "Logbook" whose id is "{id}")"#
            )
        },
    );
    format!(
        r#"on pad2(value)
  set valueText to value as text
  if (count valueText) is 1 then return "0" & valueText
  return valueText
end pad2
on isoDate(value)
  if value is missing value then return ""
  set y to year of value as integer
  set m to month of value as integer
  set d to day of value as integer
  set h to hours of value as integer
  set n to minutes of value as integer
  set s to seconds of value as integer
  return (y as text) & "-" & pad2(m) & "-" & pad2(d) & "T" & pad2(h) & ":" & pad2(n) & ":" & pad2(s) & "Z"
end isoDate
set oldDelimiters to AppleScript's text item delimiters
set AppleScript's text item delimiters to ASCII character 31
tell application "Things3"
  set outputRows to {{}}
  set sourceTodos to {source_todos}
  set todayTodoIds to id of to dos of list "Today"
  repeat with itemRef in sourceTodos
    set itemStatus to status of itemRef as text
    set projectId to ""
    set projectName to ""
    set areaId to ""
    set areaName to ""
    set completionDateText to ""
    try
      set projectRef to project of itemRef
      set projectId to id of projectRef
      set projectName to name of projectRef
    end try
    try
      set areaRef to area of itemRef
      set areaId to id of areaRef
      set areaName to name of areaRef
    end try
    try
      set completionDateText to my isoDate(completion date of itemRef)
    end try
    set itemIsToday to ((id of itemRef) is in todayTodoIds)
    set end of outputRows to (id of itemRef) & (ASCII character 30) & (name of itemRef) & (ASCII character 30) & itemStatus & (ASCII character 30) & (tag names of itemRef) & (ASCII character 30) & projectId & (ASCII character 30) & projectName & (ASCII character 30) & areaId & (ASCII character 30) & areaName & (ASCII character 30) & completionDateText & (ASCII character 30) & itemIsToday
  end repeat
end tell
set joined to outputRows as text
set AppleScript's text item delimiters to oldDelimiters
return joined"#,
    )
}

fn parse_todos(output: &str) -> Vec<Todo> {
    output
        .split('\u{1f}')
        .filter_map(|row| {
            let fields: Vec<&str> = row.split('\u{1e}').collect();
            if fields.len() < 10 {
                return None;
            }
            let id = ThingsId::new(fields[0])?;
            let project = ThingsId::new(fields[4]).map(|id| ProjectRef {
                id,
                name: fields[5].to_string(),
                area: None,
                active: true,
            });
            let area = ThingsId::new(fields[6]).map(|id| AreaRef {
                id,
                name: fields[7].to_string(),
                active: true,
            });
            Some(Todo {
                id,
                title: fields[1].to_string(),
                completion_status: match fields[2] {
                    "completed" => CompletionStatus::Completed,
                    "canceled" => CompletionStatus::Canceled,
                    _ => CompletionStatus::Open,
                },
                is_today: fields[9] == "true",
                due_date: None,
                scheduled_date: None,
                completion_date: chrono::DateTime::parse_from_rfc3339(fields[8])
                    .ok()
                    .map(|date| date.with_timezone(&Utc)),
                project,
                area,
                tags: fields[3]
                    .split(',')
                    .map(str::trim)
                    .filter(|name| !name.is_empty())
                    .map(|name| TagRef {
                        id: None,
                        name: name.to_string(),
                    })
                    .collect(),
                modified_at: None,
            })
        })
        .collect()
}

fn collection_script(kind: &str) -> String {
    if kind == "areas" {
        return r#"set oldDelimiters to AppleScript's text item delimiters
set AppleScript's text item delimiters to ASCII character 31
tell application "Things3"
  set outputRows to {}
  repeat with itemRef in areas
    set end of outputRows to (id of itemRef) & (ASCII character 30) & (name of itemRef)
  end repeat
end tell
set joined to outputRows as text
set AppleScript's text item delimiters to oldDelimiters
return joined"#
            .into();
    }
    r#"set oldDelimiters to AppleScript's text item delimiters
set AppleScript's text item delimiters to ASCII character 31
tell application "Things3"
  set outputRows to {}
  repeat with itemRef in projects
    set areaId to ""
    set areaName to ""
    try
      set areaRef to area of itemRef
      set areaId to id of areaRef
      set areaName to name of areaRef
    end try
    set end of outputRows to (id of itemRef) & (ASCII character 30) & (name of itemRef) & (ASCII character 30) & areaId & (ASCII character 30) & areaName
  end repeat
end tell
set joined to outputRows as text
set AppleScript's text item delimiters to oldDelimiters
return joined"#
        .into()
}

fn parse_areas(output: &str) -> Vec<AreaRef> {
    output
        .split('\u{1f}')
        .filter_map(|row| {
            let fields: Vec<&str> = row.split('\u{1e}').collect();
            Some(AreaRef {
                id: ThingsId::new(*fields.first()?)?,
                name: (*fields.get(1)?).into(),
                active: true,
            })
        })
        .collect()
}

fn parse_projects(output: &str) -> Vec<ProjectRef> {
    output
        .split('\u{1f}')
        .filter_map(|row| {
            let fields: Vec<&str> = row.split('\u{1e}').collect();
            Some(ProjectRef {
                id: ThingsId::new(*fields.first()?)?,
                name: (*fields.get(1)?).into(),
                area: ThingsId::new(*fields.get(2)?).map(|id| AreaRef {
                    id,
                    name: fields.get(3).unwrap_or(&"").to_string(),
                    active: true,
                }),
                active: true,
            })
        })
        .collect()
}

#[async_trait]
impl ThingsRepository for AppleScriptThingsRepository {
    async fn fetch_board(&self, query: &BoardQuery) -> Result<BoardSnapshot, IntegrationError> {
        let mut todos = parse_todos(&run(&read_script(None), false).await?);
        let since = query
            .completed_since
            .unwrap_or_else(|| Utc::now() - Duration::days(30));
        todos.retain(|todo| {
            todo.completion_status != CompletionStatus::Canceled
                && (todo.completion_status != CompletionStatus::Completed
                    || todo.completion_date.is_none_or(|date| date >= since))
        });
        let mut projects = parse_projects(&run(&collection_script("projects"), false).await?);
        projects.sort_by(|a, b| a.id.as_str().cmp(b.id.as_str()));
        projects.dedup_by(|a, b| a.id == b.id);
        let mut areas = parse_areas(&run(&collection_script("areas"), false).await?);
        areas.sort_by(|a, b| a.id.as_str().cmp(b.id.as_str()));
        areas.dedup_by(|a, b| a.id == b.id);
        let mut tags: Vec<TagRef> = todos.iter().flat_map(|todo| todo.tags.clone()).collect();
        tags.sort_by(|a, b| a.name.cmp(&b.name));
        tags.dedup_by(|a, b| a.name == b.name);
        Ok(BoardSnapshot {
            todos: todos.into_iter().map(Into::into).collect(),
            projects,
            areas,
            tags,
            completion_window: CompletionWindow {
                days: 30,
                since,
                label: "최근 30일".into(),
            },
            refreshed_at: Utc::now(),
        })
    }

    async fn fetch_todo(&self, id: &ThingsId) -> Result<Todo, IntegrationError> {
        parse_todos(&run(&read_script(Some(id)), false).await?)
            .into_iter()
            .next()
            .ok_or(IntegrationError::ItemNotFound)
    }

    async fn replace_status_tags(
        &self,
        id: &ThingsId,
        target: KanbanStatus,
    ) -> Result<Todo, IntegrationError> {
        let current = self.fetch_todo(id).await?;
        let tags = apple_string(&normalized_status_tags(&current, target).join(", "));
        let script = format!(
            r#"tell application "Things3"
set targetTodo to first to do whose id is "{}"
set tag names of targetTodo to "{}"
end tell"#,
            apple_string(id.as_str()),
            tags
        );
        run(&script, true).await?;
        self.fetch_todo(id).await
    }

    async fn set_completion(
        &self,
        id: &ThingsId,
        completed: bool,
    ) -> Result<Todo, IntegrationError> {
        let status = if completed { "completed" } else { "open" };
        let script = format!(
            r#"tell application "Things3"
set targetTodo to first to do whose id is "{}"
set status of targetTodo to {}
end tell"#,
            apple_string(id.as_str()),
            status
        );
        run(&script, true).await?;
        self.fetch_todo(id).await
    }

    async fn show_item(&self, id: &ThingsId, _kind: ItemKind) -> Result<(), IntegrationError> {
        let status = Command::new("open")
            .arg(things_show_url(id))
            .status()
            .await
            .map_err(|_| IntegrationError::ThingsUnavailable)?;
        if status.success() {
            Ok(())
        } else {
            Err(IntegrationError::ThingsUnavailable)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_public_text_ids_and_preserves_tags() {
        let output = "abc\u{1e}Task\u{1e}open\u{1e}Home, status:in-progress\u{1e}p1\u{1e}Project\u{1e}a1\u{1e}Area\u{1e}\u{1e}true";
        let todos = parse_todos(output);
        assert_eq!(todos[0].id.as_str(), "abc");
        assert_eq!(todos[0].tags.len(), 2);
        assert!(todos[0].is_today);
        assert_eq!(todos[0].status().status, KanbanStatus::InProgress);
    }

    #[test]
    fn parses_iso_completion_date_and_active_collections() {
        let output = "abc\u{1e}Done\u{1e}completed\u{1e}\u{1e}\u{1e}\u{1e}a1\u{1e}Area\u{1e}2026-07-29T03:00:00Z\u{1e}false";
        let todos = parse_todos(output);
        assert!(todos[0].completion_date.is_some());
        assert!(parse_areas("a1\u{1e}Area")[0].active);
        assert_eq!(
            parse_projects("p1\u{1e}Project\u{1e}a1\u{1e}Area")[0]
                .area
                .as_ref()
                .unwrap()
                .id
                .as_str(),
            "a1"
        );
    }

    #[test]
    fn read_contract_uses_public_collections_and_iso_dates() {
        let script = read_script(None);
        assert!(script.contains("completion date of itemRef"));
        assert!(script.contains(r#"to dos of list "Today""#));
        assert!(script.contains("itemIsToday"));
        assert!(script.contains(r#"to dos of list "Logbook""#));
        assert!(collection_script("areas").contains("repeat with itemRef in areas"));
        assert!(collection_script("projects").contains("repeat with itemRef in projects"));
    }

    #[test]
    fn item_lookup_searches_active_todos_and_logbook() {
        let script = read_script(Some(&ThingsId::new("completed-id").unwrap()));
        assert!(script.contains(r#"to dos whose id is "completed-id""#));
        assert!(script.contains(r#"to dos of list "Logbook" whose id is "completed-id""#));
    }

    #[test]
    fn builds_official_things_show_url_and_encodes_id() {
        assert_eq!(
            things_show_url(&ThingsId::new("todo id/한글").unwrap()),
            "things:///show?id=todo%20id%2F%ED%95%9C%EA%B8%80"
        );
    }

    #[test]
    fn normalizes_only_status_tags_and_preserves_user_tag_order() {
        let todo = crate::domain::fixtures::todo_with_tags(
            CompletionStatus::Open,
            &[
                "first",
                "status:in-progress",
                "in progress",
                "status:todo",
                "second",
            ],
        );
        assert_eq!(
            normalized_status_tags(&todo, KanbanStatus::InProgress),
            ["first", "second", "in progress"]
        );
        assert_eq!(
            normalized_status_tags(&todo, KanbanStatus::Todo),
            ["first", "second", "to do"]
        );
        assert_eq!(
            normalized_status_tags(&todo, KanbanStatus::Backlog),
            ["first", "second", "backlog"]
        );
    }

    #[test]
    fn tag_write_contract_uses_public_tag_names_property() {
        let source = include_str!("repository.rs");
        assert!(source.contains("set tag names of targetTodo"));
    }
}

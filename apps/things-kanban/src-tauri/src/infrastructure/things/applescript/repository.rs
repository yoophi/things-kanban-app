use async_trait::async_trait;
use chrono::Utc;

use crate::domain::{
    error::IntegrationError,
    model::{
        AreaRef, BoardQuery, BoardSnapshot, CompletionStatus, KanbanStatus, ProjectRef, TagRef,
        ThingsId, Todo,
    },
    ports::{ItemKind, ThingsRepository},
};

use super::runner::{apple_string, run};

pub struct AppleScriptThingsRepository;

fn read_script(id_filter: Option<&ThingsId>) -> String {
    let filter = id_filter
        .map(|id| format!(" whose id is \"{}\"", apple_string(id.as_str())))
        .unwrap_or_default();
    format!(
        r#"set oldDelimiters to AppleScript's text item delimiters
set AppleScript's text item delimiters to ASCII character 31
tell application "Things3"
  set outputRows to {{}}
  repeat with itemRef in (to dos{filter})
    set itemStatus to status of itemRef as text
    set projectId to ""
    set projectName to ""
    set areaId to ""
    set areaName to ""
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
    set end of outputRows to (id of itemRef) & (ASCII character 30) & (name of itemRef) & (ASCII character 30) & itemStatus & (ASCII character 30) & (tag names of itemRef) & (ASCII character 30) & projectId & (ASCII character 30) & projectName & (ASCII character 30) & areaId & (ASCII character 30) & areaName
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
            if fields.len() < 8 {
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
            });
            Some(Todo {
                id,
                title: fields[1].to_string(),
                completion_status: match fields[2] {
                    "completed" => CompletionStatus::Completed,
                    "canceled" => CompletionStatus::Canceled,
                    _ => CompletionStatus::Open,
                },
                due_date: None,
                scheduled_date: None,
                completion_date: None,
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

#[async_trait]
impl ThingsRepository for AppleScriptThingsRepository {
    async fn fetch_board(&self, query: &BoardQuery) -> Result<BoardSnapshot, IntegrationError> {
        let mut todos = parse_todos(&run(&read_script(None), false).await?);
        todos.retain(|todo| {
            todo.completion_status != CompletionStatus::Canceled
                && (query.show_done || todo.completion_status != CompletionStatus::Completed)
        });
        let projects = todos.iter().filter_map(|todo| todo.project.clone()).collect();
        let areas = todos.iter().filter_map(|todo| todo.area.clone()).collect();
        let tags = todos.iter().flat_map(|todo| todo.tags.clone()).collect();
        Ok(BoardSnapshot {
            todos: todos.into_iter().map(Into::into).collect(),
            projects,
            areas,
            tags,
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
        let mut tags: Vec<String> = current
            .tags
            .iter()
            .filter(|tag| !matches!(tag.name.as_str(), "status:todo" | "status:in-progress"))
            .map(|tag| tag.name.clone())
            .collect();
        if target == KanbanStatus::InProgress {
            tags.push("status:in-progress".into());
        }
        let tags = apple_string(&tags.join(", "));
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

    async fn show_item(
        &self,
        id: &ThingsId,
        kind: ItemKind,
    ) -> Result<(), IntegrationError> {
        let class_name = match kind {
            ItemKind::Todo => "to do",
            ItemKind::Project => "project",
            ItemKind::Area => "area",
        };
        let script = format!(
            r#"tell application "Things3" to show first {class_name} whose id is "{}""#,
            apple_string(id.as_str())
        );
        run(&script, false).await.map(|_| ())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_public_text_ids_and_preserves_tags() {
        let output = "abc\u{1e}Task\u{1e}open\u{1e}Home, status:in-progress\u{1e}p1\u{1e}Project\u{1e}a1\u{1e}Area";
        let todos = parse_todos(output);
        assert_eq!(todos[0].id.as_str(), "abc");
        assert_eq!(todos[0].tags.len(), 2);
        assert_eq!(todos[0].status().status, KanbanStatus::InProgress);
    }
}

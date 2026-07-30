use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub const BACKLOG_TAG: &str = "backlog";
pub const TODO_TAG: &str = "to do";
pub const TODAY_TAG: &str = "today";
pub const IN_PROGRESS_TAG: &str = "in progress";
pub const LEGACY_IN_PROGRESS_TAG: &str = "status:in-progress";
pub const LEGACY_TODO_TAG: &str = "status:todo";

pub fn is_status_tag(name: &str) -> bool {
    matches!(
        name,
        BACKLOG_TAG
            | TODO_TAG
            | TODAY_TAG
            | IN_PROGRESS_TAG
            | LEGACY_IN_PROGRESS_TAG
            | LEGACY_TODO_TAG
    )
}

pub fn is_in_progress_tag(name: &str) -> bool {
    matches!(name, IN_PROGRESS_TAG | LEGACY_IN_PROGRESS_TAG)
}

pub fn is_todo_tag(name: &str) -> bool {
    matches!(name, TODO_TAG | TODAY_TAG | LEGACY_TODO_TAG)
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ThingsId(String);

impl ThingsId {
    pub fn new(value: impl Into<String>) -> Option<Self> {
        let value = value.into();
        (!value.trim().is_empty()).then_some(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AreaRef {
    pub id: ThingsId,
    pub name: String,
    pub active: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRef {
    pub id: ThingsId,
    pub name: String,
    pub area: Option<AreaRef>,
    pub active: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagRef {
    pub id: Option<ThingsId>,
    pub name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CompletionStatus {
    Open,
    Completed,
    Canceled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum KanbanStatus {
    Backlog,
    Todo,
    InProgress,
    Done,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResolution {
    pub status: KanbanStatus,
    pub conflict: bool,
    pub status_tags: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Todo {
    pub id: ThingsId,
    pub title: String,
    pub completion_status: CompletionStatus,
    pub is_today: bool,
    pub due_date: Option<DateTime<Utc>>,
    pub scheduled_date: Option<DateTime<Utc>>,
    pub completion_date: Option<DateTime<Utc>>,
    pub project: Option<ProjectRef>,
    pub area: Option<AreaRef>,
    pub tags: Vec<TagRef>,
    pub modified_at: Option<DateTime<Utc>>,
}

impl Todo {
    pub fn has_in_progress_tag(&self) -> bool {
        self.tags
            .iter()
            .any(|tag| is_in_progress_tag(tag.name.as_str()))
    }

    pub fn has_only_canonical_in_progress_tag(&self) -> bool {
        self.tags
            .iter()
            .filter(|tag| is_in_progress_tag(tag.name.as_str()))
            .map(|tag| tag.name.as_str())
            .eq([IN_PROGRESS_TAG])
    }

    pub fn has_only_canonical_status_tag(&self, expected: &str) -> bool {
        self.tags
            .iter()
            .filter(|tag| is_status_tag(tag.name.as_str()))
            .map(|tag| tag.name.as_str())
            .eq([expected])
    }

    pub fn status(&self) -> StatusResolution {
        if self.completion_status == CompletionStatus::Completed {
            return StatusResolution {
                status: KanbanStatus::Done,
                conflict: false,
                status_tags: vec![],
            };
        }

        let status_tags: Vec<String> = self
            .tags
            .iter()
            .filter(|tag| is_status_tag(tag.name.as_str()))
            .map(|tag| tag.name.clone())
            .collect();
        let in_progress = status_tags
            .iter()
            .any(|tag| is_in_progress_tag(tag.as_str()));
        let backlog = status_tags.iter().any(|tag| tag == BACKLOG_TAG);
        let todo_tag = status_tags.iter().any(|tag| is_todo_tag(tag.as_str()));
        let todo = self.is_today || todo_tag;
        let conflicting_tag_count =
            usize::from(in_progress) + usize::from(backlog) + usize::from(todo_tag);
        StatusResolution {
            status: if in_progress {
                KanbanStatus::InProgress
            } else if backlog {
                KanbanStatus::Backlog
            } else if todo {
                KanbanStatus::Todo
            } else {
                KanbanStatus::Backlog
            },
            conflict: conflicting_tag_count > 1,
            status_tags,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn todo(status: CompletionStatus, tags: &[&str]) -> Todo {
        Todo {
            id: ThingsId::new("id").unwrap(),
            title: "test".into(),
            completion_status: status,
            is_today: false,
            due_date: None,
            scheduled_date: None,
            completion_date: None,
            project: None,
            area: None,
            tags: tags
                .iter()
                .map(|name| TagRef {
                    id: None,
                    name: (*name).into(),
                })
                .collect(),
            modified_at: None,
        }
    }

    #[test]
    fn completion_has_priority_over_tags() {
        assert_eq!(
            todo(CompletionStatus::Completed, &["status:in-progress"])
                .status()
                .status,
            KanbanStatus::Done
        );
    }

    #[test]
    fn reports_conflicting_status_tags() {
        let resolution = todo(
            CompletionStatus::Open,
            &["status:todo", "status:in-progress"],
        )
        .status();
        assert_eq!(resolution.status, KanbanStatus::InProgress);
        assert!(resolution.conflict);
    }

    #[test]
    fn canonical_and_legacy_tags_map_to_in_progress() {
        for tag in [IN_PROGRESS_TAG, LEGACY_IN_PROGRESS_TAG] {
            assert_eq!(
                todo(CompletionStatus::Open, &[tag]).status().status,
                KanbanStatus::InProgress
            );
        }
    }

    #[test]
    fn in_progress_tag_has_priority_regardless_of_today_membership() {
        for is_today in [true, false] {
            let mut item = todo(CompletionStatus::Open, &[IN_PROGRESS_TAG]);
            item.is_today = is_today;
            let resolution = item.status();
            assert_eq!(
                resolution.status,
                KanbanStatus::InProgress,
                "is_today={is_today} must not override the in progress tag"
            );
            assert!(
                !resolution.conflict,
                "is_today={is_today} is not a conflicting status tag"
            );
        }
    }

    #[test]
    fn resolves_four_states_in_priority_order() {
        assert_eq!(
            todo(CompletionStatus::Open, &[]).status().status,
            KanbanStatus::Backlog
        );
        assert_eq!(
            todo(CompletionStatus::Open, &[TODO_TAG]).status().status,
            KanbanStatus::Todo
        );
        assert_eq!(
            todo(CompletionStatus::Open, &[BACKLOG_TAG, TODO_TAG])
                .status()
                .status,
            KanbanStatus::Backlog
        );
        assert_eq!(
            todo(CompletionStatus::Open, &[BACKLOG_TAG, IN_PROGRESS_TAG])
                .status()
                .status,
            KanbanStatus::InProgress
        );
    }

    #[test]
    fn today_membership_maps_to_todo_unless_explicitly_backlogged() {
        let mut item = todo(CompletionStatus::Open, &[]);
        item.is_today = true;
        assert_eq!(item.status().status, KanbanStatus::Todo);
        item.tags.push(TagRef {
            id: None,
            name: BACKLOG_TAG.into(),
        });
        let resolution = item.status();
        assert_eq!(resolution.status, KanbanStatus::Backlog);
        assert!(!resolution.conflict);
    }

    #[test]
    fn canonical_tag_is_distinct_from_legacy_and_duplicates() {
        assert!(
            todo(CompletionStatus::Open, &[IN_PROGRESS_TAG]).has_only_canonical_in_progress_tag()
        );
        assert!(!todo(
            CompletionStatus::Open,
            &[IN_PROGRESS_TAG, LEGACY_IN_PROGRESS_TAG]
        )
        .has_only_canonical_in_progress_tag());
    }
}

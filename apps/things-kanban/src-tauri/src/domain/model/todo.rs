use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    pub due_date: Option<DateTime<Utc>>,
    pub scheduled_date: Option<DateTime<Utc>>,
    pub completion_date: Option<DateTime<Utc>>,
    pub project: Option<ProjectRef>,
    pub area: Option<AreaRef>,
    pub tags: Vec<TagRef>,
    pub modified_at: Option<DateTime<Utc>>,
}

impl Todo {
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
            .filter(|tag| matches!(tag.name.as_str(), "status:todo" | "status:in-progress"))
            .map(|tag| tag.name.clone())
            .collect();
        let in_progress = status_tags.iter().any(|tag| tag == "status:in-progress");
        StatusResolution {
            status: if in_progress {
                KanbanStatus::InProgress
            } else {
                KanbanStatus::Todo
            },
            conflict: status_tags.len() > 1,
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
}

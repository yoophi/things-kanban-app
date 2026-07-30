use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::{AreaRef, KanbanStatus, ProjectRef, TagRef, ThingsId, Todo};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BoardSort {
    #[default]
    DueDate,
    ScheduledDate,
    Title,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BoardQuery {
    pub search: String,
    pub tag_names: Vec<String>,
    pub sort: BoardSort,
    pub completed_since: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletionWindow {
    pub days: u16,
    pub since: DateTime<Utc>,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardTodo {
    #[serde(flatten)]
    pub todo: Todo,
    pub status: KanbanStatus,
    pub status_conflict: bool,
}

impl From<Todo> for BoardTodo {
    fn from(todo: Todo) -> Self {
        let resolution = todo.status();
        Self {
            todo,
            status: resolution.status,
            status_conflict: resolution.conflict,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardSnapshot {
    pub todos: Vec<BoardTodo>,
    pub projects: Vec<ProjectRef>,
    pub areas: Vec<AreaRef>,
    pub tags: Vec<TagRef>,
    pub completion_window: CompletionWindow,
    pub refreshed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusTransitionRequest {
    pub todo_id: ThingsId,
    pub previous_status: KanbanStatus,
    pub target_status: KanbanStatus,
    pub request_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusTransitionResult {
    pub todo: BoardTodo,
    pub normalized_conflict: bool,
    pub verified_at: DateTime<Utc>,
}

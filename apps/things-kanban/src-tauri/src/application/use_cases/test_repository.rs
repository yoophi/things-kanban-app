#![cfg(test)]

use std::sync::Mutex;

use async_trait::async_trait;
use chrono::Utc;

use crate::domain::{
    error::IntegrationError,
    model::{
        is_status_tag, BoardQuery, BoardSnapshot, CompletionStatus, CompletionWindow, KanbanStatus,
        TagRef, ThingsId, Todo, BACKLOG_TAG, IN_PROGRESS_TAG, TODO_TAG,
    },
    ports::{ItemKind, ThingsRepository},
};

pub struct TestRepository {
    current: Mutex<Todo>,
    calls: Mutex<Vec<String>>,
    fail_on: Mutex<Option<&'static str>>,
}

impl TestRepository {
    pub fn new(todo: Todo) -> Self {
        Self {
            current: Mutex::new(todo),
            calls: Mutex::new(Vec::new()),
            fail_on: Mutex::new(None),
        }
    }

    pub fn fail_on(&self, operation: &'static str) {
        *self.fail_on.lock().expect("fail lock") = Some(operation);
    }

    pub fn calls(&self) -> Vec<String> {
        self.calls.lock().expect("calls lock").clone()
    }

    fn record(&self, operation: &str) -> Result<(), IntegrationError> {
        self.calls
            .lock()
            .expect("calls lock")
            .push(operation.into());
        let mut fail_on = self.fail_on.lock().expect("fail lock");
        if *fail_on == Some(operation) {
            fail_on.take();
            return Err(IntegrationError::WriteFailed);
        }
        Ok(())
    }
}

#[async_trait]
impl ThingsRepository for TestRepository {
    async fn fetch_board(&self, _query: &BoardQuery) -> Result<BoardSnapshot, IntegrationError> {
        let todo = self.current.lock().expect("todo lock").clone();
        Ok(BoardSnapshot {
            todos: vec![todo.into()],
            projects: vec![],
            areas: vec![],
            tags: vec![],
            completion_window: CompletionWindow {
                days: 30,
                since: Utc::now(),
                label: "최근 30일".into(),
            },
            refreshed_at: Utc::now(),
        })
    }

    async fn fetch_todo(&self, _id: &ThingsId) -> Result<Todo, IntegrationError> {
        self.record("fetch")?;
        Ok(self.current.lock().expect("todo lock").clone())
    }

    async fn replace_status_tags(
        &self,
        _id: &ThingsId,
        target: KanbanStatus,
    ) -> Result<Todo, IntegrationError> {
        self.record("replace_tags")?;
        let mut todo = self.current.lock().expect("todo lock");
        todo.tags.retain(|tag| !is_status_tag(&tag.name));
        let target_tag = match target {
            KanbanStatus::Backlog => Some(BACKLOG_TAG),
            KanbanStatus::Todo => Some(TODO_TAG),
            KanbanStatus::InProgress => Some(IN_PROGRESS_TAG),
            KanbanStatus::Done => None,
        };
        if let Some(name) = target_tag {
            todo.tags.push(TagRef {
                id: None,
                name: name.into(),
            });
        }
        Ok(todo.clone())
    }

    async fn set_completion(
        &self,
        _id: &ThingsId,
        completed: bool,
    ) -> Result<Todo, IntegrationError> {
        self.record("set_completion")?;
        let mut todo = self.current.lock().expect("todo lock");
        todo.completion_status = if completed {
            CompletionStatus::Completed
        } else {
            CompletionStatus::Open
        };
        Ok(todo.clone())
    }

    async fn show_item(&self, _id: &ThingsId, _kind: ItemKind) -> Result<(), IntegrationError> {
        Ok(())
    }
}

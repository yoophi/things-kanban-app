use async_trait::async_trait;

use crate::domain::{
    error::IntegrationError,
    model::{BoardQuery, BoardSnapshot, KanbanStatus, ThingsId, Todo},
};

#[derive(Debug, Clone, Copy)]
pub enum ItemKind {
    Todo,
    Project,
    Area,
}

#[async_trait]
pub trait ThingsRepository: Send + Sync {
    async fn fetch_board(&self, query: &BoardQuery) -> Result<BoardSnapshot, IntegrationError>;
    async fn fetch_todo(&self, id: &ThingsId) -> Result<Todo, IntegrationError>;
    async fn replace_status_tags(
        &self,
        id: &ThingsId,
        target: KanbanStatus,
    ) -> Result<Todo, IntegrationError>;
    async fn set_completion(
        &self,
        id: &ThingsId,
        completed: bool,
    ) -> Result<Todo, IntegrationError>;
    async fn show_item(
        &self,
        id: &ThingsId,
        kind: ItemKind,
    ) -> Result<(), IntegrationError>;
}

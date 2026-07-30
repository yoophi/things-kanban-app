use std::sync::Arc;

use crate::domain::{
    error::IntegrationError,
    model::{BoardQuery, BoardSnapshot},
    ports::ThingsRepository,
};

pub async fn execute(
    repository: Arc<dyn ThingsRepository>,
    query: BoardQuery,
) -> Result<BoardSnapshot, IntegrationError> {
    repository.fetch_board(&query).await
}

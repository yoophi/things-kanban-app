use std::sync::Arc;

use chrono::Utc;

use crate::domain::{
    error::IntegrationError,
    model::{KanbanStatus, StatusTransitionRequest, StatusTransitionResult},
    ports::ThingsRepository,
};

pub async fn execute(
    repository: Arc<dyn ThingsRepository>,
    request: StatusTransitionRequest,
) -> Result<StatusTransitionResult, IntegrationError> {
    if request.previous_status == request.target_status || request.request_id.trim().is_empty() {
        return Err(IntegrationError::InvalidRequest);
    }
    let before = repository.fetch_todo(&request.todo_id).await?;
    if before.status().status != request.previous_status {
        return Err(IntegrationError::VerificationFailed);
    }
    let had_conflict = before.status().conflict;

    let updated = match (request.previous_status, request.target_status) {
        (_, KanbanStatus::Done) => repository.set_completion(&request.todo_id, true).await?,
        (KanbanStatus::Done, target) => {
            repository.set_completion(&request.todo_id, false).await?;
            repository
                .replace_status_tags(&request.todo_id, target)
                .await?
        }
        (_, target) => {
            repository
                .replace_status_tags(&request.todo_id, target)
                .await?
        }
    };
    let resolution = updated.status();
    if resolution.status != request.target_status {
        return Err(IntegrationError::VerificationFailed);
    }
    Ok(StatusTransitionResult {
        todo: updated.into(),
        normalized_conflict: had_conflict && !resolution.conflict,
        verified_at: Utc::now(),
    })
}

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::{
    application::{queries, use_cases},
    domain::{
        error::CommandError,
        model::{
            BoardQuery, BoardSnapshot, StatusTransitionRequest, StatusTransitionResult, ThingsId,
        },
        ports::{ItemKind, ThingsRepository},
    },
    infrastructure::{logging::safe_id, things::applescript::AppleScriptThingsRepository},
};

pub struct AppState {
    pub repository: Arc<dyn ThingsRepository>,
    pub transition_lock: Mutex<()>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            repository: Arc::new(AppleScriptThingsRepository),
            transition_lock: Mutex::new(()),
        }
    }
}

#[tauri::command]
pub async fn get_board(
    state: tauri::State<'_, AppState>,
    query: BoardQuery,
) -> Result<BoardSnapshot, CommandError> {
    queries::get_board::execute(state.repository.clone(), query)
        .await
        .map_err(Into::into)
}

#[tauri::command]
pub async fn get_integration_status() -> queries::get_integration_status::IntegrationStatus {
    queries::get_integration_status::execute().await
}

#[tauri::command]
pub async fn transition_todo(
    state: tauri::State<'_, AppState>,
    request: StatusTransitionRequest,
) -> Result<StatusTransitionResult, CommandError> {
    let _guard = state.transition_lock.lock().await;
    tracing::info!(
        todo = %safe_id(request.todo_id.as_str()),
        target = ?request.target_status,
        request_id = %request.request_id,
        "transition requested"
    );
    use_cases::transition_todo::execute(state.repository.clone(), request)
        .await
        .map_err(Into::into)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRequest {
    item_id: ThingsId,
    item_kind: String,
}

#[derive(Debug, Serialize)]
pub struct OpenResponse {
    opened: bool,
}

#[tauri::command]
pub async fn open_in_things(
    state: tauri::State<'_, AppState>,
    request: OpenRequest,
) -> Result<OpenResponse, CommandError> {
    let kind = match request.item_kind.as_str() {
        "todo" => ItemKind::Todo,
        "project" => ItemKind::Project,
        "area" => ItemKind::Area,
        _ => return Err(crate::domain::error::IntegrationError::InvalidRequest.into()),
    };
    state
        .repository
        .show_item(&request.item_id, kind)
        .await
        .map_err(CommandError::from)?;
    Ok(OpenResponse { opened: true })
}

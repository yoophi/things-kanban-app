use serde::Serialize;

use crate::infrastructure::things::applescript::diagnostics;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IntegrationStatus {
    pub things_installed: bool,
    pub automation: &'static str,
    pub read_available: bool,
    pub write_available: bool,
}

pub async fn execute() -> IntegrationStatus {
    diagnostics::status().await
}

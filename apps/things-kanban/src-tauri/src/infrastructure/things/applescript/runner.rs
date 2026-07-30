use std::time::Duration;

use tokio::{process::Command, time::timeout};

use crate::domain::error::IntegrationError;

pub async fn run(script: &str, write: bool) -> Result<String, IntegrationError> {
    if !std::path::Path::new("/Applications/Things3.app").exists() {
        return Err(IntegrationError::ThingsNotInstalled);
    }
    let output = timeout(
        Duration::from_secs(8),
        Command::new("/usr/bin/osascript")
            .arg("-e")
            .arg(script)
            .output(),
    )
    .await
    .map_err(|_| IntegrationError::ThingsUnavailable)?
    .map_err(|_| IntegrationError::ThingsUnavailable)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("-1743") || stderr.to_lowercase().contains("not authorized") {
            return Err(IntegrationError::AutomationDenied);
        }
        return Err(if write {
            IntegrationError::WriteFailed
        } else {
            IntegrationError::ThingsUnavailable
        });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn apple_string(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\r', " ")
        .replace('\n', " ")
}

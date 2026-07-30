use crate::application::queries::get_integration_status::IntegrationStatus;

use super::runner;

pub async fn status() -> IntegrationStatus {
    let installed = std::path::Path::new("/Applications/Things3.app").exists();
    if !installed {
        return IntegrationStatus {
            things_installed: false,
            automation: "unavailable",
            read_available: false,
            write_available: false,
        };
    }
    match runner::run("tell application \"Things3\" to return id of first to do", false).await {
        Ok(_) => IntegrationStatus {
            things_installed: true,
            automation: "authorized",
            read_available: true,
            write_available: true,
        },
        Err(crate::domain::error::IntegrationError::AutomationDenied) => IntegrationStatus {
            things_installed: true,
            automation: "denied",
            read_available: false,
            write_available: false,
        },
        _ => IntegrationStatus {
            things_installed: true,
            automation: "notDetermined",
            read_available: false,
            write_available: false,
        },
    }
}

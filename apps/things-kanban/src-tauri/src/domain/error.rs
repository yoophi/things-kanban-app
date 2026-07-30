use serde::Serialize;
use thiserror::Error;

#[allow(dead_code)]
#[derive(Debug, Clone, Error, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum IntegrationError {
    #[error("Things 3가 설치되어 있지 않습니다.")]
    ThingsNotInstalled,
    #[error("Things 자동화 권한이 필요합니다.")]
    AutomationDenied,
    #[error("Things를 사용할 수 없습니다.")]
    ThingsUnavailable,
    #[error("대상 항목을 찾을 수 없습니다.")]
    ItemNotFound,
    #[error("상태 태그가 충돌합니다.")]
    StatusConflict,
    #[error("Things 변경에 실패했습니다.")]
    WriteFailed,
    #[error("Things에서 변경 결과를 확인하지 못했습니다.")]
    VerificationFailed,
    #[error("잘못된 요청입니다.")]
    InvalidRequest,
}

impl IntegrationError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::ThingsNotInstalled => "things_not_installed",
            Self::AutomationDenied => "automation_denied",
            Self::ThingsUnavailable => "things_unavailable",
            Self::ItemNotFound => "item_not_found",
            Self::StatusConflict => "status_conflict",
            Self::WriteFailed => "write_failed",
            Self::VerificationFailed => "verification_failed",
            Self::InvalidRequest => "invalid_request",
        }
    }

    pub fn retryable(&self) -> bool {
        matches!(
            self,
            Self::ThingsUnavailable | Self::WriteFailed | Self::VerificationFailed
        )
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
    pub retryable: bool,
    pub action: Option<&'static str>,
    pub request_id: Option<String>,
}

impl From<IntegrationError> for CommandError {
    fn from(value: IntegrationError) -> Self {
        let action = match value {
            IntegrationError::AutomationDenied => Some("open_automation_settings"),
            IntegrationError::ThingsNotInstalled => Some("install_things"),
            _ => None,
        };
        Self {
            code: value.code(),
            message: value.to_string(),
            retryable: value.retryable(),
            action,
            request_id: None,
        }
    }
}

use sha2::{Digest, Sha256};

pub fn safe_id(id: &str) -> String {
    let digest = Sha256::digest(id.as_bytes());
    format!("{:x}", digest)[..12].to_string()
}

pub fn init() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "things_kanban=info".into()),
        )
        .without_time()
        .try_init();
}

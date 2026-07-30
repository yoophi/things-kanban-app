use std::sync::Arc;

use chrono::Utc;

use crate::domain::{
    error::IntegrationError,
    model::{
        CompletionStatus, KanbanStatus, StatusTransitionRequest, StatusTransitionResult, Todo,
    },
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
    if before.completion_status == CompletionStatus::Canceled {
        return Err(IntegrationError::VerificationFailed);
    }
    if before.status().status != request.previous_status {
        return Err(IntegrationError::VerificationFailed);
    }
    let had_conflict = before.status().conflict;

    match (request.previous_status, request.target_status) {
        (_, KanbanStatus::Done) => {
            let normalized = repository
                .replace_status_tags(&request.todo_id, KanbanStatus::Done)
                .await?;
            if normalized.has_in_progress_tag() {
                return Err(IntegrationError::VerificationFailed);
            }
            repository.set_completion(&request.todo_id, true).await?;
        }
        (KanbanStatus::Done, target) => {
            repository.set_completion(&request.todo_id, false).await?;
            repository
                .replace_status_tags(&request.todo_id, target)
                .await?;
        }
        (_, target) => {
            repository
                .replace_status_tags(&request.todo_id, target)
                .await?;
        }
    }
    let updated = repository.fetch_todo(&request.todo_id).await?;
    if !matches_target(&updated, request.target_status) {
        return Err(IntegrationError::VerificationFailed);
    }
    let resolution = updated.status();
    Ok(StatusTransitionResult {
        todo: updated.into(),
        normalized_conflict: had_conflict && !resolution.conflict,
        verified_at: Utc::now(),
    })
}

fn matches_target(todo: &Todo, target: KanbanStatus) -> bool {
    match target {
        KanbanStatus::Done => {
            todo.completion_status == CompletionStatus::Completed && !todo.has_in_progress_tag()
        }
        KanbanStatus::Backlog => {
            todo.completion_status == CompletionStatus::Open
                && todo.has_only_canonical_status_tag(crate::domain::model::BACKLOG_TAG)
                && todo.status().status == KanbanStatus::Backlog
        }
        KanbanStatus::InProgress => {
            todo.completion_status == CompletionStatus::Open
                && todo.has_only_canonical_in_progress_tag()
        }
        KanbanStatus::Todo => {
            todo.completion_status == CompletionStatus::Open
                && todo.has_only_canonical_status_tag(crate::domain::model::TODO_TAG)
                && todo.status().status == KanbanStatus::Todo
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;
    use crate::{
        application::use_cases::test_repository::TestRepository,
        domain::{
            fixtures::todo_with_tags,
            model::{ThingsId, IN_PROGRESS_TAG, LEGACY_IN_PROGRESS_TAG},
        },
    };

    fn request(
        previous_status: KanbanStatus,
        target_status: KanbanStatus,
    ) -> StatusTransitionRequest {
        StatusTransitionRequest {
            todo_id: ThingsId::new("todo").unwrap(),
            previous_status,
            target_status,
            request_id: "request".into(),
        }
    }

    fn run<T>(future: impl std::future::Future<Output = T>) -> T {
        tokio::runtime::Builder::new_current_thread()
            .build()
            .unwrap()
            .block_on(future)
    }

    #[test]
    fn todo_to_in_progress_writes_canonical_tag_and_preserves_user_tags() {
        let repository = Arc::new(TestRepository::new(todo_with_tags(
            CompletionStatus::Open,
            &[crate::domain::model::TODO_TAG, "important"],
        )));
        let result = run(execute(
            repository.clone(),
            request(KanbanStatus::Todo, KanbanStatus::InProgress),
        ))
        .unwrap();
        assert_eq!(repository.calls(), ["fetch", "replace_tags", "fetch"]);
        assert!(result.todo.todo.has_only_canonical_in_progress_tag());
        assert!(result
            .todo
            .todo
            .tags
            .iter()
            .any(|tag| tag.name == "important"));
    }

    #[test]
    fn in_progress_to_done_removes_status_tag_before_completion() {
        for tag in [IN_PROGRESS_TAG, LEGACY_IN_PROGRESS_TAG] {
            let repository = Arc::new(TestRepository::new(todo_with_tags(
                CompletionStatus::Open,
                &[tag, "important"],
            )));
            let result = run(execute(
                repository.clone(),
                request(KanbanStatus::InProgress, KanbanStatus::Done),
            ))
            .unwrap();
            assert_eq!(
                repository.calls(),
                ["fetch", "replace_tags", "set_completion", "fetch"]
            );
            assert_eq!(
                result.todo.todo.completion_status,
                CompletionStatus::Completed
            );
            assert!(!result.todo.todo.has_in_progress_tag());
            assert!(result
                .todo
                .todo
                .tags
                .iter()
                .any(|tag| tag.name == "important"));
        }
    }

    #[test]
    fn reports_each_mutation_failure_without_success() {
        for operation in ["replace_tags", "set_completion", "fetch"] {
            let repository = Arc::new(TestRepository::new(todo_with_tags(
                CompletionStatus::Open,
                &[IN_PROGRESS_TAG],
            )));
            repository.fail_on(operation);
            let result = run(execute(
                repository,
                request(KanbanStatus::InProgress, KanbanStatus::Done),
            ));
            assert!(result.is_err(), "{operation} should fail");
        }
    }

    #[test]
    fn done_transitions_restore_open_state_with_normalized_tags() {
        for target in [
            KanbanStatus::Backlog,
            KanbanStatus::Todo,
            KanbanStatus::InProgress,
        ] {
            let repository = Arc::new(TestRepository::new(todo_with_tags(
                CompletionStatus::Completed,
                &[LEGACY_IN_PROGRESS_TAG, "important"],
            )));
            let result = run(execute(repository, request(KanbanStatus::Done, target))).unwrap();
            assert_eq!(result.todo.todo.completion_status, CompletionStatus::Open);
            assert_eq!(result.todo.status, target);
            assert!(result
                .todo
                .todo
                .tags
                .iter()
                .any(|tag| tag.name == "important"));
            if target == KanbanStatus::InProgress {
                assert!(result.todo.todo.has_only_canonical_in_progress_tag());
            } else {
                assert!(!result.todo.todo.has_in_progress_tag());
            }
        }
    }

    #[test]
    fn backlog_to_todo_replaces_tag_and_preserves_user_tags() {
        let repository = Arc::new(TestRepository::new(todo_with_tags(
            CompletionStatus::Open,
            &[crate::domain::model::BACKLOG_TAG, "important"],
        )));
        let result = run(execute(
            repository.clone(),
            request(KanbanStatus::Backlog, KanbanStatus::Todo),
        ))
        .unwrap();
        assert_eq!(repository.calls(), ["fetch", "replace_tags", "fetch"]);
        assert_eq!(result.todo.status, KanbanStatus::Todo);
        assert!(result
            .todo
            .todo
            .has_only_canonical_status_tag(crate::domain::model::TODO_TAG));
        assert!(result
            .todo
            .todo
            .tags
            .iter()
            .any(|tag| tag.name == "important"));
    }
}

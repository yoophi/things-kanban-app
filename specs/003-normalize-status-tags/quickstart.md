# Quickstart: 상태 전이 태그 정규화 검증

## Prerequisites

- macOS 15 이상
- Things 3 설치 및 자동화 권한
- 프로젝트 의존성 설치 완료

## Run

```bash
pnpm tauri:dev
```

## Safe Fixture Setup

실제 쓰기 검증은 전용 테스트 할 일에만 수행한다. 다음 항목을 준비한다.

- 사용자 태그 `important`가 있고 진행 태그가 없는 열린 Todo
- `in progress`와 사용자 태그가 있는 열린 In Progress 할 일
- legacy `status:in-progress`와 사용자 태그가 있는 열린 할 일
- canonical과 legacy 진행 태그가 함께 있는 충돌 할 일

## Acceptance Walkthrough

1. 진행 태그가 없는 Todo를 In Progress로 이동한다.
2. Things에서 `in progress` 태그가 정확히 하나 추가되고 `important`가 유지되는지 확인한다.
3. legacy 태그가 있는 할 일을 In Progress로 명시적으로 이동해 canonical 태그 하나로 정규화되는지 확인한다.
4. In Progress 할 일을 Done으로 이동한다.
5. Things에서 canonical/legacy 진행 태그가 모두 제거되고 실제 완료 상태인지 확인한다.
6. 진행 태그가 없는 Todo를 바로 Done으로 이동해 오류 없이 완료되는지 확인한다.
7. 자동화 권한을 거부하거나 테스트 대역으로 완료 단계를 실패시켜 카드가 이전 snapshot으로 복구되고 새로고침 후 Things 실제 상태와 일치하는지 확인한다.
8. 키보드 상태 선택으로 같은 전이를 수행해 포인터 이동과 동일한 결과인지 확인한다.

## Automated Gates

```bash
pnpm check-types
pnpm test
cargo test --workspace
pnpm build
pnpm storybook:test
pnpm test:e2e
pnpm tauri:build
git diff --check
```

실제 Things 쓰기 smoke test는 `THINGS_KANBAN_LIVE_TESTS=1`과 전용 `THINGS_KANBAN_TEST_TODO_ID`가 모두 있을 때만 실행한다.

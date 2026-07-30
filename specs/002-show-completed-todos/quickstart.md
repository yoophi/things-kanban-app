# Quickstart: 3열 보드와 사이드바 검증

## Prerequisites

- macOS 15 이상
- Things 3와 허용된 자동화 권한
- 프로젝트 의존성 설치 완료

## Run

```bash
pnpm tauri:dev
```

## Safe fixture setup

Things에 다음 검증 데이터를 준비한다.

- Area `Work`
- `Work` 아래 Project `Alpha`, `Beta`
- Area 없는 Project `Independent`
- `Work` 직속 열린 할 일
- 각 Project의 열린 Todo 및 `status:in-progress` 할 일
- 각 Project의 최근 30일 완료 할 일
- 30일보다 오래된 완료 할 일
- 서로 다른 Project에 같은 제목을 가진 할 일

실제 쓰기 검증은 전용 테스트 할 일에서만 수행한다.

## Acceptance walkthrough

1. 앱을 열어 사이드바와 `Todo`, `In Progress`, `Done · 최근 30일` 세 열이 항상 보이는지 확인한다.
2. `전체 보기`에서 활성 및 최근 완료 항목이 정확히 한 열에만 표시되는지 확인한다.
3. `Work`를 선택해 Area 직속 및 `Alpha`/`Beta` 할 일이 포함되고 다른 Area 할 일은 제외되는지 확인한다.
4. `Alpha`를 선택해 해당 Project 할 일만 남고 열별 개수가 맞는지 확인한다.
5. `Independent`가 별도 그룹에 표시되고 선택 가능한지 확인한다.
6. 같은 제목 카드에서 Project와 Area 문맥을 구별할 수 있는지 확인한다.
7. 사이드바를 접고 펼쳐 선택 범위가 유지되는지 확인한다.
8. 키보드만으로 전체/Area/Project 선택, 접기·펼치기, 세 열 상태 이동을 완료한다.
9. 선택한 Project를 Things에서 비활성화한 뒤 새로고침해 전체 보기 복구 안내를 확인한다.
10. 최근 완료는 표시되고 30일보다 오래된 완료는 표시되지 않는지 확인한다.
11. 완료·완료 취소 후 Things 상태와 카드 열이 일치하고 실패 시 이전 열로 복구되는지 확인한다.

## Automated gates

```bash
pnpm check-types
pnpm test
pnpm storybook:test
cargo test --workspace
pnpm build
pnpm tauri:build
pnpm test:e2e
git diff --check
```

기본 자동 테스트는 저장소 대역을 사용한다. 실제 Things 쓰기 smoke test는 `THINGS_KANBAN_LIVE_TESTS=1`과 전용 `THINGS_KANBAN_TEST_TODO_ID`가 모두 있을 때만 실행한다.

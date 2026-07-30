# Quickstart: 구현 및 검증

## Prerequisites

- macOS 15 이상
- Things 3
- Node.js 안정 지원 버전과 pnpm 9
- Rust 1.89 이상 안정 toolchain
- Tauri 2의 macOS 시스템 선행 조건

현재 저장소에는 아직 앱 코드와 의존성이 없으므로 아래 명령은 구현 단계에서 워크스페이스 스크립트가 만들어진 뒤 사용한다.

## Bootstrap

```bash
pnpm install
pnpm tauri:dev
```

첫 Things 조회 또는 쓰기 때 macOS 자동화 권한 요청이 나타난다. 권한 목적을 확인한 뒤 시스템 설정에서 허용한다. 개발 중인 실제 Things 데이터 변경은 전용 테스트 프로젝트와 테스트 할 일에서만 수행한다.

## Expected first-run flow

1. 앱이 Things 설치와 자동화 가능 상태를 확인한다.
2. 권한이 허용되면 활성 할 일을 읽어 `To Do`와 `In Progress`로 분류한다.
3. 권한이 없으면 데이터가 없는 보드가 아니라 권한 안내와 설정 이동 수단을 표시한다.
4. 수동 새로고침과 창 포커스 복귀는 동일한 보드 쿼리를 다시 실행한다.

## Safe manual acceptance

Things에 기존 업무 데이터와 분리된 테스트 프로젝트를 만들고 다음 테스트 할 일을 준비한다.

- 상태 태그가 없는 활성 할 일
- `status:in-progress`와 비상태 태그 하나를 가진 활성 할 일
- `status:todo`와 `status:in-progress`가 함께 있는 충돌 할 일
- 최근 완료 할 일

다음 순서로 확인한다.

1. 각 카드가 예상 열과 프로젝트/Area 맥락에 표시되는지 확인한다.
2. 프로젝트, Area, 태그, 제목 검색을 조합하고 열별 개수를 확인한다.
3. 포인터와 키보드 각각으로 `To Do`와 `In Progress` 사이를 이동한다.
4. Things에서 대상 태그가 바뀌고 비상태 태그가 유지되는지 확인한다.
5. 활성 카드를 완료하고 완료 취소해 요청한 열로 복구한다.
6. 자동화 권한을 거부한 상태에서 롤백과 안내를 확인한다.
7. Things에서 직접 항목을 수정한 뒤 앱 포커스를 복귀해 수렴을 확인한다.
8. 각 카드의 원본 열기 액션이 정확한 Things 항목을 여는지 확인한다.

## Automated quality gates

```bash
pnpm check-types
pnpm test
pnpm storybook:test
cargo test --workspace
pnpm tauri:build
pnpm test:e2e
git diff --check
```

기본 자동화 테스트는 `ThingsRepository` 대역을 사용하여 실제 데이터를 바꾸지 않는다. 실제 AppleScript 통합 테스트는 명시적 옵트인 환경 변수와 전용 테스트 항목이 모두 있을 때만 실행한다.

## Troubleshooting

- **Things가 설치되지 않음**: Things 3 설치 후 앱을 다시 실행한다.
- **자동화 권한 거부**: 시스템 설정의 개인정보 보호 및 보안에서 앱의 Things 자동화 권한을 확인한다.
- **변경 후 카드가 되돌아옴**: 실패 안내의 오류 종류를 확인하고 Things가 실행 가능한지 확인한 뒤 재시도한다.
- **상태 충돌 표시**: 카드를 원하는 열로 명시적으로 이동하면 알려진 상태 태그만 정규화된다.
- **CLI 없음**: 정상이다. MVP는 AppleScript 기본 경로를 사용한다.

## Validation Record

**Validated**: 2026-07-30

| Gate | Result |
| --- | --- |
| `pnpm check-types` | PASS |
| `pnpm test` | PASS — 4 files, 6 tests |
| `pnpm storybook:test` | PASS — static Storybook test build |
| `cargo test --workspace` | PASS — 6 tests including boundary guards |
| `pnpm build` | PASS |
| `pnpm tauri:build` | PASS — `target/release/bundle/macos/Things Kanban.app` |
| `pnpm test:e2e` | PASS — board and keyboard accessibility journeys |
| `git diff --check` | PASS |

1,000개 카드 검색·필터 선택자는 자동 성능 가드에서 100ms 예산 이내로
검증된다. 실제 Things 쓰기 smoke test는 사용자 데이터 보호를 위해
`THINGS_KANBAN_LIVE_TESTS=1`과 전용 `THINGS_KANBAN_TEST_TODO_ID`가 동시에
제공된 경우에만 허용된다.

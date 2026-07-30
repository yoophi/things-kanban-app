# Implementation Plan: 4단계 할 일 상태

**Branch**: `004-add-backlog-status` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-add-backlog-status/spec.md`

## Summary

기존 Todo, In Progress, Done 보드에 Backlog를 추가하고, Things의 실제 완료 상태·Today 목록 포함 여부·상태 태그를 한 곳에서 우선순위에 따라 판정한다. AppleScript 읽기 어댑터가 각 할 일의 Today 목록 포함 여부를 함께 반환하고, Rust 도메인이 `Done → In Progress → 명시적 Backlog → To Do → 기본 Backlog` 순서로 정확히 한 상태를 도출한다. Backlog에서 To Do로 이동하면 기존 상태 태그를 안전하게 정규화하여 `backlog`를 제거하고 canonical `to do` 태그를 하나 추가한 뒤 재조회로 검증한다. React 보드는 네 칼럼, 집계, 드래그 대상과 키보드 선택지를 동일한 상태 타입으로 확장한다.

열린 할 일에 `in progress` 태그가 있으면 `isToday`가 참이든 거짓이든 In Progress를 선택하며, Today 신호는 이 판정을 덮어쓰지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Rust 1.89 이상 안정 버전  
**Primary Dependencies**: Tauri 2.11, Vite 6.4, TanStack Query 5, Tailwind CSS 4, dnd-kit React/DOM 0.2, chrono, serde, async-trait  
**Storage**: Things 3가 유일한 영구 저장소; 별도 상태 저장소 없음  
**Testing**: Rust 단위/포트 mock 테스트, AppleScript 파서·스크립트 계약 테스트, Vitest와 React Testing Library, Playwright E2E  
**Target Platform**: macOS 15 이상, Things 3 설치 및 자동화 권한이 있는 환경  
**Project Type**: pnpm/Turbo 모노레포의 Tauri 데스크톱 앱  
**Performance Goals**: 보드 조회 또는 전이 후 5초 이내 결과 표시, 단일 전이에 필요한 Things 재조회 3회 이하  
**Constraints**: Today 포함 여부와 태그·완료 상태는 Things가 권위; canonical 태그는 `backlog`, `to do`, `in progress`; 기존 `today`, `status:todo`, `status:in-progress` 읽기 호환; AppleScript 쓰기만 허용; SQLite 쓰기 금지; 관련 없는 태그·메타데이터·PARA 보존  
**Scale/Scope**: 단일 사용자의 Project/Area별 칸반 보드 한 화면, 네 상태와 한 할 일 단위 상태 전이

## Constitution Check

_GATE: Phase 0 조사 전 및 Phase 1 설계 후 재검사 완료._

- **Things source of truth — PASS**: Today 포함 여부, 태그, 완료 상태를 모두 Things에서 읽고 보드 상태를 파생한다. 프런트엔드 캐시는 재조회로 완전히 재생성할 수 있다.
- **Safe integration — PASS**: 읽기와 쓰기는 기존 Things AppleScript 어댑터를 사용한다. Backlog→To Do는 상태 태그만 치환하고 직접 SQLite 또는 Things Cloud 접근을 추가하지 않는다.
- **Architecture — PASS**: 상태 이름과 판정 우선순위는 Rust 도메인, 전이 조정과 검증은 application, Today 조회와 태그 쓰기는 infrastructure에 둔다. React는 공유 계약을 소비하고 `features/move-todo`에서 사용자 전이를 처리한다.
- **Consistency and recovery — PASS**: 전이 전 권위 상태를 확인하고 쓰기 후 다시 읽어 목표 상태와 태그를 검증한다. 실패 시 성공 응답을 반환하지 않으며 UI snapshot 롤백 후 board query를 재검증한다. 충돌은 정의된 우선순위로 표시하되 명시적 전이 전 자동 정규화하지 않는다.
- **Tested accessible UX — PASS**: 상태 판정 행렬·태그 보존·실패 단계를 Rust 테스트로, Today 읽기와 AppleScript 쓰기 범위를 어댑터 테스트로, 네 칼럼·집계·포인터/키보드 동등성과 롤백을 컴포넌트/E2E 테스트로 검증한다.
- **Privacy and scope — PASS**: 오류와 진단 로그에 제목·메모·전체 태그를 남기지 않으며 기능은 macOS 로컬 Things 자동화 범위에 머문다.

**Post-design re-check**: `data-model.md`은 Today 신호와 네 상태 판정 및 전이 행렬을 정의하고, `contracts/transition-todo.md`는 요청 호환성, Backlog→To Do 쓰기·검증·오류 계약을 고정한다. `quickstart.md`는 상태 우선순위와 접근 가능한 네 칼럼 회귀 검증을 포함한다. 헌법 위반과 복잡성 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/004-add-backlog-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── transition-todo.md
└── tasks.md
```

`tasks.md`는 후속 `/speckit.tasks`에서 생성한다.

### Source Code (repository root)

```text
apps/things-kanban/
├── src/
│   ├── pages/board/
│   ├── features/move-todo/
│   ├── entities/board/
│   ├── entities/todo/
│   └── shared/api/
├── tests/e2e/
└── src-tauri/
    ├── src/
    │   ├── domain/model/todo.rs
    │   ├── domain/model/board.rs
    │   ├── domain/ports/things_repository.rs
    │   ├── application/use_cases/transition_todo.rs
    │   ├── inbound/tauri/mod.rs
    │   └── infrastructure/things/applescript/repository.rs
    └── tests/
        └── integration_boundaries.rs
```

**Structure Decision**: 기존 단일 Tauri 앱과 Feature-Sliced/헥사고날 경계를 유지한다. Today 포함 여부는 Things 어댑터가 읽어 순수 `Todo` 모델에 전달하고, 상태 판정과 태그 분류는 도메인에 둔다. 전이 유스케이스는 기존 command 형식을 확장 없이 재사용하며, 프런트엔드는 공유 `KanbanStatus`를 네 값으로 확장해 보드·집계·메뉴에 일관되게 적용한다.

## Implementation Strategy

### Phase 0 — 읽기 신호와 상태 규칙

1. `Todo`에 `is_today`를 추가하고 AppleScript 읽기에서 Today 목록의 ID 집합과 각 항목의 포함 여부를 함께 직렬화한다.
2. canonical 상태 태그 `backlog`, `to do`, `in progress`와 호환 태그 `today`, `status:todo`, `status:in-progress`를 도메인에서 정규화해 비교한다.
3. 완료 항목은 Done, 열린 항목은 In Progress, 명시적 Backlog, Today/To Do 신호, 기본 Backlog 순으로 단 하나의 상태를 반환하며, `in progress` 태그가 있으면 `is_today` 값은 In Progress 판정에 영향을 주지 않는다.
4. 서로 다른 열린 상태 태그 범주가 둘 이상이면 선택된 우선순위 상태와 함께 conflict를 유지한다. `is_today`는 To Do 판정 신호지만 상태 태그가 아니므로 conflict 개수에는 포함하지 않는다.

### Phase 1 — 안전한 Backlog→To Do 전이

1. 기존 `replace_status_tags` 포트가 네 목표 상태를 처리하도록 확장하되 전용 상태 태그만 제거하고 사용자 태그 순서와 값을 보존한다.
2. To Do 목표에는 canonical `to do`를 하나 추가하고 `backlog`, `today`, legacy Todo/In Progress와 canonical In Progress 상태 태그를 제거한다.
3. 전이 전 `previousStatus`를 권위 상태와 비교하고, 쓰기 후 같은 ID를 다시 읽어 open, `to do` 1개, `backlog` 부재, 최종 To Do 판정을 검증한다.
4. 실패나 외부 변경에서는 보상 쓰기로 추측하지 않고 오류를 반환해 프런트엔드 snapshot 롤백과 전체 재조회로 수렴한다.

### Phase 2 — 네 칼럼 UI와 회귀 검증

1. TypeScript/Rust 공유 상태를 `backlog | todo | inProgress | done`으로 확장하고 Backlog를 첫 번째 칼럼과 첫 번째 집계로 표시한다.
2. 보드 레이아웃, 드롭 대상과 키보드 상태 선택에 동일한 네 상태 배열을 사용한다.
3. Project/Area, 검색, 태그 필터는 상태 판정 후에도 기존과 동일하게 네 칼럼 전체에 적용한다.
4. `in progress` 태그가 있는 열린 fixture를 `is_today=true`와 `is_today=false`로 각각 검증하고, 기존 To Do↔In Progress, 열린 상태→Done, Done→열린 상태의 태그 정규화와 롤백 동작을 네 상태 모델에 맞춰 회귀 테스트한다.

## Verification Commands

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

## Complexity Tracking

헌법 위반이 없으므로 복잡성 예외가 없다.

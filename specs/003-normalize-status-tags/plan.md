# Implementation Plan: 상태 전이 태그 정규화

**Branch**: `003-normalize-status-tags` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-normalize-status-tags/spec.md`

## Summary

Todo에서 In Progress로 전이할 때 canonical `in progress` 태그를 정확히 하나 추가하고, 열린 상태에서 Done으로 전이할 때 진행 상태 태그를 먼저 제거한 뒤 Things의 실제 완료 상태로 변경한다. 기존 `status:in-progress` 태그는 호환 입력으로 인식하고 명시적 전이 시 canonical 태그로 정규화한다. Rust 애플리케이션 유스케이스가 변경 순서와 최종 검증을 조정하고, AppleScript 어댑터는 관련 상태 태그만 치환하면서 다른 태그와 메타데이터를 보존한다. 프런트엔드의 기존 낙관적 이동·롤백·재검증 흐름은 유지한다.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Rust 1.89 이상 안정 버전  
**Primary Dependencies**: Tauri 2.11, Vite 6.4, TanStack Query 5, Tailwind CSS 4, dnd-kit React/DOM 0.2, chrono, serde, async-trait  
**Storage**: Things 3가 유일한 영구 저장소; 별도 상태 저장소 없음  
**Testing**: Rust 단위/포트 mock 테스트, AppleScript 계약 테스트, Vitest와 React Testing Library, Playwright E2E  
**Target Platform**: macOS 15 이상, Things 3 설치 및 자동화 권한이 있는 환경  
**Project Type**: pnpm/Turbo 모노레포의 Tauri 데스크톱 앱  
**Performance Goals**: 상태 전이 후 5초 이내 성공 또는 실패 피드백, 일반 전이에서 필요한 Things 재조회 3회 이하  
**Constraints**: canonical 태그는 `in progress`; 기존 `status:in-progress` 호환; Done은 실제 완료 상태가 권위; AppleScript 쓰기만 허용; SQLite 쓰기 금지; 관련 없는 태그·메타데이터·PARA 보존  
**Scale/Scope**: 단일 사용자가 명시적으로 이동하는 한 할 일 단위의 상태 전이; 기존 Todo/In Progress/Done 세 상태 유지

## Constitution Check

_GATE: Phase 0 조사 전 및 Phase 1 설계 후 재검사 완료._

- **Things source of truth — PASS**: 열린 상태는 Things 태그에서, Done은 Things 실제 완료 상태에서 도출한다. UI 캐시는 검증 후 Things 응답으로 교체한다.
- **Safe integration — PASS**: 읽기와 쓰기는 기존 Things AppleScript 어댑터만 사용한다. 태그 치환은 canonical/legacy 상태 태그만 제거하고 다른 태그를 보존하며 SQLite 경로를 추가하지 않는다.
- **Architecture — PASS**: 태그 판정은 Rust 도메인 모델, 전이 순서와 검증은 application 유스케이스, 실제 태그·완료 쓰기는 infrastructure 어댑터에 둔다. Tauri command와 React 화면에는 새 비즈니스 규칙을 넣지 않는다.
- **Consistency and recovery — PASS**: In Progress 전이는 태그 변경 후 재조회하고, Done 전이는 상태 태그 제거 후 완료 처리 및 최종 재조회로 검증한다. 어느 단계든 실패하면 성공을 반환하지 않으며 프런트엔드는 저장한 snapshot으로 롤백한 뒤 전체 query를 무효화한다.
- **Tested accessible UX — PASS**: 전이 행렬·태그 보존·부분 실패를 Rust 테스트로, AppleScript 명령 범위를 계약 테스트로, 포인터/키보드 동등성과 롤백을 기존 컴포넌트/E2E 경로로 검증한다.
- **Privacy and scope — PASS**: 로그에 제목·메모·전체 태그를 남기지 않으며 macOS 로컬 Things 연동만 사용한다.

**Post-design re-check**: `data-model.md`은 canonical/legacy 태그와 단계별 전이를 정의하고, `contracts/transition-todo.md`는 쓰기 순서·최종 상태·오류 계약을 고정하며, `quickstart.md`는 태그 보존과 부분 실패 검증을 포함한다. 헌법 위반과 복잡성 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/003-normalize-status-tags/
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
│   ├── entities/todo/
│   └── shared/api/
├── tests/e2e/
└── src-tauri/
    ├── src/
    │   ├── domain/model/todo.rs
    │   ├── domain/ports/things_repository.rs
    │   ├── application/use_cases/transition_todo.rs
    │   ├── inbound/tauri/mod.rs
    │   └── infrastructure/things/applescript/repository.rs
    └── tests/
        └── integration_boundaries.rs
```

**Structure Decision**: 기존 단일 Tauri 앱의 경계를 유지한다. 태그 이름·상태 판정은 도메인에, 여러 Things 쓰기의 조정과 검증은 애플리케이션 유스케이스에, AppleScript 생성과 실행은 인프라에 둔다. 프런트엔드는 기존 `features/move-todo` 낙관적 UI와 접근 가능한 상태 선택을 재사용하고 오류 정산 테스트만 보강한다.

## Implementation Strategy

### Phase 0 — 상태 태그 규칙 고정

1. 도메인에 canonical `in progress` 및 legacy `status:in-progress` 판정 함수를 둔다.
2. 열린 할 일은 둘 중 하나가 있으면 In Progress로 읽되, 명시적 전이 결과에는 canonical 태그만 남긴다.
3. Todo 전이는 모든 진행 상태 태그를 제거하고, In Progress 전이는 모두 제거한 뒤 canonical 태그 하나를 추가한다.
4. Done 전이는 진행 상태 태그를 제거한 결과를 확인한 후 완료 상태를 변경한다.

### Phase 1 — 안전한 전이와 검증

1. 포트의 상태 태그 치환 연산이 관련 없는 태그를 보존한다는 계약 테스트를 먼저 추가한다.
2. 유스케이스에 mock repository를 사용해 호출 순서, 각 단계 실패, 외부 상태 충돌 및 최종 검증을 테스트한다.
3. Done 전이의 최종 응답은 실제 완료 상태이며 canonical/legacy 진행 태그가 없어야 한다.
4. 단계 실패 시 별도 보상 쓰기를 추측하지 않고 오류를 반환한다. UI는 권위 snapshot 재조회로 수렴한다.

### Phase 2 — UI 회귀와 품질

1. 낙관적 이동 실패 시 이전 snapshot 복구와 query 재검증을 테스트한다.
2. 키보드 선택과 드래그가 동일한 transition command를 호출하는지 E2E로 확인한다.
3. 실제 Things smoke test는 전용 테스트 할 일과 명시적 옵트인 환경에서만 수행한다.

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

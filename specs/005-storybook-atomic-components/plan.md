# Implementation Plan: Atomic Storybook 컴포넌트 카탈로그

**Branch**: `005-storybook-atomic-components` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-storybook-atomic-components/spec.md`

## Summary

현재 Board Page에 결합된 시각 요소를 Atomic Design의 Atoms, Molecules, Organisms, Templates, Pages 책임으로 분리하고 각 계층의 실제 컴포넌트를 Storybook 9에서 fixture 기반으로 렌더링한다. 기존 Feature-Sliced Design 경계는 유지하되 각 slice의 `ui/{atoms,molecules,organisms,templates}` 하위에서 시각적 조합 수준을 표현한다. Page의 조회·mutation 조정을 주입 가능한 `BoardTemplate` 바깥에 유지해 Story가 실제 Things에 접근하지 않게 한다. Storybook 전역 preview에서 React Grab을 멱등적으로 한 번 동적 import하고, 실패는 격리해 Story 렌더링을 계속한다.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2  
**Primary Dependencies**: Storybook 9.1, React Vite renderer, React Grab 0.1.50, Vitest 3.2, Playwright 1.54, TanStack Query 5, dnd-kit React/DOM 0.2, Tailwind CSS 4  
**Storage**: N/A; 모든 Story는 메모리 fixture와 mock command만 사용  
**Testing**: Storybook test build, Vitest/React Testing Library, Storybook interaction/a11y 검사, Playwright E2E, TypeScript 구조 검사  
**Target Platform**: 개발·검토용 브라우저 Storybook; 제품 앱은 macOS Tauri  
**Project Type**: pnpm/Turbo 모노레포의 React/Tauri 데스크톱 앱 및 Storybook 카탈로그  
**Performance Goals**: Story 전환 후 2초 이내 대표 상태 표시, React Grab으로 10초 이내 컴포넌트 문맥 확인, 20회 전환에서 중복 초기화 0회  
**Constraints**: FSD 의존 방향 유지; Atomic Design은 각 FSD slice 내부 UI 분류; Storybook에서 실제 Things 접근 금지; React Grab은 Storybook preview 전용 초기화; 기존 앱 UI·접근성·동작 회귀 금지  
**Scale/Scope**: 현재 사용자 노출 컴포넌트 10여 개와 Board Page 한 개, 다섯 Atomic 계층별 최소 한 Story

## Constitution Check

_GATE: Phase 0 조사 전 및 Phase 1 설계 후 재검사 완료._

- **Things source of truth — PASS**: 제품 Page의 Things 권위 흐름은 변경하지 않는다. Story는 비영구 fixture만 사용하며 제2 저장소를 만들지 않는다.
- **Safe integration — PASS**: Storybook preview에서 Tauri command를 mock하고 실제 Things 읽기·쓰기 및 자동화 권한 요청을 차단한다. 백엔드·SQLite 경로 변경은 없다.
- **Architecture — PASS**: Page orchestration은 `pages`, 사용자 action은 `features`, todo/board 표현은 `entities`, 범용 시각 요소는 `shared`에 유지한다. Atomic 폴더는 FSD slice 내부에서만 사용하며 하위 Atomic 계층이 상위 계층을 import하지 않게 한다.
- **Consistency and recovery — PASS**: 제품 mutation 및 rollback 코드는 유지한다. Story 상호작용은 QueryClient와 command mock을 매 Story 초기화해 격리하고 reset한다.
- **Tested accessible UX — PASS**: 각 Story의 접근성 검사, keyboard interaction, 기존 unit/E2E 회귀, Storybook 정적 build를 포함한다. 드래그 예시는 기존 상태 select를 함께 렌더링한다.
- **Privacy and scope — PASS**: Story fixture는 합성 데이터만 사용하고 실제 제목·메모·ID를 포함하지 않는다. React Grab은 개발 Storybook에만 로드되고 제품 build 경로에서 제외된다.

**Post-design re-check**: `data-model.md`은 Atomic 계층과 카탈로그 항목의 의존 규칙을 정의하고, `contracts/component-catalog.md`는 Story 제목·상태·fixture 계약을, `contracts/storybook-preview.md`는 React Grab 및 Things 격리 계약을 고정한다. `quickstart.md`는 다섯 계층, 중복 초기화, 접근성 및 제품 회귀 검증을 포함한다. 헌법 위반과 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/005-storybook-atomic-components/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── component-catalog.md
│   └── storybook-preview.md
└── tasks.md
```

`tasks.md`는 후속 `/speckit.tasks`에서 생성한다.

### Source Code (repository root)

```text
apps/things-kanban/
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── src/
│   ├── shared/ui/atoms/
│   ├── entities/todo/ui/molecules/
│   ├── entities/board/ui/organisms/
│   ├── features/*/ui/
│   └── pages/board/
│       ├── ui/templates/
│       ├── board-page.tsx
│       └── board-page.stories.tsx
├── tests/e2e/
└── package.json
```

**Structure Decision**: FSD를 최상위 구조로 유지하고 Atomic Design을 시각적 조합 수준을 설명하는 하위 분류로 사용한다. 범용 Atom은 `shared/ui/atoms`, 도메인 표현 Molecule은 `entities/todo/ui/molecules`, 보드 영역 Organism은 `entities/board/ui/organisms`, 데이터 독립 레이아웃 Template은 `pages/board/ui/templates`, 실제 orchestration은 `pages/board/board-page.tsx`에 둔다. Feature 소유 action UI는 해당 feature에 유지하되 Story 제목에서 적절한 Atomic 계층으로 분류한다.

## Component Decomposition

| Atomic 계층 | 계획 대상                                                                          | 소유 FSD slice                 |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| Atoms       | IconButton, CountBadge, StatusAnnouncer의 시각/접근성 primitive                    | `shared`, `features/move-todo` |
| Molecules   | RefreshButton, OpenInThingsButton, MoveTodoMenu, TodoCard 내부의 작은 action 조합  | `features`, `entities/todo`    |
| Organisms   | TodoCard, BoardColumn, BoardFilters, BoardSidebar, BoardSkeleton                   | `entities`, `features`         |
| Templates   | BoardTemplate: header, filters, sidebar, 네 칼럼, status bar의 props 기반 레이아웃 | `pages/board`                  |
| Pages       | BoardPage: query, scope, transition, open/refresh orchestration                    | `pages/board`                  |

TodoCard가 feature 컴포넌트를 직접 import하는 기존 역방향 의존은 action slot 또는 callback 기반 molecule/organism 경계로 해소한다. Story는 제품에서 사용하는 동일 export를 import한다.

## Implementation Strategy

### Phase 0 — 카탈로그 및 분해 기준 고정

1. 현재 시각 컴포넌트 목록을 다섯 Atomic 계층에 하나씩 매핑하고 Story title을 `Atoms/...`부터 `Pages/...`까지 고정한다.
2. 범용 시각 primitive만 `shared/ui/atoms`로 추출하고 feature action은 feature slice에 유지한다.
3. `TodoCard`와 `BoardColumn`의 props를 순수 렌더링과 action callback 중심으로 유지하여 Things/Tauri 의존 없이 Story에서 구성한다.
4. `BoardTemplate`을 Page에서 추출해 BoardSnapshot, filters, scope, pending 및 callback을 입력받고 query/mutation hook을 import하지 않게 한다.

### Phase 1 — Storybook 카탈로그와 fixture

1. 기존 합성 board fixture를 Story factory로 확장해 populated, empty, loading, error, pending, conflict 상태를 안정적으로 만든다.
2. 각 대상 컴포넌트에 CSF Story를 colocate하고 Atomic 계층 prefix, controls, interaction 및 a11y parameters를 정의한다.
3. Board Page Story는 매 Story마다 새 QueryClient와 Tauri command mock을 사용하고 실제 Things 호출이 발생하면 테스트가 실패하도록 한다.
4. Storybook 정적 build가 다섯 계층과 대표 상태를 모두 포함하는지 검증한다.

### Phase 2 — React Grab preview 초기화

1. `.storybook/preview.tsx` 모듈 범위에서 `globalThis`에 초기화 promise를 보관하고 `import("react-grab")`을 한 번만 수행한다.
2. 초기화 실패를 catch하여 Story 렌더링과 상호작용을 중단하지 않으며 민감한 Story props를 로그하지 않는다.
3. Story 재렌더링·전환 20회에도 import/handler가 중복되지 않는 테스트 seam을 제공한다.
4. 제품 `main.tsx`의 개발용 초기화와 Storybook 초기화를 분리하고 production build에는 React Grab이 활성화되지 않음을 확인한다.

## Verification Commands

```bash
pnpm check-types
pnpm test
pnpm storybook:test
pnpm test:e2e
pnpm build
pnpm tauri:build
git diff --check
```

## Complexity Tracking

헌법 위반이 없으므로 복잡성 예외가 없다.

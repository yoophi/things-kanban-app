# Implementation Plan: 완료 항목을 포함한 3열 칸반 보드

**Branch**: `002-show-completed-todos` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-show-completed-todos/spec.md`

## Summary

기존 선택형 Done 열을 항상 표시되는 `Todo / In Progress / Done` 3열 보드로 바꾸고, 최근 30일 내 완료 항목을 Things의 실제 완료 상태와 완료일에서 읽는다. 좌측 사이드바에는 Things Area와 Project를 계층적으로 표시하며, 선택한 전체/Area/Project 범위를 프런트엔드의 폐기 가능한 표시 상태로 적용해 메인 칸반을 필터링한다. 기존 AppleScript 쓰기·재검증·낙관적 롤백 계약은 유지하고, 읽기 어댑터와 BoardSnapshot을 완료일 및 완전한 Project–Area 관계까지 확장한다.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Rust 1.89 이상 안정 버전  
**Primary Dependencies**: Tauri 2.11, Vite 6.4, TanStack Query 5, Tailwind CSS 4, dnd-kit React/DOM 0.2, lucide-react  
**Storage**: Things 3가 유일한 영구 저장소; 사이드바 선택과 접힘 상태는 메모리 내 UI 상태이며 재시작 시 전체 보기로 초기화  
**Testing**: Vitest, React Testing Library, Storybook 정적 빌드, Playwright E2E, `cargo test`와 AppleScript 변환 계약 테스트  
**Target Platform**: macOS 15 이상, Things 3 설치 환경  
**Project Type**: pnpm/Turbo 모노레포의 Tauri 데스크톱 앱  
**Performance Goals**: 시작·포커스 복귀 후 5초 이내 3열과 사이드바 표시, 사이드바 범위 변경 후 100ms 이내 카드·개수 갱신, 1,000개 카드와 200개 탐색 노드에서 부드러운 키보드 탐색  
**Constraints**: 최근 완료 30일, 항상 표시되는 3열, macOS 로컬 전용, AppleScript/공식 URL만 쓰기 허용, SQLite 쓰기 금지, 민감한 할 일 내용 로그 금지, 키보드와 보조 기술 동등성 필수  
**Scale/Scope**: 단일 사용자, 최대 1,000개 표시 대상 할 일, 최대 50개 Area와 200개 Project, 한 개의 기본 보드 화면

## Constitution Check

_GATE: Phase 0 조사 전 및 Phase 1 설계 후 재검사 완료._

- **Things source of truth — PASS**: 완료 여부·완료일·Area·Project·태그를 모두 Things에서 읽는다. `BoardScope`와 사이드바 접힘은 표시 상태일 뿐 영구 데이터나 별도 권위가 아니다.
- **Safe integration — PASS**: 이번 변경의 신규 경로는 완료 및 탐색 데이터 읽기다. 기존 완료·완료 취소·태그 쓰기는 공개 AppleScript 속성만 사용하고 동일 ID 재조회 검증을 유지한다. SQLite 접근을 추가하지 않는다.
- **Architecture — PASS**: `entities/navigation`은 순수 탐색 모델, `features/select-board-scope`는 선택 상호작용, `pages/board`는 사이드바·메인 조합을 담당한다. Rust는 도메인 모델, 조회 유스케이스, Tauri command, AppleScript 어댑터 경계를 유지한다.
- **Consistency and recovery — PASS**: 세 열 전이는 기존 검증·롤백 경로를 재사용한다. 포커스 복귀와 수동 새로고침은 탐색 목록과 카드 스냅샷을 함께 교체하며, 선택 ID가 사라지면 전체 보기로 복구한다.
- **Tested accessible UX — PASS**: 완료 기간·범위 선택자 단위 테스트, AppleScript 날짜/계층 계약 테스트, 사이드바 컴포넌트 테스트, 3열 상태 전이와 키보드 탐색 E2E를 계획한다.
- **Privacy and scope — PASS**: 로그에는 ID 축약값과 오류 코드만 기록한다. Things Cloud 또는 비공식 네트워크 API를 사용하지 않는다.

**Post-design re-check**: `data-model.md`은 Things 기반 엔터티와 폐기 가능한 BoardScope를 구분하고, `contracts/`는 읽기 응답과 UI 범위 계약을 명시하며, `quickstart.md`는 데이터 보존·접근성·완료 기간 검증을 포함한다. 헌법 위반이나 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/002-show-completed-todos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── board-command.md
│   └── sidebar-ui.md
└── tasks.md
```

`tasks.md`는 후속 `/speckit.tasks`에서 생성한다.

### Source Code (repository root)

```text
apps/things-kanban/
├── src/
│   ├── app/
│   ├── pages/
│   │   └── board/
│   ├── features/
│   │   ├── filter-board/
│   │   ├── move-todo/
│   │   ├── refresh-board/
│   │   └── select-board-scope/
│   ├── entities/
│   │   ├── board/
│   │   ├── navigation/
│   │   └── todo/
│   └── shared/
└── src-tauri/src/
    ├── domain/
    │   └── model/
    ├── application/
│   └── queries/
    ├── inbound/
    │   └── tauri/
    └── infrastructure/
        └── things/
            └── applescript/
```

**Structure Decision**: 기존 단일 앱 구조를 확장한다. 사이드바 탐색 모델은 `entities/navigation`, 선택·접기 상호작용은 `features/select-board-scope`, 전체 레이아웃은 `pages/board`에 둔다. 백엔드는 기존 `get_board` 응답을 확장하되 UI 선택 상태를 알지 않으며, Things 구조와 최근 완료 데이터를 완전한 스냅샷으로 제공한다.

## Implementation Strategy

### Phase 0 — 읽기 계약 보강

1. AppleScript 사전의 완료일, Project ID/이름/Area, Area ID/이름을 공개 속성으로 읽는 계약 테스트를 먼저 작성한다.
2. 날짜는 AppleScript가 ISO 8601 문자열로 직렬화해 Rust가 명시적으로 파싱하고, 없는 날짜는 `None`으로 보존한다.
3. `get_board`는 기본적으로 최근 30일 완료를 포함하고, 취소 항목과 기간 밖 완료를 제외한다.
4. Project와 Area는 할 일에서 우연히 발견된 항목뿐 아니라 활성 컬렉션에서 별도로 읽어 빈 Project도 사이드바에 표시한다.

### Phase 1 — 3열 보드

1. `showDone` 토글과 2열 레이아웃 분기를 제거하고 항상 완료 포함 쿼리를 사용한다.
2. `Todo`, `In Progress`, `Done · 최근 30일` 세 열과 각 열의 독립 빈 상태·개수를 항상 렌더링한다.
3. 완료 및 완료 취소 전이는 기존 `transition_todo` 계약을 재사용하고 전체 스냅샷 갱신으로 수렴시킨다.

### Phase 2 — 사이드바 범위 탐색

1. BoardSnapshot의 Area·Project 관계에서 안정적인 SidebarNode 트리를 파생한다.
2. `all | area(id) | project(id)` BoardScope와 사이드바 접힘을 프런트엔드 UI 상태로 관리한다.
3. Area 선택은 `todo.area.id == areaId` 또는 `todo.project.area.id == areaId`, Project 선택은 `todo.project.id == projectId` 규칙으로 필터링한다.
4. 전체/Area/Project 선택, 독립 Project 그룹, 현재 범위 제목, 접기·펼치기와 키보드 선택을 구현한다.
5. 새 스냅샷에 선택 ID가 없으면 전체 보기로 복구하고 라이브 영역에 알린다.

### Phase 3 — 회귀·품질

1. 동일 이름·긴 이름·빈 범위·삭제된 선택·1,000개 카드/200개 노드 성능을 검증한다.
2. Storybook에 전체/Area/Project/접힌 사이드바/빈 범위 상태를 추가한다.
3. 키보드 사이드바 탐색과 세 열 상태 전이 E2E를 실행한다.

## Verification Commands

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

실제 Things 쓰기 smoke test는 기존과 같이 전용 테스트 할 일과 명시적 옵트인 환경에서만 실행한다.

## Complexity Tracking

헌법 위반이 없으므로 복잡성 예외가 없다.

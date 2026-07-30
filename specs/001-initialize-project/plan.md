# Implementation Plan: Things 칸반 프로젝트 초기 구성

**Branch**: `001-initialize-project` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-initialize-project/spec.md`

## Summary

Things 3를 유일한 원본으로 유지하는 macOS 칸반 데스크톱 앱의 실행 가능한 초기 구조를 만든다. pnpm/Turbo 모노레포 안에 Tauri 2·Rust 백엔드와 React 19 프런트엔드를 구성하고, AppleScript 기반 Things 읽기·쓰기 포트, Tauri command 계약, FSD 보드 UI, 검증 후 확정되는 상태 전이, 검색·필터, 접근 가능한 드래그 앤 드롭을 수직 슬라이스로 구현한다. Things CLI는 현재 환경에 없으므로 MVP 필수 경로에서 제외하고, SQLite는 AppleScript로 충족할 수 없는 읽기가 확인될 때만 읽기 전용 어댑터로 추가한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Rust 1.89 이상 안정 버전  
**Primary Dependencies**: Tauri 2, Vite, TanStack Query, Tailwind CSS 4, shadcn/ui, 최신 안정 `@dnd-kit/react` 및 `@dnd-kit/dom`, serde, thiserror, tracing  
**Storage**: Things 3가 유일한 영구 저장소; 프런트엔드 쿼리 캐시는 폐기 가능하며 별도 로컬 할 일 데이터베이스 없음  
**Testing**: Vitest, React Testing Library, Storybook, Playwright 기반 Tauri E2E, `cargo test`, Rust 어댑터 계약/통합 테스트  
**Target Platform**: macOS 15 이상, Things 3 설치 환경  
**Project Type**: pnpm/Turbo 모노레포의 단일 Tauri 데스크톱 앱과 공유 UI 패키지  
**Performance Goals**: 시작 또는 포커스 복귀 후 5초 이내 보드/조치 안내 표시, 상태 전이 3초 이내 확정 또는 복구, 대표 활성 할 일 1,000개에서 검색·필터 입력 후 100ms 이내 화면 갱신  
**Constraints**: macOS 로컬 전용, 오프라인 동작, AppleScript 또는 공식 URL scheme만 쓰기 허용, SQLite 직접 쓰기 금지, 민감한 본문/메모 로그 금지, 드래그 앤 드롭과 동등한 키보드 조작 필수  
**Scale/Scope**: 단일 사용자, 한 개 보드 화면과 설정 기반 골격, `To Do`/`In Progress` 및 선택적 `Done`, 최근 완료 최대 30일 기본 조회, 활성 할 일 약 1,000개 목표

## Constitution Check

*GATE: Phase 0 조사 전 및 Phase 1 설계 후 재검사 완료.*

- **Things source of truth — PASS**: `ThingsRepository`가 모든 할 일·프로젝트·Area·태그·완료 상태를 제공한다. TanStack Query와 낙관적 상태는 폐기 가능한 화면 캐시일 뿐 영구 기준 데이터가 아니다.
- **Safe integration — PASS**: MVP 읽기와 쓰기는 Things의 공개 AppleScript 사전을 사용한다. 개별 항목 열기는 AppleScript `show` 또는 공식 URL scheme을 사용한다. Things CLI는 설치되지 않아 필수 경로에서 제외하며 SQLite 어댑터는 구현하지 않는다.
- **Architecture — PASS**: 프런트엔드는 `app/pages/features/entities/shared`, 생성 UI는 `components/ui`; 백엔드는 `domain/application/inbound/infrastructure`로 분리한다. 도메인과 애플리케이션은 Tauri 및 프로세스 실행을 모른다.
- **Consistency and recovery — PASS**: `transition_todo`는 이전/목표 상태를 받아 대상 태그만 보존적으로 수정하고, 재조회 결과를 반환한다. UI는 실패 시 이전 쿼리 스냅샷으로 롤백한다. 충돌 태그는 조회 결과에 명시한다.
- **Tested accessible UX — PASS**: 상태 매핑 단위 테스트, AppleScript 변환/계약 테스트, Tauri command 테스트, 보드 컴포넌트·E2E를 계획한다. 키보드 센서, 명시적 이동 메뉴, 라이브 영역으로 포인터와 동등한 경로를 제공한다.
- **Privacy and scope — PASS**: 구조화 로그는 작업 ID, 동작, 오류 종류만 기록하고 제목·본문·메모·태그 값은 기본 제외한다. Things Cloud와 비공식 네트워크 API를 사용하지 않는다.

**Post-design re-check**: `data-model.md`의 파생 상태와 전이 규칙, `contracts/`의 명시적 읽기/쓰기 계약 및 `quickstart.md`의 테스트 게이트가 위 원칙을 보존한다. 위반이나 정당화가 필요한 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/001-initialize-project/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── tauri-commands.md
│   └── things-repository.md
└── tasks.md
```

`tasks.md`는 후속 `/speckit.tasks` 명령에서 생성한다.

### Source Code (repository root)

```text
things-kanban-app/
├── apps/
│   └── things-kanban/
│       ├── src/
│       │   ├── app/
│       │   │   ├── providers/
│       │   │   └── styles/
│       │   ├── pages/
│       │   │   └── board/
│       │   ├── features/
│       │   │   ├── filter-board/
│       │   │   ├── move-todo/
│       │   │   ├── open-in-things/
│       │   │   └── refresh-board/
│       │   ├── entities/
│       │   │   ├── board/
│       │   │   └── todo/
│       │   └── shared/
│       │       ├── api/
│       │       ├── lib/
│       │       └── ui/
│       ├── components/
│       │   └── ui/
│       ├── tests/
│       │   └── e2e/
│       └── src-tauri/
│           └── src/
│               ├── domain/
│               │   ├── model/
│               │   └── ports/
│               ├── application/
│               │   ├── queries/
│               │   └── use_cases/
│               ├── inbound/
│               │   └── tauri/
│               └── infrastructure/
│                   └── things/
│                       ├── applescript/
│                       └── url_scheme/
├── packages/
│   └── ui/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── Cargo.toml
```

**Structure Decision**: GOAL.md와 헌법이 지정한 단일 데스크톱 앱 모노레포를 사용한다. UI 상호작용은 FSD 슬라이스에, Things 접근은 Rust 헥사고날 어댑터에 한정한다. `packages/ui`는 앱 도메인을 모르는 재사용 프리미티브만 포함하고, 앱 특화 카드는 `entities/todo`에 둔다.

## Implementation Strategy

### Phase 0 — 연동과 기반 검증

1. 워크스페이스, Tauri 앱, 공통 검사 명령과 빈 보드 셸을 구성한다.
2. Things AppleScript 사전의 텍스트 ID, 상태, 태그, 프로젝트/Area, 날짜, `show` 지원을 고정된 계약 테스트로 검증한다.
3. `@dnd-kit` 최신 안정 패키지를 React 19에서 설치해 다중 열, 키보드 센서, 라이브 알림 스파이크를 통과시킨 뒤 정확한 버전을 잠근다.
4. Things 미설치, 자동화 권한 거부, 스크립트 오류를 구분하는 오류 모델을 확정한다.

### Phase 1 — 읽기 전용 보드

1. 순수 도메인 모델과 `ThingsRepository` 포트를 만든다.
2. AppleScript JSON 출력 어댑터와 `get_board` command를 구현한다.
3. TanStack Query 기반 조회, 보드 열·카드, 로딩·빈 상태·오류 UI를 구현한다.
4. 포커스 복귀와 수동 새로고침, 검색·필터·정렬을 연결한다.

### Phase 2 — 안전한 상태 전이와 원본 열기

1. 상태 전이 검증·정규화·재조회 유스케이스와 `transition_todo` command를 구현한다.
2. 낙관적 UI, 실패 롤백, 중복 요청 방지 및 재시도 흐름을 구현한다.
3. 포인터 드래그, 키보드 드래그, 명시적 이동 메뉴와 스크린리더 알림을 동일 유스케이스에 연결한다.
4. 완료/완료 취소와 `open_in_things`를 추가하고 보존성 계약 테스트를 통과시킨다.

### Phase 3 — 품질 게이트

1. 최근 완료 표시, 대표 1,000개 데이터 성능, 외부 변경 수렴을 검증한다.
2. Storybook 상태별 스토리와 핵심 E2E를 추가한다.
3. 타입 검사, 프런트엔드 테스트, Rust 테스트, Tauri 빌드, 키보드 접근성 검사를 릴리스 게이트로 고정한다.

## Verification Commands

```bash
pnpm install
pnpm check-types
pnpm test
pnpm storybook:test
cargo test --workspace
pnpm tauri:build
pnpm test:e2e
```

각 명령의 실제 루트 스크립트 이름은 초기 워크스페이스 생성 시 위 계약에 맞춰 정의한다. 실제 Things 데이터를 변경하는 통합 테스트는 전용 테스트 할 일과 명시적 옵트인 환경에서만 실행하고, 기본 자동 테스트는 포트 대역을 사용한다.

## Complexity Tracking

헌법 위반이 없으므로 기록할 복잡성 예외가 없다.

<!--
동기화 영향 보고서
- 버전 변경: 미제정 템플릿 → 1.0.0
- 변경된 원칙:
  - 템플릿 원칙 1 → I. Things를 단일 원본으로 유지
  - 템플릿 원칙 2 → II. 안전한 Things 연동
  - 템플릿 원칙 3 → III. 아키텍처 경계 준수
  - 템플릿 원칙 4 → IV. 상태 일관성과 복구
  - 템플릿 원칙 5 → V. 테스트되고 접근 가능한 데스크톱 UX
- 추가된 섹션:
  - 기술 및 데이터 제약
  - 개발 워크플로 및 품질 게이트
- 제거된 섹션: 없음
- 템플릿:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ 실행 지침 검토: README.md, GOAL.md, AGENTS.md
  - ✅ 명령 템플릿: 디렉터리가 없어 변경 불필요
- 후속 TODO: 없음
-->
# Things Kanban Constitution

## Core Principles

### I. Things를 단일 원본으로 유지

Things 3는 할 일, 완료 상태, 프로젝트, Area 및 태그의 유일한 기준 저장소여야
한다(MUST). 앱은 별도의 기준 할 일 저장소를 만들거나 Things 외부에 독자적인 완료
상태를 만들어서는 안 된다(MUST NOT). 칸반 작업 상태는 Things 태그에서 도출해야
하며(MUST), `Done`은 Things의 실제 완료 상태를 사용해야 한다(MUST). 모든 캐시는
폐기 가능해야 하고 Things 데이터로부터 다시 생성할 수 있어야 한다(MUST).

근거: 사용자가 데이터 불일치나 앱 종속 없이 Things와 이 앱을 오갈 수 있어야 한다.

### II. 안전한 Things 연동

Things 쓰기는 AppleScript 또는 공식 Things URL scheme만 사용해야 한다(MUST).
Things SQLite 데이터베이스에 직접 쓰는 것은 금지한다. SQLite가 필요할 때는 읽기
전용으로 사용하고 인프라 어댑터 뒤에 격리해야 한다(MUST). 설치된 Things CLI는
동작과 식별자 호환성을 검증한 후에만 사용할 수 있다(MAY). 쓰기 작업은 명시적인
할 일을 대상으로 하며 관련 없는 태그와 메타데이터를 보존해야 한다(MUST). 새 할
일은 기존 PARA Project 또는 Area에 배치하고 Inbox에 방치해서는 안 된다(MUST NOT).

근거: 지원되지 않는 쓰기 경로는 Things Cloud 동기화 또는 사용자 데이터를 손상할
수 있다.

### III. 아키텍처 경계 준수

React 프런트엔드는 Feature-Sliced Design을 따라야 한다(MUST). 앱 조합은 `app`,
화면은 `pages`, 사용자 상호작용은 `features`, 도메인 모델과 어댑터는 `entities`,
도메인 공통 코드는 `shared`에 둔다. 생성된 shadcn/ui 컴포넌트는
`components/ui`에 유지해야 한다(MUST).

Tauri 백엔드는 헥사고날 아키텍처를 따라야 한다(MUST). 순수 모델과 포트는
`domain`, 유스케이스는 `application`, Tauri command는 `inbound`, Things 및 OS
연동은 `infrastructure`에 둔다. 도메인과 애플리케이션 코드는 Tauri, AppleScript,
CLI 프로세스, URL scheme, SQLite 또는 파일시스템 구현에 의존해서는 안 된다
(MUST NOT). 인바운드 command는 비즈니스 로직을 직접 포함하지 않고 애플리케이션
서비스에 위임해야 한다(MUST).

근거: Things 연동 수단이 바뀌더라도 작업 규칙이나 UI를 다시 작성하지 않고 교체할
수 있어야 한다.

### IV. 상태 일관성과 복구

모든 상태 전이는 하나의 명확한 목표 상태를 가져야 하며(MUST), Things 쓰기가
확인되기 전까지 이전 상태를 복구할 수 있어야 한다(MUST). 낙관적 UI는 실패 시
카드를 원래 상태로 되돌리고 명확한 재시도 경로를 제공할 때만 허용한다. 쓰기 후에는
Things를 다시 읽거나 동등한 방법으로 기준 상태를 검증해야 한다(MUST). 충돌하는
상태 태그는 사용자에게 표시해야 하며(MUST), 명시적인 상태 전이 전에 자동으로
덮어써서는 안 된다(MUST NOT). Things에서 발생한 외부 변경은 새로고침 또는 앱
포커스 복귀 후 보드에 수렴해야 한다(MUST).

근거: 화면의 보드 상태가 확인되지 않았거나 실패한 변경을 성공한 것처럼 보여서는
안 된다.

### V. 테스트되고 접근 가능한 데스크톱 UX

각 사용자 스토리는 독립적인 인수 경로와 적절한 수준의 자동화 테스트를 정의해야
한다(MUST). 상태 매핑 및 전이 규칙에는 단위 테스트, Things 어댑터에는 계약 또는
통합 테스트, 핵심 보드 흐름에는 컴포넌트 또는 E2E 테스트가 있어야 한다(MUST).
릴리스 전 TypeScript 타입 검사, Rust 테스트, 프런트엔드 테스트 및 Tauri 빌드
검사를 통과해야 한다(MUST).

드래그 앤 드롭에는 키보드로 실행 가능한 동등한 조작이 있어야 한다(MUST). 상태
변경, 로딩, 빈 상태, 권한 오류 및 연동 실패는 색상에만 의존하지 않고 인식할 수
있어야 한다(MUST). UI는 간결하고 macOS 데스크톱 관례와 일관되어야 한다(MUST).

근거: 핵심 흐름이 사용자 데이터를 변경하므로 정확성과 접근성은 선택적 마무리가
아니라 릴리스 요건이다.

## Technology and Data Constraints

- 데스크톱 앱은 macOS를 대상으로 하며 Tauri 2와 Rust를 사용해야 한다(MUST).
- 프런트엔드는 React 19, TypeScript, Vite, TanStack Query, Tailwind CSS 4 및
  shadcn/ui를 사용하고 pnpm과 Turbo로 관리해야 한다(MUST).
- 새 의존성에는 구체적인 요구사항이 있어야 한다(MUST). 드래그 앤 드롭 라이브러리는
  도입 전에 React 19 호환성, 키보드 접근성 및 다중 컨테이너 지원을 검증해야 한다.
- 앱은 Things Cloud 또는 문서화되지 않은 네트워크 API에 직접 연결해서는 안 된다
  (MUST NOT).
- 로그는 기본적으로 할 일 메모, 인증 토큰 및 기타 민감한 내용을 제외해야 한다
  (MUST).
- 프로젝트 문서의 다이어그램은 Mermaid 문법을 사용해야 하며(MUST), ASCII
  다이어그램은 금지한다.
- 도구가 강제하는 형식을 제외한 프로젝트 문서 내용은 한국어로 작성해야 한다(MUST).

## Development Workflow and Quality Gates

1. 모든 기능은 우선순위가 있고 독립적으로 테스트 가능한 사용자 스토리와 측정 가능한
   인수 기준으로 시작해야 한다(MUST).
2. 계획에는 영향을 받는 도메인 규칙, Things 읽기/쓰기 경로, macOS 권한, 실패 복구,
   접근성 및 검증 명령을 식별해야 한다(MUST).
3. 연동 방식을 채택하기 전에 조사 단계에서 식별자 호환성과 쓰기 안전성을 확인해야
   한다(MUST).
4. 작업 목록은 테스트와 정확한 파일 경로를 포함하고 프런트엔드 FSD 및 백엔드
   헥사고날 경계를 보존해야 한다(MUST).
5. 리뷰는 다섯 가지 핵심 원칙을 모두 검증해야 한다(MUST). 예외는 거부한 단순한
   대안과 함께 계획의 Complexity Tracking 표에 기록해야 한다(MUST).
6. 기능은 인수 시나리오가 통과하고, 변경 후 Things 상태가 확인되며, 오류 복구가
   입증되고, 관련 타입·테스트·빌드 검사를 통과해야만 완료된다(MUST).

## Governance

이 헌법은 충돌하는 프로젝트 관례와 생성 템플릿보다 우선한다. 개정 시에는 변경
이유, 영향을 받는 원칙, 템플릿 및 문서 전파 결과를 기록해야 하며(MUST), 기존
동작이 바뀌면 마이그레이션 지침을 포함해야 한다(MUST).

버전은 시맨틱 버저닝을 따른다.

- MAJOR: 원칙 또는 거버넌스 규칙을 제거하거나 호환되지 않게 재정의할 때
- MINOR: 새 원칙이나 섹션을 추가하거나 의무를 실질적으로 확장할 때
- PATCH: 요구 동작을 바꾸지 않는 명확화

모든 기능 계획은 조사 전에 Constitution Check를 완료하고 설계 후 다시 검사해야
한다(MUST). 모든 구현 리뷰는 헌법 준수를 검증해야 한다(MUST). 정당화되지 않은
위반은 구현 또는 릴리스를 차단한다. 실행 지침은 `AGENTS.md`, 제품 의도와 범위는
`GOAL.md`에서 관리한다.

**Version**: 1.0.0 | **Ratified**: 2026-07-30 | **Last Amended**: 2026-07-30

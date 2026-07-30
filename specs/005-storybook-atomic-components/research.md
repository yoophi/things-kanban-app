# Phase 0 Research: Atomic Storybook 컴포넌트 카탈로그

## 1. Atomic Design과 Feature-Sliced Design의 결합

**Decision**: FSD를 최상위 소유·의존 경계로 유지하고 Atomic Design을 각 slice 내부 시각 컴포넌트의 조합 수준과 Storybook 탐색 분류로 적용한다.

**Rationale**:

- 프로젝트 헌법이 FSD 경계를 의무화한다.
- Atomic 계층만 최상위 폴더로 만들면 Page, feature, entity의 도메인 소유권이 사라진다.
- Story title은 소스 소유권과 독립적으로 다섯 계층을 일관되게 보여줄 수 있다.

**Alternatives considered**:

- **저장소 최상위에 atoms/molecules/organisms를 병렬 배치**: FSD 도메인 경계와 import 방향을 훼손해 거부했다.
- **파일 이동 없이 Story title만 변경**: 구조 분해 요구와 기존 TodoCard의 역방향 의존을 해결하지 못해 거부했다.

## 2. Board Page의 Template 분리

**Decision**: 조회·mutation hook을 사용하는 `BoardPage`와 props만으로 레이아웃을 그리는 `BoardTemplate`을 분리한다.

**Rationale**:

- Template Story가 Tauri나 Things 없이 모든 시각 상태를 재현할 수 있다.
- Page는 orchestration, Template은 레이아웃이라는 Atomic 책임이 명확해진다.
- 기존 board E2E는 Page를, Storybook은 Template과 Page 양쪽을 검증할 수 있다.

**Alternatives considered**:

- **Page만 mock provider로 렌더링**: 작은 레이아웃 상태를 보기 어렵고 모든 Story가 query 설정에 결합되어 거부했다.
- **Template이 query hook 사용**: Template의 데이터 독립 계약을 위반해 거부했다.

## 3. React Grab 초기화 위치와 멱등성

**Decision**: Storybook 전역 preview 모듈에서 React Grab을 동적 import하고 `globalThis`의 전용 promise로 한 번만 초기화한다. 실패는 catch하여 렌더링을 계속한다.

**Rationale**:

- 모든 Story iframe에 동일하게 적용된다.
- decorator 렌더마다 import하면 StrictMode와 Story 전환에서 중복 side effect 위험이 있다.
- promise 캐시는 동시 초기화 요청도 하나로 합친다.

**Alternatives considered**:

- **각 Story decorator에서 import**: Story 수만큼 초기화될 수 있어 거부했다.
- **Storybook manager에 초기화**: 컴포넌트가 렌더링되는 preview iframe을 검사하지 못해 거부했다.
- **정적 top-level import**: 실패 격리와 제품 build 경계 확인이 어려워 동적 import를 선택했다.

## 4. Story의 Things 격리

**Decision**: 모든 Story는 합성 fixture를 사용하며 Page Story는 Tauri command mock과 새 QueryClient를 Story 단위로 구성한다. 예상하지 않은 command 호출은 명시적으로 실패시킨다.

**Rationale**:

- 브라우저 Storybook에는 macOS 자동화가 없고 사용자 데이터 접근이 불필요하다.
- 매 Story 상태를 reset하면 interaction 결과가 다른 Story로 누출되지 않는다.
- 실제 Things가 없어도 CI에서 동일하게 재현된다.

**Alternatives considered**:

- **개발자의 Things를 읽어 현실적 데이터 사용**: 개인정보 노출과 비결정성을 만들어 거부했다.
- **Page Story 제외**: 다섯 계층 대표 Story 요구를 충족하지 못해 거부했다.

## 5. Story 대상과 상태 범위

**Decision**: 사용자에게 보이는 컴포넌트를 대상으로 하며 정상 외에 실제 지원하는 loading, empty, error, pending, conflict 및 keyboard interaction 상태를 제공한다. hook/provider는 독립 시각 Story에서 제외한다.

**Rationale**:

- 시각 검토 가치가 있는 단위에 집중한다.
- 기존 오류·접근성 상태를 독립적으로 재현할 수 있다.
- Story 수를 기계적으로 늘리지 않고 사용자 행동을 기준으로 한다.

**Alternatives considered**:

- **모든 export에 Story 생성**: 비시각 코드에 무의미한 Story가 생겨 거부했다.
- **정상 상태만 제공**: 회귀가 자주 발생하는 로딩·오류·빈 상태를 검토할 수 없어 거부했다.

## Resolved Unknowns

- 구조 결합: FSD 최상위 + slice 내부 Atomic UI 계층
- Template 경계: props 기반 BoardTemplate과 orchestration BoardPage 분리
- React Grab: preview 전역 동적 import + global promise + 실패 격리
- Things 접근: 합성 fixture 및 command mock만 허용
- Story 범위: 사용자 노출 시각 컴포넌트와 적용 가능한 대표 상태

계획을 막는 미해결 질문은 없다.

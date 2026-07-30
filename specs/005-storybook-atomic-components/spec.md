# Feature Specification: Atomic Storybook 컴포넌트 카탈로그

**Feature Branch**: `005-storybook-atomic-components`  
**Created**: 2026-07-30  
**Status**: Draft  
**Input**: User description: "React 컴포넌트를 Storybook으로 표시한다. Atomic Design 규칙에 따라 구조 분해하고 표시한다. Storybook으로 표시되는 컴포넌트에 React Grab을 초기화해 피드백하기 편리하도록 한다."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 컴포넌트를 계층별로 탐색 (Priority: P1)

디자이너와 개발자는 앱의 UI 구성요소를 Atomic Design의 Atoms, Molecules, Organisms, Templates, Pages 계층으로 탐색하고 각 구성요소의 대표 상태를 독립적으로 확인한다.

**Why this priority**: UI 구성요소의 책임과 조합 관계를 일관된 분류로 볼 수 있어야 재사용, 검토 및 변경 범위를 빠르게 판단할 수 있다.

**Independent Test**: 컴포넌트 카탈로그를 열어 다섯 계층이 구분되어 있고, 앱에서 사용하는 각 대상 구성요소가 정확히 한 주 계층에 배치되며 대표 상태를 독립 렌더링하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 카탈로그가 실행되었을 때, **When** 사용자가 탐색 메뉴를 보면, **Then** Atoms, Molecules, Organisms, Templates, Pages 순서로 구성요소가 분류되어 있다.
2. **Given** 하나의 구성요소에 정상, 로딩, 빈 상태, 오류 또는 상호작용 상태가 있을 때, **When** 해당 구성요소 항목을 열면, **Then** 지원하는 대표 상태를 실제 앱 화면 전체를 실행하지 않고 확인할 수 있다.
3. **Given** 조합형 구성요소를 선택했을 때, **When** 렌더링 결과를 확인하면, **Then** 하위 계층 구성요소를 재사용한 실제 앱과 일관된 모양 및 동작을 볼 수 있다.

---

### User Story 2 - Atomic Design 구조로 책임 분리 (Priority: P2)

개발자는 기존 화면 구성요소를 Atomic Design 책임에 따라 분해하여, 작은 시각 요소부터 완성 화면까지 예측 가능한 경계와 조합 관계를 유지한다.

**Why this priority**: 카탈로그만 추가하고 실제 구성요소 경계가 불명확하면 중복과 화면별 변형이 계속 늘어나므로 구조적 기준이 필요하다.

**Independent Test**: 대표 보드 화면 하나를 선택해 Pages→Templates→Organisms→Molecules→Atoms 의존 방향으로 조합되고, 하위 계층이 상위 계층을 참조하지 않는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 단일 목적의 최소 UI 요소일 때, **When** 구조를 검토하면, **Then** Atom으로 분류되며 앱 비즈니스 흐름에 의존하지 않는다.
2. **Given** 여러 Atom을 결합한 작은 상호작용 단위일 때, **When** 구조를 검토하면, **Then** Molecule로 분류되고 하나의 명확한 사용자 목적을 가진다.
3. **Given** 화면의 독립된 주요 영역일 때, **When** 구조를 검토하면, **Then** Organism으로 분류되며 Molecule과 Atom을 조합한다.
4. **Given** 데이터와 화면 내용을 주입받는 레이아웃일 때, **When** 구조를 검토하면, **Then** Template으로 분류되고 특정 데이터 원본에 의존하지 않는다.
5. **Given** 실제 앱 진입 화면일 때, **When** 구조를 검토하면, **Then** Page로 분류되고 상태 조회 및 사용자 흐름을 Template에 연결한다.

---

### User Story 3 - 렌더링된 요소에 빠르게 피드백 (Priority: P3)

검토자는 카탈로그에 표시된 구성요소를 직접 선택해 어떤 React 구성요소와 소스 위치인지 식별하고, 시각적 피드백에 필요한 문맥을 빠르게 수집한다.

**Why this priority**: 화면 캡처나 모호한 위치 설명 대신 정확한 구성요소 문맥을 공유하면 피드백 전달과 수정 시간이 줄어든다.

**Independent Test**: 카탈로그의 각 Atomic Design 계층에서 대표 구성요소를 하나씩 열고 렌더링된 요소를 선택하여 구성요소 이름과 소스 문맥을 확인할 수 있는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 카탈로그 미리보기에서 구성요소가 렌더링되었을 때, **When** 검토자가 React Grab으로 요소를 선택하면, **Then** 해당 React 구성요소를 식별할 수 있는 피드백 문맥을 얻는다.
2. **Given** 카탈로그 밖의 실제 배포 앱이 실행되었을 때, **When** 사용자가 앱을 이용하면, **Then** 카탈로그용 피드백 도구가 앱의 성능, 입력 또는 화면에 영향을 주지 않는다.
3. **Given** React Grab 초기화가 실패하거나 지원되지 않는 환경일 때, **When** 카탈로그를 열면, **Then** 구성요소 탐색과 상호작용은 계속 가능하고 실패가 화면 전체를 중단하지 않는다.

### Edge Cases

- 시각적 출력이 없는 provider 또는 hook은 독립 시각 Story 대상에서 제외하되 이를 사용하는 구성요소 Story에서 동작을 검증한다.
- 동일 구성요소가 여러 계층에 적합해 보이면 가장 작은 독립 책임과 실제 조합 역할을 기준으로 하나의 주 계층에만 배치한다.
- 데이터 조회가 필요한 Page는 고정 fixture와 대체 응답을 사용하며 실제 Things 데이터나 자동화 권한을 요구하지 않는다.
- 드래그 앤 드롭, 포털, 팝오버처럼 미리보기 경계를 벗어나는 UI도 포인터와 키보드 상호작용을 확인할 수 있어야 한다.
- React Grab 초기화가 여러 Story 전환에서 반복되더라도 중복 핸들러 또는 중복 오버레이를 만들지 않는다.
- 구성요소가 이름 없는 wrapper 또는 fragment를 포함해도 검토자는 가장 가까운 식별 가능한 React 구성요소 문맥을 얻는다.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 시스템은 카탈로그 대상 React 구성요소를 Atoms, Molecules, Organisms, Templates, Pages 다섯 계층으로 분류해야 한다.
- **FR-002**: 각 대상 구성요소는 하나의 주 Atomic Design 계층과 안정적으로 연결되어야 한다.
- **FR-003**: 하위 계층 구성요소는 상위 계층 구성요소에 의존하지 않아야 한다.
- **FR-004**: 카탈로그는 각 구성요소가 지원하는 정상, 로딩, 빈 상태, 오류 및 상호작용 상태 중 적용 가능한 대표 상태를 제공해야 한다.
- **FR-005**: 카탈로그의 조합형 구성요소는 실제 앱이 사용하는 구성요소와 스타일을 재사용해야 한다.
- **FR-006**: Template은 상태와 내용을 입력받는 레이아웃이어야 하며 특정 데이터 원본을 직접 조회하지 않아야 한다.
- **FR-007**: Page는 앱의 상태 조회와 사용자 흐름을 Template 및 하위 구성요소에 연결해야 한다.
- **FR-008**: 카탈로그는 고정되고 재현 가능한 fixture를 사용하여 같은 Story가 반복 실행되어도 동일한 핵심 결과를 보여야 한다.
- **FR-009**: 카탈로그 미리보기에서 렌더링되는 React 구성요소에는 React Grab 피드백 기능이 초기화되어야 한다.
- **FR-010**: React Grab은 미리보기 환경에서 한 번만 유효하게 초기화되고 Story 전환 시 중복 이벤트 처리나 오버레이를 만들지 않아야 한다.
- **FR-011**: React Grab을 사용할 수 없거나 초기화가 실패해도 카탈로그 구성요소 렌더링과 상호작용은 계속 가능해야 한다.
- **FR-012**: 카탈로그용 React Grab 기능은 실제 배포 앱에서 활성화되지 않아야 한다.
- **FR-013**: 검토자는 각 Atomic Design 계층의 렌더링된 구성요소를 선택하여 구성요소 식별 문맥을 얻을 수 있어야 한다.
- **FR-014**: 구조 분해 후에도 기존 앱의 사용자 동작, 시각적 결과 및 접근 가능한 이름이 유지되어야 한다.
- **FR-015**: 카탈로그는 구성요소별 제어 가능한 입력과 주요 사용자 상호작용 결과를 검증할 수 있어야 한다.

### Things Integration and Safety _(mandatory when Things data is read or written)_

- **TI-001**: 카탈로그와 모든 Story는 fixture만 사용하며 실제 Things 데이터 읽기나 쓰기를 수행하지 않아야 한다.
- **TI-002**: Page 및 상호작용 Story는 Things 연동을 대체 응답으로 격리하고 macOS 자동화 권한을 요청하지 않아야 한다.
- **TI-003**: Story 상호작용은 fixture 상태만 변경할 수 있으며 실제 Things 태그, 완료 상태, 메타데이터 또는 PARA 배치에 영향을 주지 않아야 한다.
- **TI-004**: 실제 Things가 실행 중이지 않거나 사용할 수 없는 환경에서도 전체 카탈로그가 렌더링되어야 한다.
- **TI-005**: 카탈로그의 오류 예시는 실제 할 일 제목, 메모, 태그 또는 식별자를 로그나 fixture에 복사하지 않아야 한다.

### Accessibility Requirements _(mandatory for interactive UI)_

- **AR-001**: 카탈로그의 모든 드래그 앤 드롭 예시는 동일한 결과를 내는 키보드 접근 가능한 상태 선택 수단을 함께 제공해야 한다.
- **AR-002**: 정상, 로딩, 빈 상태, 성공 및 실패 상태는 색상에만 의존하지 않고 인지할 수 있어야 한다.
- **AR-003**: 각 상호작용 Story는 키보드만으로 주요 흐름을 완료할 수 있어야 한다.
- **AR-004**: Atomic Design 구조 분해 과정에서 기존 구성요소의 접근 가능한 이름, 역할, 포커스 순서와 live region 동작을 유지해야 한다.

### Key Entities _(include if feature involves data)_

- **Component Catalog Entry**: 구성요소의 표시 이름, Atomic Design 계층, 대표 상태, 입력 및 상호작용 예시를 나타낸다.
- **Atomic Design Layer**: Atoms, Molecules, Organisms, Templates, Pages 중 하나로 구성요소의 책임과 허용된 조합 방향을 정의한다.
- **Story Fixture**: 실제 Things와 분리된 재현 가능한 구성요소 입력과 상태 데이터다.
- **Feedback Context**: 검토자가 선택한 렌더링 요소의 React 구성요소 이름과 소스 문맥이다.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 카탈로그 대상으로 선정된 구성요소의 100%가 정확히 하나의 Atomic Design 주 계층에서 탐색 가능하다.
- **SC-002**: 다섯 Atomic Design 계층 각각에 최소 한 개의 독립적으로 렌더링 가능한 대표 Story가 제공된다.
- **SC-003**: 정상, 로딩, 빈 상태, 오류 및 상호작용 상태가 존재하는 대상 구성요소의 100%에서 적용 가능한 상태를 카탈로그에서 재현할 수 있다.
- **SC-004**: 검토자는 각 계층의 대표 구성요소를 연 뒤 10초 이내에 렌더링된 요소의 React 구성요소 문맥을 확인할 수 있다.
- **SC-005**: 카탈로그 전체 검증의 100%가 실제 Things 실행, 사용자 데이터 및 자동화 권한 없이 완료된다.
- **SC-006**: 구조 분해 대상의 기존 핵심 사용자 여정과 접근성 검증이 100% 회귀 없이 통과한다.
- **SC-007**: Story를 20회 연속 전환해도 React Grab의 중복 오버레이나 중복 피드백 이벤트가 발생하지 않는다.
- **SC-008**: React Grab 초기화 실패 검증에서도 대상 Story의 100%가 계속 렌더링되고 조작 가능하다.

## Assumptions

- Atomic Design 분류는 파일 크기가 아니라 구성요소 책임과 조합 관계를 기준으로 한다.
- 기존 앱의 Feature-Sliced Design 경계는 유지하며 Atomic Design은 시각적 React 구성요소 내부의 분류 체계로 사용한다.
- 초기 범위는 현재 앱에서 사용자에게 보이는 구성요소와 보드 Page이며 provider, hook 및 비시각적 도메인 코드는 독립 Story 대상에서 제외한다.
- React Grab은 개발·검토 보조 기능이며 제품 사용자에게 제공되는 기능이 아니다.
- Storybook의 기존 fixture와 테스트 환경을 확장하며 실제 사용자 Things 데이터를 예시 데이터로 사용하지 않는다.

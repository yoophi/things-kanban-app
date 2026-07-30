# Feature Specification: 4단계 할 일 상태

**Feature Branch**: `004-add-backlog-status`  
**Created**: 2026-07-30  
**Status**: Draft  
**Input**: User description: "할일 상태를 backlog, to do, in progress, done 으로 변경. to do는 오늘 할 일(today) 또는 today 태그가 달린 작업. in progress 태그가 있는 작업은 in progress. 오늘 할 일도 아니고 to do 태그가 있지 않은 작업 또는 backlog 태그가 달린 작업은 backlog. backlog -> to do 전환은 backlog 태그 제거, to do 태그 추가로 함."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 네 가지 상태로 할 일 파악 (Priority: P1)

사용자는 선택한 Project 또는 Area의 할 일을 Backlog, To Do, In Progress, Done 네 칼럼에서 확인하여 아직 계획하지 않은 일과 오늘 할 일, 진행 중인 일, 완료한 일을 구분한다.

**Why this priority**: 네 상태가 정확히 분류되어야 보드가 현재 업무 흐름을 신뢰할 수 있게 보여준다.

**Independent Test**: 완료 여부, Today 포함 여부와 상태 태그 조합이 서로 다른 할 일을 준비한 뒤 각 항목이 우선순위 규칙에 따라 정확히 한 칼럼에 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 완료되지 않은 할 일이 Things의 Today 목록에 있거나 `today` 또는 `to do` 태그가 있을 때, **When** 보드를 조회하면, **Then** 더 높은 우선순위 상태 조건이 없는 해당 할 일은 To Do에 표시된다.
2. **Given** 완료되지 않은 할 일에 `in progress` 태그가 있고 Today 목록에 포함되어 있을 때, **When** 보드를 조회하면, **Then** `isToday` 값이 참이어도 해당 할 일은 In Progress에 표시된다.
3. **Given** 완료되지 않은 할 일에 `in progress` 태그가 있고 Today 목록에 포함되어 있지 않을 때, **When** 보드를 조회하면, **Then** `isToday` 값이 거짓이어도 해당 할 일은 In Progress에 표시된다.
4. **Given** 완료되지 않은 할 일이 Today에 없고 `today`, `to do`, `in progress` 태그도 없을 때, **When** 보드를 조회하면, **Then** Backlog에 표시된다.
5. **Given** 완료되지 않은 할 일에 `backlog` 태그가 있을 때, **When** 보드를 조회하면, **Then** `in progress` 조건이 없는 해당 할 일은 Today 포함 여부와 관계없이 Backlog에 표시된다.
6. **Given** 완료된 할 일에 열린 상태 태그가 남아 있을 때, **When** 보드를 조회하면, **Then** 해당 할 일은 Done에만 표시된다.

---

### User Story 2 - Backlog를 To Do로 계획 (Priority: P2)

사용자는 Backlog의 할 일을 To Do로 옮겨 다음 실행 대상으로 계획하고, 같은 상태가 Things에도 유지되게 한다.

**Why this priority**: Backlog에서 실행 가능한 업무를 선택하는 동작은 네 단계 흐름의 핵심 상태 전이다.

**Independent Test**: `backlog` 태그와 사용자 정의 태그가 있는 열린 할 일을 Backlog에서 To Do로 옮긴 뒤, `backlog` 태그가 제거되고 `to do` 태그가 정확히 하나 추가되며 To Do 칼럼에 남는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 열린 Backlog 할 일에 `backlog` 태그가 있을 때, **When** 사용자가 To Do로 이동하면, **Then** `backlog` 태그가 제거되고 `to do` 태그가 추가된다.
2. **Given** Backlog 할 일에 사용자 정의 태그와 PARA 소속이 있을 때, **When** 사용자가 To Do로 이동하면, **Then** 상태 태그 이외의 태그와 소속은 그대로 보존된다.
3. **Given** `to do` 태그가 이미 있는 할 일의 전이가 재시도될 때, **When** 전이가 완료되면, **Then** `to do` 태그는 중복되지 않고 할 일은 To Do로 분류된다.

---

### User Story 3 - 상태 충돌과 실패에서도 신뢰 유지 (Priority: P3)

사용자는 Things에서 태그가 겹치거나 외부 변경 또는 자동화 실패가 발생해도, 보드가 일관된 우선순위로 실제 상태를 보여주고 잘못된 이동을 성공으로 남기지 않기를 원한다.

**Why this priority**: 여러 상태 신호와 외부 변경을 안정적으로 처리해야 보드와 Things 사이의 불일치를 방지할 수 있다.

**Independent Test**: 충돌하는 상태 태그 조합과 쓰기 실패를 각각 준비하고, 단일 칼럼 분류와 권위 상태 복구 및 오류 안내를 확인한다.

**Acceptance Scenarios**:

1. **Given** 하나의 열린 할 일에 서로 다른 범주의 상태 태그가 여러 개 있을 때, **When** 보드를 조회하면, **Then** `in progress`, 명시적 `backlog`, To Do 조건, 기본 Backlog 순으로 처음 일치하는 단 하나의 열린 상태에 표시되고 태그 충돌을 알린다.
2. **Given** Backlog에서 To Do로 전환하는 중 태그 변경 또는 검증이 실패했을 때, **When** 처리가 끝나면, **Then** 성공으로 표시하지 않고 Things의 실제 상태를 다시 반영하며 재시도 가능한 오류를 알린다.
3. **Given** 전이 직후 Things에서 외부 변경이 발생했을 때, **When** 새로고침 또는 결과 검증이 수행되면, **Then** Things의 최신 권위 상태가 보드에 표시된다.

### Edge Cases

- 완료 상태는 모든 열린 상태 신호보다 우선하며 완료된 할 일은 Done에만 표시한다.
- 열린 할 일에 `in progress` 태그가 있으면 `isToday`가 참이든 거짓이든 In Progress로 표시한다.
- Today 목록 포함 여부는 상태 태그가 아니므로 `in progress` 태그와 함께 있어도 상태 태그 충돌로 표시하지 않는다.
- `in progress`와 `backlog` 태그가 함께 있으면 In Progress로 표시한다.
- Today 목록에 있으면서 `backlog` 태그가 있으면 Backlog로 표시한다.
- Today 목록에 없더라도 `today` 또는 `to do` 태그가 있으면 To Do로 표시한다.
- Today 목록에 없고 어떤 전용 상태 태그도 없는 열린 할 일은 기본 Backlog로 표시한다.
- 취소되거나 삭제된 할 일은 네 칼럼의 활성 항목으로 표시하지 않는다.
- 자동화 권한이 거부되거나 Things를 사용할 수 없으면 로컬 표시만 성공 상태로 확정하지 않는다.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 시스템은 할 일을 Backlog, To Do, In Progress, Done 중 정확히 하나의 상태로 분류해야 한다.
- **FR-002**: 시스템은 Things에서 실제 완료된 할 일을 상태 태그와 관계없이 Done으로 분류해야 한다.
- **FR-003**: 시스템은 완료되지 않고 `in progress` 태그가 있는 할 일을 `isToday` 값과 관계없이 In Progress로 분류해야 한다.
- **FR-004**: 시스템은 완료되지 않고 `in progress` 태그가 없으며 `backlog` 태그가 있는 할 일을 Backlog로 분류해야 한다.
- **FR-005**: 시스템은 더 높은 우선순위 상태에 해당하지 않으면서 Today 목록에 있거나 `today` 또는 `to do` 태그가 있는 할 일을 To Do로 분류해야 한다.
- **FR-006**: 시스템은 완료되지 않고 In Progress 또는 To Do 조건에 해당하지 않는 할 일을 Backlog로 분류해야 한다.
- **FR-007**: 상태 충돌 시 Done, In Progress, 명시적 Backlog, To Do, 기본 Backlog 순으로 판정해야 한다.
- **FR-008**: 시스템은 Backlog에서 To Do로 전환할 때 `backlog` 태그를 제거하고 `to do` 태그를 정확히 하나 추가해야 한다.
- **FR-009**: Backlog에서 To Do로 전환한 할 일은 전이 검증 직후 To Do 판정 조건을 만족해야 한다.
- **FR-010**: 시스템은 상태 전이 중 전용 상태 태그 이외의 태그, 제목, 날짜, 메모 및 PARA 소속을 변경하지 않아야 한다.
- **FR-011**: 시스템은 태그 변경 후 Things의 실제 상태를 다시 확인하고 목표 상태가 확인된 경우에만 전이를 성공으로 표시해야 한다.
- **FR-012**: 시스템은 전이 또는 검증 실패 시 보드를 Things의 실제 권위 상태로 복구하고 재시도 가능한 오류를 표시해야 한다.
- **FR-013**: 시스템은 Project 및 Area 필터가 선택된 경우 네 상태 칼럼 모두에 동일한 필터 범위를 적용해야 한다.
- **FR-014**: 시스템은 포인터 드래그와 키보드 상태 선택에 동일한 분류 및 전이 규칙을 적용해야 한다.

### Things Integration and Safety _(mandatory when Things data is read or written)_

- **TI-001**: Today 포함 여부, 태그와 완료 상태 조회는 Things 데이터 읽기이며, Backlog에서 To Do 전이의 태그 제거·추가는 Things 데이터 쓰기다.
- **TI-002**: `backlog` 태그 제거와 `to do` 태그 추가는 Things가 지원하는 AppleScript 또는 URL scheme을 통해서만 수행하며 직접 데이터베이스 쓰기는 금지한다.
- **TI-003**: 태그 변경 후 동일한 할 일을 다시 읽어 `backlog` 태그가 없고 `to do` 태그가 있으며 실제 분류가 To Do인지 검증한다. 검증 실패 시 UI를 Things의 권위 상태로 복구한다.
- **TI-004**: 자동화 권한 거부, Things 사용 불가, 항목 삭제, 충돌하는 상태 태그와 외부 변경은 성공으로 간주하지 않고 사용자에게 오류 또는 최신 권위 상태를 표시한다.
- **TI-005**: 전환 대상 상태 태그 이외의 태그, 메타데이터 및 PARA 배치는 그대로 보존한다.

### Accessibility Requirements _(mandatory for interactive UI)_

- **AR-001**: 모든 드래그 앤 드롭 상태 전이는 동일한 결과를 내는 키보드 접근 가능한 상태 선택 수단을 제공해야 한다.
- **AR-002**: 로딩, 빈 칼럼, 전이 진행, 성공, 실패 및 복구 상태는 색상에만 의존하지 않고 인지할 수 있어야 한다.

### Key Entities _(include if feature involves data)_

- **할 일**: Things의 작업 항목으로, 완료 여부, Today 포함 여부, 상태 태그, 사용자 태그와 PARA 소속을 가진다.
- **보드 상태**: Backlog, To Do, In Progress, Done 중 하나이며 완료 여부와 상태 신호의 우선순위로 결정된다.
- **상태 태그**: `backlog`, `today`, `to do`, `in progress`처럼 열린 할 일의 보드 상태 판정에 사용되는 태그다.
- **상태 전이**: 이전 상태, 목표 상태, 필요한 상태 태그 변경과 검증 결과를 하나의 사용자 작업으로 나타낸다.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 대표적인 완료 여부, Today 포함 여부 및 상태 태그 조합 검증 사례의 100%가 정의된 우선순위에 따라 정확히 한 칼럼에 표시된다.
- **SC-001A**: `in progress` 태그가 있는 열린 할 일의 검증 사례는 `isToday`가 참인 경우와 거짓인 경우 모두 100% In Progress에 표시된다.
- **SC-002**: 상태 신호가 없는 열린 할 일 검증 사례의 100%가 Backlog에 표시된다.
- **SC-003**: Backlog에서 To Do로 전환한 검증 사례의 100%에서 `backlog` 태그가 제거되고 `to do` 태그가 정확히 하나 존재하며 항목이 To Do로 표시된다.
- **SC-004**: 상태 전이 검증 사례의 100%에서 전용 상태 태그 이외의 태그와 PARA 소속이 보존된다.
- **SC-005**: 사용자는 Project 또는 Area를 선택한 뒤 5초 이내에 필터링된 네 상태의 결과 또는 실패 안내를 확인할 수 있다.
- **SC-006**: 권한 거부, 외부 변경과 부분 실패 검증 사례의 100%에서 잘못된 성공 상태가 남지 않고 Things의 실제 상태가 표시된다.

## Assumptions

- 사용자 문장의 `to do 태그`는 Backlog에서 To Do로 전환할 때 추가되는 전용 상태 태그이며, 전환 결과가 즉시 To Do로 분류되도록 Today 목록 및 `today` 태그와 동등한 To Do 판정 신호로 취급한다.
- 태그 이름 비교에는 프로젝트가 기존에 사용하는 상태 태그 정규화 규칙을 적용한다.
- Done의 권위는 상태 태그가 아니라 Things의 실제 완료 상태다.
- 기존 To Do→In Progress 및 열린 상태→Done 전이 규칙은 유지하고, 이번 기능은 네 상태 분류와 Backlog→To Do 태그 변경을 추가한다.
- 기존 Project 및 Area 사이드바 필터와 완료 항목 표시 범위는 유지한다.

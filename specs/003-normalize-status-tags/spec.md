# Feature Specification: 상태 전이 태그 정규화

**Feature Branch**: `003-normalize-status-tags`  
**Created**: 2026-07-30  
**Status**: Draft  
**Input**: User description: "todo -> inprogress 로 상태가 전이될 때 'in progress' 태그를 추가합니다. done 으로 전이될 때 (만약 in progress 태그가 있다면 제거하고, 할 일을 완료로 변경합니다."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 할 일을 진행 중으로 전환 (Priority: P1)

사용자는 Todo 칼럼의 할 일을 In Progress 칼럼으로 옮겨, Things에서도 해당 할 일이 진행 중임을 나타내는 전용 `in progress` 태그를 갖게 한다.

**Why this priority**: 보드의 진행 상태가 Things 데이터에 일관되게 반영되어야 이후 새로고침과 외부 확인에서도 동일한 상태를 볼 수 있다.

**Independent Test**: `in progress` 태그가 없는 열린 할 일을 Todo에서 In Progress로 옮긴 뒤, Things에서 할 일이 열린 상태를 유지하면서 해당 태그가 정확히 한 개 존재하고 다른 태그가 보존되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 열린 Todo에 `in progress` 태그가 없을 때, **When** 사용자가 In Progress로 이동하면, **Then** 할 일은 열린 상태를 유지하고 `in progress` 태그가 추가된다.
2. **Given** 열린 Todo에 사용자 정의 태그가 있을 때, **When** 사용자가 In Progress로 이동하면, **Then** 사용자 정의 태그는 그대로 유지되고 `in progress` 태그만 추가된다.
3. **Given** 할 일에 이미 `in progress` 태그가 있을 때, **When** In Progress 전이가 재시도되면, **Then** 동일 태그가 중복 생성되지 않는다.

---

### User Story 2 - 진행 중 할 일을 완료 (Priority: P2)

사용자는 In Progress 할 일을 Done으로 옮겨, 진행 상태를 나타내는 태그를 제거하고 Things의 실제 완료 상태로 변경한다.

**Why this priority**: 완료 상태가 진행 중 태그와 동시에 남으면 보드와 Things 사이에 모순된 상태가 생기므로 완료 시 정규화가 필요하다.

**Independent Test**: `in progress` 태그와 사용자 정의 태그가 있는 열린 할 일을 Done으로 옮긴 뒤, Things에서 실제 완료 상태이며 `in progress` 태그만 제거되고 나머지 태그와 소속 정보가 보존되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 열린 In Progress 할 일에 `in progress` 태그가 있을 때, **When** 사용자가 Done으로 이동하면, **Then** 해당 태그가 제거되고 할 일이 실제 완료 상태가 된다.
2. **Given** 열린 할 일에 `in progress` 태그가 없을 때, **When** 사용자가 Done으로 이동하면, **Then** 할 일은 오류 없이 실제 완료 상태가 된다.
3. **Given** 할 일에 다른 사용자 태그가 있을 때, **When** 사용자가 Done으로 이동하면, **Then** `in progress` 태그 이외의 태그는 모두 보존된다.

---

### User Story 3 - 실패 시 기존 상태 보존 (Priority: P3)

사용자는 자동화 권한 거부, Things 실행 불가 또는 쓰기 실패가 발생해도 보드와 Things의 상태가 서로 어긋나지 않기를 원한다.

**Why this priority**: 태그 제거와 완료 처리는 하나의 사용자 의도이므로 일부만 적용된 상태를 감지하고 권위 상태로 복구해야 데이터 신뢰성을 유지할 수 있다.

**Independent Test**: 태그 변경 또는 완료 처리 중 하나를 실패시키고 새로고침했을 때, UI가 Things의 실제 상태로 복구되며 사용자에게 실패를 알리는지 확인한다.

**Acceptance Scenarios**:

1. **Given** Things 쓰기 권한이 거부되었을 때, **When** 상태 전이를 시도하면, **Then** 사용자에게 실패가 안내되고 보드는 Things의 실제 상태로 되돌아간다.
2. **Given** Done 전이 중 일부 변경만 적용되었을 때, **When** 전이 결과를 확인하면, **Then** 시스템은 성공으로 표시하지 않고 Things의 최종 권위 상태를 다시 반영한다.
3. **Given** 전이 직후 외부에서 할 일 상태가 변경되었을 때, **When** 검증 또는 새로고침이 수행되면, **Then** 외부의 실제 상태가 보드에 표시된다.

### Edge Cases

- 제목이 없거나 Area/Project에 속하지 않은 할 일도 같은 상태 전이 규칙을 적용한다.
- `in progress` 태그가 여러 번 연결된 것처럼 보이는 비정상 입력은 전이 후 하나의 진행 상태만 나타내도록 정규화한다.
- 완료 처리 전에 할 일이 삭제되거나 취소되면 전이를 성공으로 표시하지 않는다.
- 태그 제거는 성공했지만 완료 처리가 실패한 경우에도 부분 성공으로 표시하지 않고 권위 상태를 다시 조회한다.
- 이미 완료된 할 일에 Done 전이가 재요청되면 중복 변경 없이 완료 상태를 유지한다.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 시스템은 Todo에서 In Progress로 전이되는 열린 할 일에 전용 `in progress` 상태 태그를 추가해야 한다.
- **FR-002**: 시스템은 In Progress 전이 후 전용 `in progress` 상태 태그가 정확히 한 번만 연결되도록 해야 한다.
- **FR-003**: 시스템은 Done으로 전이할 때 전용 `in progress` 상태 태그가 존재하면 제거해야 한다.
- **FR-004**: 시스템은 Done 전이 시 태그 정규화 후 할 일을 Things의 실제 완료 상태로 변경해야 한다.
- **FR-005**: 시스템은 전용 상태 태그 이외의 사용자 태그, 제목, 날짜, 메모 및 PARA 소속을 변경하지 않아야 한다.
- **FR-006**: 시스템은 전이 완료 후 실제 태그와 완료 상태를 확인하고 목표 상태가 확인된 경우에만 성공으로 표시해야 한다.
- **FR-007**: 시스템은 상태 전이 실패 또는 검증 실패 시 낙관적으로 표시한 카드를 Things의 실제 권위 상태로 복구해야 한다.
- **FR-008**: 시스템은 동일한 상태 전이가 재시도되어도 상태 태그 중복이나 반복 완료 부작용이 발생하지 않도록 해야 한다.
- **FR-009**: 시스템은 사용자에게 전이 진행, 성공 및 실패 상태를 색상에만 의존하지 않는 방식으로 알려야 한다.
- **FR-010**: 시스템은 포인터 이동과 키보드 상태 선택에 동일한 태그 및 완료 규칙을 적용해야 한다.

### Things Integration and Safety _(mandatory when Things data is read or written)_

- **TI-001**: 태그 추가·제거와 완료 상태 변경은 Things 데이터 쓰기이며, 전이 검증은 Things 데이터 읽기다.
- **TI-002**: 모든 쓰기는 Things가 지원하는 자동화 인터페이스를 통해 수행하며 직접 데이터베이스 쓰기는 금지한다.
- **TI-003**: 각 변경 후 동일한 할 일을 다시 읽어 목표 태그와 실제 완료 상태를 검증하고, 실패 시 UI를 권위 상태로 복구한다.
- **TI-004**: 자동화 권한 거부, Things 사용 불가, 항목 삭제, 상태 충돌 및 외부 변경은 성공으로 처리하지 않고 사용자가 재시도할 수 있는 오류로 표시한다.
- **TI-005**: `in progress` 상태 태그 이외의 태그, 메타데이터 및 PARA 배치는 그대로 보존한다.

### Accessibility Requirements _(mandatory for interactive UI)_

- **AR-001**: 드래그 앤 드롭 상태 전이는 동일한 결과를 내는 키보드 접근 가능한 상태 선택 수단을 제공해야 한다.
- **AR-002**: 전이 진행, 성공, 실패와 복구 상태는 색상에만 의존하지 않고 보조 기술로 인지할 수 있어야 한다.

### Key Entities _(include if feature involves data)_

- **할 일**: Things의 작업 항목으로, 실제 완료 상태, 상태 태그, 사용자 태그 및 PARA 소속을 가진다.
- **상태 태그**: 열린 할 일이 In Progress임을 나타내는 전용 태그이며 Done 전이 시 제거 대상이다.
- **상태 전이**: 이전 보드 상태, 목표 보드 상태, 태그 변경, 실제 완료 변경 및 검증 결과를 하나의 사용자 작업으로 나타낸다.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Todo에서 In Progress로 전환한 검증 사례의 100%에서 `in progress` 태그가 정확히 하나 존재한다.
- **SC-002**: In Progress에서 Done으로 전환한 검증 사례의 100%에서 `in progress` 태그가 제거되고 할 일이 실제 완료 상태가 된다.
- **SC-003**: 상태 전이 검증 사례의 100%에서 전용 상태 태그 이외의 태그와 PARA 소속이 보존된다.
- **SC-004**: 사용자는 포인터 또는 키보드로 상태 전이를 시작한 뒤 5초 이내에 성공 또는 실패 결과를 확인할 수 있다.
- **SC-005**: 권한 거부와 부분 실패 검증 사례의 100%에서 잘못된 성공 상태가 남지 않고 실제 Things 상태로 복구된다.

## Assumptions

- `in progress`는 이 앱이 진행 상태 판정에 사용하는 기존 전용 상태 태그를 의미한다.
- Done 상태의 권위는 상태 태그가 아니라 Things의 실제 완료 상태다.
- 이번 기능은 Todo에서 In Progress로의 전이와 모든 열린 상태에서 Done으로의 전이를 다루며 새로운 보드 상태를 추가하지 않는다.
- 완료 취소 후 목표 상태로 이동하는 기존 동작은 유지하며 이번 명세의 직접 변경 범위에는 포함하지 않는다.

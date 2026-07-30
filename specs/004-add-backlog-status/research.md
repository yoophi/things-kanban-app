# Phase 0 Research: 4단계 할 일 상태

## 1. Things Today 포함 여부 읽기

**Decision**: 기존 AppleScript 보드 읽기에서 Things의 Today 목록에 포함된 할 일 ID 집합을 한 번 얻고, 각 할 일 행에 `isToday` 불리언을 함께 반환한다.

**Rationale**:

- Today 목록은 태그와 별개의 Things 권위 상태이므로 추측한 날짜보다 실제 목록 포함 여부가 정확하다.
- 기존 전체 할 일 읽기와 같은 AppleScript 실행 안에서 처리해 추가 프로세스 호출과 시점 차이를 피한다.
- 도메인은 AppleScript 세부사항 없이 불리언 신호만 받아 순수하게 판정할 수 있다.

**Alternatives considered**:

- **scheduled date가 오늘인지 비교**: Things의 Today 포함 규칙과 시작일·시간대·수동 Today 배치 의미를 완전히 재현하지 못해 거부했다.
- **Today 목록을 별도 명령으로 조회**: 두 조회 사이 외부 변경과 추가 호출 비용이 있어 거부했다.
- **`today` 태그만 사용**: 사용자가 명시한 실제 Today 목록 조건을 누락해 거부했다.

## 2. 상태 판정 우선순위

**Decision**: `Done → In Progress → 명시적 Backlog → To Do → 기본 Backlog` 순으로 판정한다. 열린 할 일에 `in progress` 태그가 있으면 `isToday` 값과 관계없이 In Progress로 판정한다. To Do 신호는 실제 Today 목록, `today`, canonical `to do`, legacy `status:todo`다.

**Rationale**:

- 완료 상태를 실제 Things 완료 여부로 유지한다.
- `in progress`가 실행 중이라는 가장 구체적인 열린 상태 의도를 나타낸다.
- Today 포함 여부는 To Do 신호일 뿐이므로 명시적인 `in progress` 태그보다 우선할 수 없다.
- 명시적 `backlog`가 Today 목록의 묵시적 신호보다 우선해야 사용자가 보류시킨 항목이 To Do로 되돌아가지 않는다.
- 어떤 능동 신호도 없는 열린 항목은 사용자의 요구대로 Backlog가 된다.

**Alternatives considered**:

- **태그마다 별도 칼럼에 중복 표시**: 정확히 하나의 상태라는 보드 계약을 위반해 거부했다.
- **Today가 Backlog보다 우선**: 명시적으로 붙인 `backlog` 태그를 무시해 거부했다.
- **충돌 시 오류로 보드에서 제외**: 사용자가 항목을 찾을 수 없게 되어 우선순위 표시와 conflict 신호를 병행한다.

## 3. 상태 태그 호환성과 canonical 쓰기

**Decision**: 새 쓰기는 `backlog`, `to do`, `in progress`를 canonical 태그로 사용한다. 읽기에서는 기존 `today`, `status:todo`, `status:in-progress`를 호환하고, 사용자가 명시적으로 상태를 옮길 때만 관련 상태 태그를 canonical 목표로 정규화한다.

**Rationale**:

- 사용자에게 보이는 태그가 요구 이름과 일치한다.
- 기존 할 일이 배포 직후 다른 칼럼으로 잘못 이동하지 않는다.
- 명시적 전이는 충돌 상태 태그를 안전하게 정리할 수 있는 사용자 승인 시점이다.

**Alternatives considered**:

- **기존 `status:*` 태그 유지**: 사용자 요구 이름과 불일치해 거부했다.
- **앱 시작 시 전체 마이그레이션**: 사용자가 이동하지 않은 다수 항목을 변경하므로 거부했다.
- **기존 태그를 모두 남기고 새 태그 추가**: 충돌과 중복 상태 신호가 누적되어 거부했다.

## 4. Backlog에서 To Do로의 쓰기와 검증

**Decision**: 현재 할 일을 재조회하고, 전용 상태 태그만 제거한 뒤 canonical `to do`를 하나 추가하는 기존 AppleScript 치환 연산을 사용한다. 이후 동일 ID를 다시 읽어 `backlog` 부재, canonical `to do` 1개와 최종 To Do 판정을 검증한다.

**Rationale**:

- 단일 태그 집합 쓰기로 중간에 두 상태가 동시에 남는 시간을 최소화한다.
- 관련 없는 사용자 태그와 PARA 배치를 보존한다.
- 최종 판정까지 확인해야 외부 변경이나 쓰기 일부 실패를 성공으로 오인하지 않는다.

**Alternatives considered**:

- **URL scheme으로 태그 추가만 수행**: 기존 `backlog` 제거와 동일 항목 검증을 완전하게 보장하기 어려워 거부했다.
- **SQLite 직접 수정**: Things 데이터 안전 원칙에 어긋나 금지한다.
- **검증 없이 낙관적 UI 확정**: Things와 보드의 불일치를 남겨 거부했다.

## 5. 프런트엔드 상태 확장

**Decision**: 공유 `KanbanStatus`에 `backlog`를 추가하고, 보드 칼럼·상태 레이블·집계·드롭 대상·키보드 select가 하나의 네 상태 목록을 사용하게 한다.

**Rationale**:

- 포인터와 키보드 이동의 목표 상태가 항상 동일하다.
- 누락되기 쉬운 여러 상태 맵을 한 계약에 맞춰 타입 검사할 수 있다.
- 기존 Project/Area와 검색/태그 필터는 할 일 목록 필터이므로 그대로 재사용할 수 있다.

**Alternatives considered**:

- **Backlog만 별도 화면으로 분리**: 사용자가 네 단계 흐름을 한눈에 보려는 요구와 다르다.
- **프런트엔드에서 상태를 재판정**: Rust 권위 판정과 이중 규칙이 생겨 거부했다.

## Resolved Unknowns

- Today 판정: Things Today 목록의 실제 ID 포함 여부
- 상태 우선순위: Done → In Progress → 명시적 Backlog → To Do → 기본 Backlog
- In Progress와 Today 관계: `in progress` 태그가 `isToday=true/false` 모두에서 우선
- canonical 태그: `backlog`, `to do`, `in progress`
- 호환 입력: `today`, `status:todo`, `status:in-progress`
- Backlog→To Do: 상태 태그 치환 → 동일 ID 재조회 → 목표 상태 검증
- 실패 복구: 오류 반환 → UI snapshot 롤백 → 권위 board 재조회

계획을 막는 미해결 질문은 없다.

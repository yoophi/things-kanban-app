# Phase 0 Research: 3열 보드와 Area/Project 사이드바

## 1. 완료 항목 조회 방식

**Decision**: `get_board`가 항상 활성 할 일과 최근 30일 완료 할 일을 함께 반환하고, 완료 여부는 Things `status`, 기간 판정은 Things `completion date`를 사용한다.

**Rationale**:

- 현재 UI의 `showDone` 선택 상태는 “세 열 항상 표시” 요구와 충돌한다.
- Things 완료 상태가 유일한 권위이며 완료일은 최근 기간을 정확히 판정하는 공개 속성이다.
- 최근 30일 제한은 전체 Logbook을 매번 읽는 비용과 오래된 완료 카드의 정보 밀도를 줄인다.

**Alternatives considered**:

- **기존 showDone 토글 유지**: Done 열이 기본 구조가 아니게 되므로 거부했다.
- **완료 태그 사용**: Things 실제 완료 상태와 이중 권위가 생겨 거부했다.
- **완료 항목 전체 표시**: 데이터 양이 지속적으로 증가하므로 거부했다.

## 2. 완료일 직렬화

**Decision**: AppleScript에서 날짜 구성 요소를 ISO 8601 형식으로 직렬화하고 Rust에서 명시적으로 파싱한다. 없는 날짜는 빈 필드로 전달해 `None`으로 보존한다.

**Rationale**:

- AppleScript의 지역화된 날짜 문자열은 시스템 언어와 서식에 따라 달라질 수 있다.
- 명시적 ISO 형식은 기간 비교와 프런트엔드 전달을 안정적으로 만든다.

**Alternatives considered**:

- **AppleScript 기본 `date as text`**: 지역화에 의존하므로 거부했다.
- **프런트엔드에서 원문 파싱**: 인프라 형식이 UI까지 누출되므로 거부했다.

## 3. Area/Project 목록의 원본

**Decision**: 사이드바용 Area와 활성 Project를 Things 컬렉션에서 별도로 조회하고, Project의 부모 Area ID를 함께 반환한다.

**Rationale**:

- 할 일에서만 Area와 Project를 수집하면 현재 할 일이 없는 탐색 항목이 누락된다.
- Project ID와 부모 Area ID가 있어야 중복 이름과 독립 Project를 정확히 구분할 수 있다.
- 사이드바는 Things PARA 구조를 그대로 반영해야 한다.

**Alternatives considered**:

- **Todo에서 관계 추론**: 빈 Project와 Area가 누락되어 거부했다.
- **이름 기반 트리**: 중복 이름과 이름 변경에 취약해 거부했다.
- **앱 자체 프로젝트 목록 저장**: Things 외부에 별도 권위가 생겨 거부했다.

## 4. 범위 필터 적용 위치

**Decision**: Rust `get_board`는 완전한 최근 스냅샷을 반환하고, 사이드바 BoardScope는 프런트엔드 순수 선택자로 적용한다.

**Rationale**:

- Area/Project 선택은 Things 데이터를 바꾸지 않는 즉각적인 표시 상호작용이다.
- 이미 받은 스냅샷에서 100ms 이내 전환할 수 있고 불필요한 AppleScript 호출을 피한다.
- 동일 선택자는 검색·태그 조건과 열별 개수를 일관되게 계산할 수 있다.

**Alternatives considered**:

- **선택마다 백엔드 재조회**: 지연과 권한 오류 표면을 불필요하게 늘려 거부했다.
- **각 열이 별도 필터링**: 규칙 중복과 개수 불일치 위험 때문에 거부했다.

## 5. Area 선택 의미

**Decision**: Area 범위는 Area 직속 할 일과 그 Area에 속한 모든 Project 할 일을 포함한다. Project 범위는 해당 Project의 할 일만 포함한다.

**Rationale**:

- Area는 지속 책임 영역이므로 하위 Project까지 포함해야 전체 작업량을 보여준다.
- Project 선택은 명확한 완료 단위로 좁혀야 한다.

**Alternatives considered**:

- **Area 직속 할 일만 포함**: 사용자 기대와 PARA 의미에 맞지 않아 거부했다.
- **Area와 Project를 모두 태그처럼 조합**: 사이드바의 단일 현재 범위 모델을 복잡하게 만들어 거부했다.

## 6. 사이드바 상태와 접근성

**Decision**: 기본 범위는 `all`, 기본 사이드바는 펼침 상태다. 선택과 접힘은 현재 앱 세션에만 보존하며, `nav`/선택 버튼/`aria-current`와 명시적 접기 버튼을 사용한다.

**Rationale**:

- 재시작 시 전체 보기는 예측 가능한 기본값이다.
- 버튼 기반 탐색은 포인터와 키보드에 동일한 동작을 제공한다.
- 선택 ID가 새 스냅샷에 없으면 전체 보기로 복구할 수 있다.

**Alternatives considered**:

- **선택 영구 저장**: 별도 설정 저장 범위를 추가하므로 이번 기능에서 제외했다.
- **복잡한 ARIA tree 위젯**: 계층 탐색 키보드 규칙의 구현 부담이 크며 단일 선택 목록에는 버튼 그룹이 더 단순하고 견고하다.

## Resolved Unknowns

- Done 표시: 항상 표시, 최근 30일
- 완료 판정: Things 실제 상태, 완료 기간: Things 완료일
- 사이드바 목록: Things Area/Project 컬렉션의 공개 ID와 관계
- 범위 필터: 프런트엔드 순수 선택자
- Area 범위: 직속 할 일과 하위 Project 포함
- 사이드바 선택 보존: 현재 세션만

계획을 막는 미해결 질문은 없다.

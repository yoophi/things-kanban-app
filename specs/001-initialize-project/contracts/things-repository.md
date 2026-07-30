# Things Repository Port Contract

Rust 도메인·애플리케이션 계층이 요구하는 아웃바운드 포트다. 구체적인 AppleScript, 프로세스 실행 및 Tauri 형식은 인프라 계층에 머문다.

## Operations

### `fetch_board(query) -> BoardSnapshot`

- **Operation**: read
- 활성 할 일과 선택된 최근 완료 항목, 프로젝트, Area, 태그를 읽는다.
- 취소된 항목과 메모는 반환하지 않는다.
- 모든 결과를 도메인 모델로 정규화한다.

### `fetch_todo(id) -> Todo`

- **Operation**: read
- 정확한 Things ID로 한 항목을 조회한다.
- 없거나 ID가 모호하면 `item_not_found`를 반환한다.

### `replace_status_tags(id, target) -> Todo`

- **Operation**: write
- AppleScript 공개 속성으로만 상태 태그를 변경한다.
- 기존 태그에서 알려진 상태 태그만 제거하고 목표 상태 태그를 추가한다.
- 관련 없는 태그, 프로젝트, Area, 일정 및 메모를 변경하지 않는다.
- 변경 직후 동일 ID를 재조회한 `Todo`를 반환한다.

### `set_completion(id, completed) -> Todo`

- **Operation**: write
- AppleScript 공개 완료/상태 속성만 사용한다.
- 완료 처리 시 관련 없는 태그를 보존한다.
- 완료 취소 후 애플리케이션 유스케이스가 목표 활성 상태 태그를 정규화할 수 있게 재조회 결과를 반환한다.

### `show_item(id, kind) -> ()`

- **Operation**: UI action, no data mutation
- AppleScript `show` 또는 공식 Things URL scheme으로 정확한 항목을 연다.
- 이름 기반 추측은 금지한다.

## Mutation protocol

1. `fetch_todo(id)`로 대상과 이전 권위 상태를 확인한다.
2. 애플리케이션 계층이 전이 유효성과 목표 상태를 검사한다.
3. 어댑터는 필요한 공개 AppleScript 쓰기만 수행한다.
4. `fetch_todo(id)`로 결과를 다시 읽는다.
5. 애플리케이션 계층이 목표 상태, 관련 없는 태그 및 PARA 소속 보존을 검증한다.
6. 검증 실패는 성공으로 변환하지 않는다.

## Adapter acceptance tests

- 동일 이름의 두 할 일이 있어도 ID로 정확한 항목만 변경한다.
- `todo -> inProgress -> todo` 후 비상태 태그 집합이 동일하다.
- 활성 상태에서 완료 후 실제 Things 상태가 `completed`다.
- 완료 취소 후 요청한 활성 상태와 하나의 상태 태그만 남는다.
- 쓰기 권한 거부가 `automation_denied`로 변환된다.
- 대상 삭제가 `item_not_found`로 변환된다.
- 스크립트 부분 실패 또는 재조회 불일치가 `verification_failed`로 변환된다.
- 어떤 쓰기 경로도 SQLite 파일을 열지 않는다.

## Future adapters

Things CLI 또는 읽기 전용 SQLite 어댑터는 별도 조사와 동일 계약 테스트를 통과한 뒤에만 추가할 수 있다. SQLite 어댑터가 추가되어도 쓰기 메서드는 구현하지 않으며, AppleScript ID와의 교차 호환성을 입증해야 한다.

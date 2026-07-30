# Tauri Command Contract

프런트엔드가 호출하는 인바운드 계약이다. 필드 이름은 `camelCase`, 날짜는 ISO 8601 문자열, 모든 ID는 Things의 텍스트 ID를 사용한다.

## 공통 응답

성공 시 command별 결과를 반환한다. 실패는 다음 직렬화 가능한 구조로 반환한다.

```json
{
  "code": "automation_denied",
  "message": "Things 자동화 권한이 필요합니다.",
  "retryable": false,
  "action": "open_automation_settings",
  "requestId": "request-uuid"
}
```

허용 오류 코드는 `things_not_installed`, `automation_denied`, `things_unavailable`, `item_not_found`, `status_conflict`, `write_failed`, `verification_failed`, `invalid_request`다.

## `get_board`

**Kind**: Things 읽기  
**Purpose**: 현재 조회 조건에 맞는 권위 있는 보드 스냅샷을 반환한다.

Request:

```json
{
  "query": {
    "search": "",
    "projectIds": [],
    "areaIds": [],
    "tagNames": [],
    "sort": "dueDate",
    "showDone": false,
    "completedSince": null
  }
}
```

Response:

```json
{
  "todos": [
    {
      "id": "things-id",
      "title": "할 일",
      "status": "todo",
      "statusConflict": false,
      "dueDate": null,
      "scheduledDate": null,
      "completionDate": null,
      "project": null,
      "area": null,
      "tags": []
    }
  ],
  "projects": [],
  "areas": [],
  "tags": [],
  "refreshedAt": "2026-07-30T09:00:00+09:00"
}
```

**Rules**:

- 취소된 할 일은 제외한다.
- `showDone`이 거짓이면 완료 항목을 반환하지 않는다.
- `completedSince`는 완료 항목에만 적용한다.
- 반환 데이터에는 메모가 포함되지 않는다.

## `transition_todo`

**Kind**: Things 쓰기 후 읽기 검증  
**Purpose**: 한 할 일을 목표 칸반 상태로 전이하고 재조회한 결과를 반환한다.

Request:

```json
{
  "request": {
    "todoId": "things-id",
    "previousStatus": "todo",
    "targetStatus": "inProgress",
    "requestId": "request-uuid"
  }
}
```

Response:

```json
{
  "todo": {
    "id": "things-id",
    "title": "할 일",
    "status": "inProgress",
    "statusConflict": false,
    "dueDate": null,
    "scheduledDate": null,
    "completionDate": null,
    "project": null,
    "area": null,
    "tags": ["status:in-progress"]
  },
  "normalizedConflict": false,
  "verifiedAt": "2026-07-30T09:00:01+09:00"
}
```

**Rules**:

- `todoId`가 없거나 목표 상태가 유효하지 않으면 쓰지 않는다.
- 쓰기 전에 현재 원본을 읽고 관련 없는 태그 및 PARA 소속을 보존한다.
- 동일 할 일의 진행 중 요청은 직렬화한다.
- 쓰기 후 목표 상태가 검증되지 않으면 성공을 반환하지 않는다.
- 실패 시 프런트엔드는 낙관적 상태를 롤백하고 보드를 재조회한다.

## `open_in_things`

**Kind**: Things UI 동작, 데이터 쓰기 없음  
**Purpose**: 식별 가능한 원본 항목을 Things에서 표시한다.

Request:

```json
{
  "itemId": "things-id",
  "itemKind": "todo"
}
```

`itemKind`는 `todo`, `project`, `area` 중 하나다.

Response:

```json
{
  "opened": true
}
```

**Rules**:

- 정확한 ID를 확인할 수 없으면 이름 기반으로 다른 항목을 열지 않는다.
- 지원되지 않는 종류 또는 없는 ID는 `item_not_found` 또는 `invalid_request`를 반환한다.

## `get_integration_status`

**Kind**: 로컬 환경 읽기  
**Purpose**: Things 설치 및 자동화 사용 가능 상태를 진단한다.

Response:

```json
{
  "thingsInstalled": true,
  "automation": "authorized",
  "readAvailable": true,
  "writeAvailable": true
}
```

`automation`은 `notDetermined`, `authorized`, `denied`, `unavailable` 중 하나다.

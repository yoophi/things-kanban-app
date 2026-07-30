# Board Command Contract

기존 Tauri `get_board` 계약을 3열 기본 표시와 완전한 탐색 데이터에 맞게 확장한다.

## `get_board`

**Kind**: Things 읽기  
**Purpose**: 활성 할 일, 최근 완료 할 일, 전체 활성 Area/Project와 완료 기간을 하나의 권위 스냅샷으로 반환한다.

Request:

```json
{
  "query": {
    "search": "",
    "tagNames": [],
    "sort": "dueDate",
    "completedSince": "2026-06-30T00:00:00Z"
  }
}
```

`showDone`, `projectIds`, `areaIds`는 제거한다. 완료 항목은 항상 포함하며 Area/Project 범위와 사용자 검색은 받은 스냅샷에 프런트엔드가 적용한다.

Response:

```json
{
  "todos": [
    {
      "id": "todo-id",
      "title": "작업",
      "completionStatus": "completed",
      "completionDate": "2026-07-29T03:00:00Z",
      "project": {
        "id": "project-id",
        "name": "앱 출시",
        "area": {
          "id": "area-id",
          "name": "업무",
          "active": true
        },
        "active": true
      },
      "area": {
        "id": "area-id",
        "name": "업무",
        "active": true
      },
      "tags": [],
      "status": "done",
      "statusConflict": false
    }
  ],
  "projects": [
    {
      "id": "project-id",
      "name": "앱 출시",
      "area": {
        "id": "area-id",
        "name": "업무",
        "active": true
      },
      "active": true
    }
  ],
  "areas": [
    {
      "id": "area-id",
      "name": "업무",
      "active": true
    }
  ],
  "tags": [],
  "completionWindow": {
    "days": 30,
    "since": "2026-06-30T00:00:00Z",
    "label": "최근 30일"
  },
  "refreshedAt": "2026-07-30T09:00:00Z"
}
```

## Rules

- 완료 상태는 상태 태그보다 우선한다.
- 취소된 할 일과 `completedSince`보다 오래된 완료 항목은 제외한다.
- 완료 상태지만 완료일이 없는 항목은 누락하지 않는다.
- `projects`와 `areas`는 카드에서 발견한 항목이 아니라 Things의 활성 컬렉션 전체다.
- Project의 `area`는 공개 ID로 정확히 연결한다.
- 중복 Area/Project 이름을 병합하지 않는다.
- 응답에 할 일 메모를 포함하지 않는다.
- 이 변경은 `transition_todo`, `open_in_things`, `get_integration_status` 쓰기·오류 계약을 변경하지 않는다.

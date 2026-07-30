# Transition Todo Contract

기존 Tauri `transition_todo` command의 요청 구조를 유지하고 `KanbanStatus`에 `backlog`를 추가한다.

## Backlog to To Do Request

```json
{
  "request": {
    "todoId": "things-public-id",
    "previousStatus": "backlog",
    "targetStatus": "todo",
    "requestId": "unique-request-id"
  }
}
```

## Successful Response

```json
{
  "todo": {
    "id": "things-public-id",
    "completionStatus": "open",
    "isToday": false,
    "tags": [{ "name": "to do" }, { "name": "user-tag" }],
    "status": "todo",
    "statusConflict": false
  },
  "normalizedConflict": false,
  "verifiedAt": "2026-07-30T12:00:00Z"
}
```

`isToday`가 `true`여도 동일하게 성공할 수 있으며, canonical `to do` 태그는 Backlog→To Do 전이의 지속 가능한 상태 신호로 반드시 존재한다.

## State Resolution Contract

| 우선순위 | 조건                                                                          | 결과         |
| -------- | ----------------------------------------------------------------------------- | ------------ |
| 1        | `completionStatus = completed`                                                | `done`       |
| 2        | open이고 `isToday` 값과 무관하게 `in progress` 또는 `status:in-progress` 존재 | `inProgress` |
| 3        | open이고 `backlog` 존재                                                       | `backlog`    |
| 4        | open이고 `isToday = true` 또는 `today`, `to do`, `status:todo` 존재           | `todo`       |
| 5        | 나머지 open                                                                   | `backlog`    |

서로 다른 열린 상태 태그 범주가 둘 이상이면 우선순위 결과를 반환하면서 `statusConflict = true`로 표시한다. `isToday`는 상태 태그가 아니므로 충돌 계산에서 제외한다.
따라서 `isToday = true`이면서 `in progress` 태그가 있는 열린 할 일과 `isToday = false`이면서 같은 태그가 있는 열린 할 일은 모두 `inProgress`를 반환한다.

## Transition Rules

| Previous | Target      | Required mutation                         | Success verification                           |
| -------- | ----------- | ----------------------------------------- | ---------------------------------------------- |
| Backlog  | To Do       | 상태 태그 제거 후 `to do` 하나 추가       | open, `to do` 1개, `backlog` 없음, status=todo |
| Any open | Backlog     | 상태 태그 제거 후 `backlog` 하나 추가     | open, `backlog` 1개, status=backlog            |
| Any open | In Progress | 상태 태그 제거 후 `in progress` 하나 추가 | open, `in progress` 1개, status=inProgress     |
| Any open | Done        | 열린 상태 태그 정리 후 완료               | completed, status=done                         |
| Done     | Any open    | 완료 취소 후 목표 canonical 태그 추가     | open, 목표 status                              |

## Preservation Contract

- 상태 정규화 대상은 `backlog`, `today`, `to do`, `in progress`, `status:todo`, `status:in-progress`다.
- 대상 이외 태그의 이름과 연결 상태를 보존한다.
- 제목, 메모, 날짜, 체크리스트, Project와 Area를 변경하지 않는다.
- Today 목록 포함 여부를 자동으로 변경하지 않는다. 명시적 `backlog`가 Today보다 우선하므로 Backlog 전이는 상태 태그만으로 안정적으로 표현된다.
- 직접 SQLite 쓰기 또는 Things Cloud 네트워크 호출을 사용하지 않는다.

## Error Contract

- 요청의 `previousStatus`와 전이 직전 권위 판정이 다르면 `verification_failed`.
- 대상이 없거나 취소되었으면 `item_not_found` 또는 `verification_failed`.
- 자동화 권한 거부는 `automation_denied`.
- 태그 치환, 완료 또는 완료 취소가 실패하면 성공 응답을 반환하지 않는다.
- 최종 재조회가 목표 완료 상태, canonical 태그와 최종 상태를 모두 만족하지 않으면 `verification_failed`.
- 오류 후 프런트엔드는 낙관적 snapshot을 복구하고 board query를 재검증한다.

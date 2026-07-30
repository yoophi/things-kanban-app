# Transition Todo Contract

기존 Tauri `transition_todo` command의 외부 요청 형식은 유지하고 내부 성공 조건을 강화한다.

## Request

```json
{
  "request": {
    "todoId": "things-public-id",
    "previousStatus": "todo",
    "targetStatus": "inProgress",
    "requestId": "unique-request-id"
  }
}
```

## Successful In Progress Response

```json
{
  "todo": {
    "id": "things-public-id",
    "completionStatus": "open",
    "tags": [{ "name": "in progress" }, { "name": "user-tag" }],
    "status": "inProgress",
    "statusConflict": false
  },
  "normalizedConflict": false,
  "verifiedAt": "2026-07-30T12:00:00Z"
}
```

## Successful Done Response

```json
{
  "todo": {
    "id": "things-public-id",
    "completionStatus": "completed",
    "tags": [{ "name": "user-tag" }],
    "status": "done",
    "statusConflict": false
  },
  "normalizedConflict": false,
  "verifiedAt": "2026-07-30T12:00:00Z"
}
```

## Transition Rules

| Previous    | Target      | Required mutation order                | Success verification      |
| ----------- | ----------- | -------------------------------------- | ------------------------- |
| Todo        | In Progress | 상태 태그 정규화 후 `in progress` 추가 | open, canonical 태그 1개  |
| In Progress | Todo        | canonical/legacy 진행 태그 제거        | open, 진행 태그 없음      |
| Todo        | Done        | 진행 상태 태그 정리 후 완료            | completed, 진행 태그 없음 |
| In Progress | Done        | 진행 상태 태그 제거 후 완료            | completed, 진행 태그 없음 |
| Done        | Todo        | 완료 취소 후 상태 태그 정리            | open, 진행 태그 없음      |
| Done        | In Progress | 완료 취소 후 canonical 태그 추가       | open, canonical 태그 1개  |

## Error Contract

- 요청의 `previousStatus`와 재조회 상태가 다르면 `verification_failed`.
- 대상이 없으면 `item_not_found`.
- 자동화 권한 거부는 `automation_denied`.
- 태그 제거, 태그 추가, 완료 또는 완료 취소 중 하나라도 실패하면 성공 응답을 반환하지 않는다.
- 최종 재조회가 목표 완료 상태와 태그 조건을 모두 만족하지 않으면 `verification_failed`.
- 오류 후 프런트엔드는 이전 snapshot으로 낙관적 변경을 롤백하고 board query를 재검증한다.

## Preservation Contract

- canonical `in progress`, legacy `status:in-progress`, legacy `status:todo`만 상태 정규화 대상으로 취급한다.
- 그 외 태그의 이름과 연결 상태를 보존한다.
- 제목, 메모, 날짜, 체크리스트, Project 및 Area를 변경하지 않는다.
- 직접 SQLite 쓰기 또는 Things Cloud 네트워크 호출을 사용하지 않는다.

# Data Model: Things 칸반 프로젝트 초기 구성

## 공통 값 객체

### ThingsId

- `value: string` — AppleScript가 제공하는 비어 있지 않은 고유 텍스트 ID
- 로그에는 원문을 기록하지 않고 필요한 경우 비가역 축약값만 사용한다.

### TodoTitle

- `value: string`
- 화면 표시에는 사용하지만 기본 진단 로그에는 포함하지 않는다.

## 엔터티

### Todo

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `id` | `ThingsId` | 필수, 갱신과 원본 열기의 대상 |
| `title` | 문자열 | 비어 있으면 대체 레이블 표시 |
| `completionStatus` | `open`, `completed`, `canceled` | Things의 실제 상태 |
| `dueDate` | 날짜 또는 없음 | 마감일 |
| `scheduledDate` | 날짜 또는 없음 | Things 예정/활성일 |
| `completionDate` | 날짜 또는 없음 | 완료 조회 기간 판정 |
| `project` | `ProjectRef` 또는 없음 | 프로젝트 소속 |
| `area` | `AreaRef` 또는 없음 | 직접 Area 또는 프로젝트의 Area |
| `tags` | `TagRef[]` | 원본 태그 집합 |
| `modifiedAt` | 날짜 또는 없음 | 외부 변경 감지 보조 정보 |

**Validation**:

- `id`는 비어 있을 수 없다.
- `completed` 항목은 태그와 무관하게 `Done`으로 파생한다.
- `canceled` 항목은 MVP 보드에서 제외한다.
- 관련 없는 태그와 프로젝트/Area 연결은 상태 전이 중 보존한다.

### ProjectRef

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `id` | `ThingsId` | 필수 |
| `name` | 문자열 | 사용자 표시용 |
| `area` | `AreaRef` 또는 없음 | 상위 책임 영역 |
| `active` | 불리언 | 비활성 프로젝트 필터링 보조 |

### AreaRef

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `id` | `ThingsId` | 필수 |
| `name` | 문자열 | 사용자 표시용 |

### TagRef

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `id` | `ThingsId` 또는 없음 | AppleScript 객체 조회 시 사용 |
| `name` | 문자열 | 비교와 표시의 기본값 |

태그 이름 비교는 MVP에서 정확히 일치하는 `status:todo`, `status:in-progress`만 상태 태그로 취급한다.

## 파생 모델

### KanbanStatus

- `todo`
- `inProgress`
- `done`

### StatusMapping

| 상태 | Things 표현 |
| --- | --- |
| `todo` | 열린 할 일이며 `status:in-progress` 없음; 전이 후 명시적 `status:todo`는 허용 |
| `inProgress` | 열린 할 일이며 `status:in-progress` 태그 존재 |
| `done` | Things 실제 상태가 `completed` |

### StatusResolution

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `status` | `KanbanStatus` | 표시할 파생 상태 |
| `conflict` | 불리언 | 둘 이상의 상태 태그 존재 여부 |
| `statusTags` | 문자열 배열 | 발견된 상태 태그 |

**Resolution order**:

1. `completionStatus == completed`이면 `done`.
2. 활성 항목에 `status:in-progress`가 하나만 있으면 `inProgress`.
3. 활성 항목에 상태 태그가 없거나 `status:todo`만 있으면 `todo`.
4. `status:todo`와 `status:in-progress`가 함께 있으면 `inProgress`로 임시 표시하되 `conflict = true`; 명시적 전이 전에는 원본을 바꾸지 않는다.

### BoardQuery

| 필드 | 형식 | 기본값 |
| --- | --- | --- |
| `search` | 문자열 | 빈 문자열 |
| `projectIds` | `ThingsId[]` | 전체 |
| `areaIds` | `ThingsId[]` | 전체 |
| `tagNames` | 문자열 배열 | 전체 |
| `sort` | `dueDate`, `scheduledDate`, `title` | `dueDate` |
| `showDone` | 불리언 | `false` |
| `completedSince` | 날짜 또는 없음 | `showDone`일 때 최근 30일 |

### BoardSnapshot

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `todos` | `BoardTodo[]` | 조회 및 정규화된 카드 |
| `projects` | `ProjectRef[]` | 필터 옵션 |
| `areas` | `AreaRef[]` | 필터 옵션 |
| `tags` | `TagRef[]` | 필터 옵션 |
| `refreshedAt` | 날짜 | 원본 조회 완료 시각 |

이 스냅샷은 캐시일 뿐 영구 저장하지 않으며 언제든 Things에서 재생성한다.

## 상태 전이

### StatusTransitionRequest

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `todoId` | `ThingsId` | 필수 |
| `previousStatus` | `KanbanStatus` | 낙관적 롤백과 충돌 감지용 |
| `targetStatus` | `KanbanStatus` | 이전과 달라야 함 |
| `requestId` | 문자열 | UI 중복 요청 상관관계 |

### StatusTransitionResult

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `todo` | `BoardTodo` | Things에서 다시 읽은 권위 상태 |
| `normalizedConflict` | 불리언 | 사용자 전이로 상태 태그 충돌을 정리했는지 |
| `verifiedAt` | 날짜 | 사후 검증 시각 |

### Transition rules

| From | To | 원본 변경 |
| --- | --- | --- |
| `todo` | `inProgress` | 열린 상태 유지, 모든 상태 태그 제거 후 `status:in-progress` 추가 |
| `inProgress` | `todo` | 열린 상태 유지, 모든 상태 태그 제거; 필요 시 `status:todo` 사용 |
| `todo` 또는 `inProgress` | `done` | Things에서 완료 처리; 관련 없는 태그 보존 |
| `done` | `todo` | 완료 취소 후 상태 태그 제거/정규화 |
| `done` | `inProgress` | 완료 취소 후 상태 태그를 `status:in-progress`로 정규화 |

각 전이는 변경 직전 동일 ID를 다시 확인하고, 쓰기 후 재조회한 `StatusResolution.status`가 목표와 같을 때만 성공한다. 불일치하면 `verification_failed`이며 UI는 이전 캐시를 복원한 뒤 전체 보드를 새로고침한다.

## 오류 모델

### IntegrationError

- `things_not_installed`
- `automation_denied`
- `things_unavailable`
- `item_not_found`
- `status_conflict`
- `write_failed`
- `verification_failed`
- `invalid_request`

각 오류는 안전한 사용자 메시지, 재시도 가능 여부, 권장 행동을 가진다. AppleScript 원문 및 할 일 내용은 외부 계약에 노출하지 않는다.

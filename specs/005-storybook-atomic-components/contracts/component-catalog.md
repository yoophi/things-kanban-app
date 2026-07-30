# Component Catalog Contract

## Story Naming

모든 Story default export의 `title`은 다음 형식을 따른다.

```text
Atoms/{ComponentName}
Molecules/{ComponentName}
Organisms/{ComponentName}
Templates/{ComponentName}
Pages/{ComponentName}
```

한 컴포넌트는 하나의 주 title에만 존재하며 다른 상태는 named Story로 표현한다.

## Required Catalog Coverage

| 계층      | 최소 대표 대상                                    | 필수 상태                                    |
| --------- | ------------------------------------------------- | -------------------------------------------- |
| Atoms     | 범용 icon/button 또는 count primitive             | normal, disabled                             |
| Molecules | RefreshButton, MoveTodoMenu 또는 작은 action 조합 | normal, pending/disabled, interaction        |
| Organisms | TodoCard, BoardColumn, BoardSidebar, BoardFilters | populated, empty 또는 conflict 중 적용 상태  |
| Templates | BoardTemplate                                     | populated, empty, loading/error presentation |
| Pages     | BoardPage                                         | populated, query error, interaction          |

## Story Isolation

- 모든 Story는 제품 export를 직접 렌더링한다.
- 각 Story 실행은 새 fixture와 provider 상태를 만든다.
- Page Story의 Tauri command는 mock이며 예상하지 않은 호출은 실패한다.
- Story는 실제 Things 제목, ID, 태그, 메모 및 macOS 권한에 의존하지 않는다.
- Story 간 mutation, scope 및 QueryClient 상태가 공유되지 않는다.

## Interaction Contract

- 공개 props는 controls에서 변경할 수 있다.
- button, select 및 form은 keyboard interaction으로 검증한다.
- drag 가능한 카드 Story는 동일한 목표를 선택할 수 있는 상태 select를 함께 제공한다.
- loading, empty, error, pending 및 conflict는 색상 외 텍스트나 접근 가능한 상태를 가진다.

## Dependency Contract

- Atoms는 Molecules, Organisms, Templates, Pages를 import하지 않는다.
- Molecules는 Organisms, Templates, Pages를 import하지 않는다.
- Organisms는 Templates, Pages를 import하지 않는다.
- Templates는 Page hook, query API 또는 Tauri command를 import하지 않는다.
- Pages만 제품 orchestration을 Template에 연결한다.

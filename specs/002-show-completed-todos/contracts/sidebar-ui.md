# Sidebar and Main Kanban UI Contract

## Layout regions

- `nav` 영역 이름: `Area 및 프로젝트`
- `main` 영역 이름: 현재 BoardScope 이름을 포함한 `칸반 보드`
- 사이드바 접기 버튼은 `aria-expanded`로 상태를 전달한다.

## Scope values

```ts
type BoardScope =
  | { kind: "all" }
  | { kind: "area"; id: string }
  | { kind: "project"; id: string };
```

## Sidebar behavior

- 첫 항목은 `전체 보기`다.
- Area는 이름순으로 표시한다.
- Area 소속 Project는 해당 Area 아래 한 단계 들여쓰기하고 이름순으로 표시한다.
- Area 없는 Project는 `독립 프로젝트` 그룹에 이름순으로 표시한다.
- 각 항목은 버튼이며 현재 선택에는 `aria-current="page"`를 적용한다.
- 중복 이름은 별도 ID를 가진 별도 버튼으로 유지하며 필요하면 부모 Area 문맥을 접근 가능한 이름에 포함한다.
- 접힌 상태에서도 현재 선택은 유지한다.

## Scope filtering

- `all`: 모든 카드 포함
- `project(id)`: `todo.project?.id === id`
- `area(id)`: `todo.area?.id === id || todo.project?.area?.id === id`
- 범위 선택 후 검색·태그·정렬을 적용한다.
- 세 열과 열별 개수는 동일한 최종 결과에서 파생한다.

## Stale selection

새 BoardSnapshot에 선택한 ID가 없으면:

1. BoardScope를 `all`로 바꾼다.
2. 전체 보드를 표시한다.
3. 라이브 영역에 `선택한 항목이 더 이상 없어 전체 보기로 전환했습니다.`를 알린다.

## Main Kanban

- `Todo`, `In Progress`, `Done · 최근 30일`을 항상 렌더링한다.
- 각 열은 0개일 때도 유지하며 독립 빈 상태를 갖는다.
- 메인 헤더는 현재 범위의 종류와 이름을 표시한다.
- 카드 문맥은 Project 이름을 우선 표시하고 부모 Area, Area 직속, 소속 없음을 텍스트로 구분한다.

## Accessibility acceptance

- Tab/Shift+Tab으로 사이드바 버튼과 접기 버튼에 도달할 수 있다.
- Enter/Space로 범위를 선택하고 사이드바를 접거나 펼칠 수 있다.
- 현재 범위와 열별 개수는 보조 기술로 확인할 수 있다.
- 프로젝트/Area 구별은 색상에만 의존하지 않는다.

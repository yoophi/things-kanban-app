# Quickstart: 4단계 할 일 상태 검증

## 1. 자동 검증

저장소 루트에서 실행한다.

```bash
pnpm check-types
pnpm test
cargo test --workspace
pnpm build
pnpm storybook:test
pnpm test:e2e
git diff --check
```

배포 전 macOS 번들까지 검증할 때 실행한다.

```bash
pnpm tauri:build
```

## 2. 상태 판정 검증

테스트 fixture 또는 전용 Things 테스트 할 일로 다음 조합을 확인한다.

| 완료      | Today | 태그                     | 기대 상태   |
| --------- | ----- | ------------------------ | ----------- |
| completed | 무관  | `backlog`, `in progress` | Done        |
| open      | true  | `in progress`            | In Progress |
| open      | false | `in progress`            | In Progress |
| open      | true  | `backlog`                | Backlog     |
| open      | false | `today`                  | To Do       |
| open      | false | `to do`                  | To Do       |
| open      | false | 없음                     | Backlog     |
| open      | true  | 없음                     | To Do       |

각 항목은 정확히 한 칼럼에만 나타나야 하며 서로 다른 열린 상태 신호가 겹치면 충돌 신호도 유지해야 한다.

## 3. Backlog에서 To Do 전이

1. `backlog`, `important` 태그와 Project 또는 Area 소속이 있는 열린 테스트 할 일을 준비한다.
2. 앱에서 해당 범위를 선택하고 Backlog 카드가 표시되는지 확인한다.
3. 드래그 또는 키보드 상태 선택으로 To Do로 옮긴다.
4. Things에서 `backlog`가 제거되고 `to do`가 정확히 하나 있는지 확인한다.
5. `important`, 제목, 날짜와 Project/Area 소속이 그대로인지 확인한다.
6. 앱 새로고침과 포커스 복귀 후에도 카드가 To Do에 남는지 확인한다.

## 4. 충돌과 실패 복구

- Today 목록의 할 일에 `backlog`를 붙이면 Backlog로 표시되는지 확인한다.
- `backlog`와 `in progress`를 함께 붙이면 In Progress로 표시되고 충돌이 보고되는지 확인한다.
- 자동화 권한을 거부한 상태에서 Backlog→To Do를 시도하면 이전 snapshot으로 복구되고 오류 안내 후 권위 상태로 재조회되는지 확인한다.
- 전이 직후 Things에서 태그를 외부 변경한 뒤 새로고침하면 최신 상태로 수렴하는지 확인한다.

## 5. 접근성 및 필터 회귀

- 키보드만으로 네 상태를 모두 선택할 수 있고 드래그와 동일한 command를 호출하는지 확인한다.
- Project/Area, 검색과 태그 필터가 네 칼럼 모두에 동일하게 적용되는지 확인한다.
- Backlog, To Do, In Progress, Done 제목과 개수가 색상 없이도 식별되는지 확인한다.
- 로딩, 빈 칼럼, 진행, 성공, 실패 메시지가 보조 기술에 전달되는지 확인한다.

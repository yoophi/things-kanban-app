# Quickstart: Atomic Storybook 컴포넌트 카탈로그 검증

## 1. 카탈로그 실행

```bash
pnpm --filter things-kanban storybook
```

브라우저에서 Atoms, Molecules, Organisms, Templates, Pages 순서와 각 대표 Story를 확인한다.

## 2. 자동 검증

```bash
pnpm check-types
pnpm test
pnpm storybook:test
pnpm test:e2e
pnpm build
git diff --check
```

배포 전 macOS 제품 회귀를 확인한다.

```bash
pnpm tauri:build
```

## 3. Atomic 계층 검증

- 각 대상 컴포넌트가 정확히 하나의 계층 title 아래에 있는지 확인한다.
- Atoms→Molecules→Organisms→Templates→Pages 방향을 거슬러 import하지 않는지 확인한다.
- BoardTemplate이 query hook, Tauri command 또는 Things adapter를 import하지 않는지 확인한다.
- BoardPage가 기존 query, scope, transition, refresh 동작을 Template에 연결하는지 확인한다.

## 4. 대표 상태 검증

- Atom의 normal/disabled 상태를 확인한다.
- Molecule의 pending과 keyboard interaction을 확인한다.
- Organism의 populated, empty, conflict 상태를 확인한다.
- Template의 populated, empty, loading/error presentation을 확인한다.
- Page의 populated, query error 및 mutation interaction을 확인한다.

모든 예시는 합성 fixture만 사용하며 실제 Things가 종료된 상태에서도 렌더링되어야 한다.

## 5. React Grab 검증

1. 각 Atomic 계층의 대표 Story를 하나씩 연다.
2. 렌더링 요소를 선택해 React 구성요소 문맥이 표시되는지 확인한다.
3. Story를 20회 전환하고 중복 overlay 또는 event가 없는지 확인한다.
4. React Grab import 실패를 주입하고 Story canvas와 interaction이 계속 동작하는지 확인한다.
5. 제품 production build에서 Storybook preview 초기화가 포함되지 않는지 확인한다.

## 6. Things 및 접근성 안전

- Story interaction 중 실제 Tauri command 호출이 0회인지 확인한다.
- 사용자 Things 제목, ID, 태그 및 메모가 fixture나 출력에 없는지 확인한다.
- axe 오류가 없고 모든 주요 흐름을 keyboard만으로 완료할 수 있는지 확인한다.
- drag 예시에 동일한 상태 select가 표시되는지 확인한다.

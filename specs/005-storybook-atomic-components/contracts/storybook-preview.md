# Storybook Preview Contract

## React Grab Initialization

Storybook preview는 렌더링 전에 다음 멱등 계약을 만족한다.

```text
if initialization promise exists:
  reuse it
else:
  create one dynamic import promise for react-grab
  store it on globalThis
  catch failure without throwing into Story rendering
```

## Environment Boundaries

- 초기화 코드는 `.storybook/preview.tsx`에서만 Storybook 전역으로 적용한다.
- Story component와 decorator는 React Grab을 개별 import하지 않는다.
- production 앱 build는 Storybook preview 모듈을 import하지 않는다.
- React Grab 초기화 실패는 Story canvas, controls, interaction 및 a11y 검사를 중단하지 않는다.
- 실패 처리에는 fixture props, todo 제목, 태그 또는 식별자를 기록하지 않는다.

## Idempotency Verification

- 한 preview 문서에서 Story를 20회 전환해도 import promise는 하나다.
- StrictMode 재렌더링은 추가 초기화를 만들지 않는다.
- 실패 promise도 같은 preview 수명 동안 재사용하여 반복 오류를 만들지 않는다.
- preview 문서가 새로 로드되면 새 문서 범위에서 한 번 초기화할 수 있다.

## Things Safety

- preview는 Tauri runtime 존재 여부와 무관하게 동작한다.
- command mock 외 실제 `invoke`, AppleScript, Things URL scheme 또는 CLI를 호출하지 않는다.
- mock mutation은 해당 Story fixture 안에서만 상태를 변경한다.

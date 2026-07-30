# Things Kanban

Things 3의 할 일을 칸반 보드로 관리하는 macOS 데스크톱 앱입니다.

Things 태그를 이용해 작업을 `To Do`와 `In Progress`로 구분하고, Things의 완료 상태를 `Done`으로 표시합니다. 카드를 드래그 앤 드롭하면 변경된 상태가 Things에 반영됩니다.

## 주요 기능

- Things 할 일을 칸반 보드로 표시
- 드래그 앤 드롭을 통한 상태 변경
- 프로젝트, Area, 태그 필터 및 검색
- 완료된 할 일 선택적 표시
- 각 할 일을 Things에서 바로 열기
- Things CLI, AppleScript 및 URL scheme 연동

## 기술 스택

- Tauri 2 / Rust
- React 19 / TypeScript / Vite
- TanStack Query
- Tailwind CSS 4
- shadcn/ui
- pnpm / Turbo

## 개발 상태

현재 초기 설계 단계입니다. 상세 목표와 구현 범위는 [GOAL.md](./GOAL.md)를 참고하세요.

## 원칙

Things 3를 원본 데이터로 유지합니다. Things 데이터 쓰기는 AppleScript 또는 URL scheme으로만 수행하며, Things SQLite 데이터베이스에는 직접 쓰지 않습니다.

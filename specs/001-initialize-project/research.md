# Phase 0 Research: Things 칸반 프로젝트 초기 구성

## 1. Things 연동의 기본 경로

**Decision**: MVP의 읽기와 쓰기는 AppleScript를 기본 경로로 사용하고, 개별 항목 열기는 AppleScript `show`를 우선 사용한다. Things CLI와 SQLite는 초기 구현 경로에 포함하지 않는다.

**Rationale**:

- 현재 개발 환경에는 Things 3가 설치되어 있지만 `things` CLI 명령은 없다.
- 설치된 Things 3의 AppleScript 사전은 할 일·프로젝트·Area·태그의 텍스트 ID, 할 일 상태, 완료일, 마감일, 예정일, 태그 이름, 프로젝트/Area 관계 및 `show` 동작을 공개한다.
- Cultured Code의 공식 AppleScript 문서는 할 일 조회, 속성 변경, 태그 설정, 프로젝트/Area 조회 및 UI에서 항목 보기를 지원한다고 명시한다.
- AppleScript 하나로 MVP의 식별, 조회, 상태 태그 변경, 완료/완료 취소, 원본 열기를 충족할 가능성이 높아 읽기 전용 SQLite의 스키마 결합 위험을 피할 수 있다.

**Alternatives considered**:

- **Things CLI 우선**: 현재 설치되지 않았고 표준 필수 의존성으로 가정할 수 없어 제외했다. 향후 도입 시 AppleScript ID와의 호환성 계약 테스트가 선행되어야 한다.
- **읽기 전용 SQLite + AppleScript 쓰기**: 대량 조회에는 유리할 수 있으나 스키마 의존성과 ID 교차 검증 비용이 있다. AppleScript 성능이 목표를 충족하지 못한다는 측정 결과가 있을 때만 추가한다.
- **URL scheme 쓰기**: 지원되는 동작에는 안전하지만 태그를 보존하며 기존 항목을 갱신하고 결과를 확인하는 흐름은 AppleScript가 더 직접적이다.

**Sources**:

- [Cultured Code: Things AppleScript Commands](https://culturedcode.com/things/support/articles/4562654/)
- 로컬 `/Applications/Things3.app` AppleScript 사전(`sdef`) 확인, 2026-07-30

## 2. 안정적인 식별자와 보존적 쓰기

**Decision**: AppleScript의 텍스트 `id`를 도메인의 `ThingsId`로 사용한다. 태그 상태 변경은 기존 태그 집합을 읽고 상태 태그만 제거·추가한 전체 집합을 한 번에 설정한 뒤 동일 ID를 재조회해 검증한다.

**Rationale**:

- 설치된 사전에서 할 일, 프로젝트/목록, 태그 모두 읽기 전용 고유 텍스트 ID를 제공한다.
- `tag names` 설정은 전체 문자열을 교체하므로, 변경 전 비상태 태그를 보존한 새 집합을 계산해야 TI-005를 만족한다.
- 이름은 중복·변경 가능하므로 업데이트 대상 식별자로 사용할 수 없다.

**Alternatives considered**:

- **이름 기반 식별**: 중복과 이름 변경 때문에 잘못된 항목을 수정할 위험이 있어 거부했다.
- **내부 SQLite 기본 키**: AppleScript 객체 ID와의 호환성을 별도로 입증해야 하고 저장소 스키마에 결합되므로 거부했다.
- **보드 자체 ID 생성**: Things와 독립된 두 번째 권위가 생기므로 거부했다.

## 3. 완료와 완료 취소

**Decision**: `Done` 전이는 AppleScript 상태 또는 완료일의 지원되는 공개 속성을 사용하고, 완료 취소는 `open` 상태로 복구한 뒤 목표 활성 상태 태그를 정규화한다. 모든 전이는 재조회 결과가 목표 상태와 일치할 때만 성공이다.

**Rationale**:

- AppleScript 사전은 할 일 `status`를 읽기/쓰기로, `completion date`를 읽기/쓰기로 제공한다.
- 완료 여부를 상태 태그와 중복 저장하지 않으면서 Things의 실제 완료 상태를 권위로 유지할 수 있다.

**Alternatives considered**:

- **`status:done` 태그**: Things의 완료 상태와 불일치할 수 있어 거부했다.
- **UI에서만 완료 표시**: 앱 재시작과 외부 변경 시 손실되며 Things가 원본이라는 원칙을 위반한다.

## 4. 드래그 앤 드롭

**Decision**: 새 API의 최신 안정 `@dnd-kit/react`와 `@dnd-kit/dom`을 후보로 채택하고, 구현 착수 시 React 19 다중 컨테이너 스파이크와 키보드·스크린리더 테스트를 통과한 정확한 버전을 잠근다. 드래그와 별개로 카드 액션 메뉴에 상태 이동 명령을 제공한다.

**Rationale**:

- 공식 프로젝트는 다중 컨테이너, 포인터·터치·키보드 센서, ARIA 속성, 스크린리더 지침과 라이브 영역을 지원한다.
- 2026년에도 새 API 릴리스와 유지보수가 이어지고 있다.
- 라이브러리 기본값만으로 접근성을 완료할 수 없으므로 보드 맥락에 맞는 안내와 명시적 이동 메뉴가 필요하다.

**Alternatives considered**:

- **HTML Drag and Drop API 직접 구현**: 키보드 및 보조 기술 동등성을 직접 구축·검증해야 해 범위와 위험이 크다.
- **react-dnd**: 범용성이 높지만 이 기능의 키보드 센서와 라이브 알림을 더 많이 직접 구성해야 한다.
- **@hello-pangea/dnd**: 목록 중심 API는 적합하지만 새 React API와 프로젝트 유지 상태를 별도로 검증해야 한다. 다중 열의 단순 상태 이동에는 dnd-kit의 센서/확장 구조가 더 적합하다.

**Sources**:

- [dnd-kit repository and feature matrix](https://github.com/clauderic/dnd-kit)
- [dnd-kit accessibility guide](https://docs.dndkit.com/guides/accessibility)

## 5. 프런트엔드 상태와 동기화

**Decision**: 서버 상태는 TanStack Query 캐시로 관리하고, 필터·정렬·완료 표시 설정은 URL이 없는 단일 창의 로컬 UI 상태로 둔다. 상태 전이는 `onMutate`에서 이전 캐시를 보관하고, Tauri command가 반환한 재조회 결과로 확정하며 실패 시 복원한다.

**Rationale**:

- 캐시는 Things에서 언제든 재생성할 수 있어 단일 원본 원칙을 지킨다.
- command 성공 여부뿐 아니라 재조회된 권위 상태로 화면을 교체해 외부 변경과 스크립트 부분 실패를 처리한다.
- 포커스 복귀와 수동 새로고침은 동일 쿼리 무효화 경로를 사용한다.

**Alternatives considered**:

- **별도 로컬 데이터베이스**: 두 번째 권위와 동기화 문제가 생겨 거부했다.
- **모든 상태를 컴포넌트 내부에서 관리**: 재조회·롤백·중복 요청 제어가 분산되어 거부했다.

## 6. 오류와 개인정보 보호

**Decision**: 오류는 `things_not_installed`, `automation_denied`, `things_unavailable`, `item_not_found`, `status_conflict`, `write_failed`, `verification_failed`, `invalid_request`로 정규화한다. 로그에는 요청 ID, 동작 종류, 대상 ID의 비가역 축약값, 오류 코드와 소요 시간만 기록한다.

**Rationale**:

- 사용자가 해결할 수 있는 권한/설치 오류와 재시도 가능한 일시 오류를 구분해야 한다.
- 제목, 메모 및 태그는 개인 정보를 포함할 수 있으며 진단에 기본적으로 필요하지 않다.

**Alternatives considered**:

- **AppleScript 원문 오류 그대로 노출**: 사용자가 이해하기 어렵고 데이터가 포함될 수 있어 거부했다.
- **모든 오류를 연결 실패로 통합**: 적절한 복구 안내와 자동 재시도를 결정할 수 없어 거부했다.

## Resolved Unknowns

- Things 읽기/쓰기 기본 경로: AppleScript
- Things 식별자: AppleScript 공개 텍스트 ID
- Things CLI: 현재 미설치, MVP 필수 경로 제외
- SQLite: 초기 구현 제외, 성능 근거가 생길 때만 읽기 전용으로 재검토
- 드래그 앤 드롭: 최신 안정 dnd-kit 새 API 후보, 스파이크 후 정확한 버전 잠금
- 기본 완료 조회 기간: 최근 30일
- 대상 환경: macOS 15 이상, 단일 사용자 로컬 앱

계획을 막는 미해결 질문은 없다.

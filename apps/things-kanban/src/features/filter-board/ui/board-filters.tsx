import { Search, SlidersHorizontal, X } from "lucide-react";
import type {
  BoardQuery,
  BoardSnapshot,
} from "@/shared/api/contracts";

interface Props {
  snapshot: BoardSnapshot;
  query: BoardQuery;
  onChange: (patch: Partial<BoardQuery>) => void;
  onClear: () => void;
}

export function BoardFilters({ snapshot, query, onChange, onClear }: Props) {
  return (
    <section className="filters" aria-label="보드 필터">
      <label className="search">
        <Search aria-hidden size={16} />
        <span className="sr-only">제목 검색</span>
        <input
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="할 일 검색"
        />
      </label>
      <label>
        <span>프로젝트</span>
        <select
          value={query.projectIds[0] ?? ""}
          onChange={(event) =>
            onChange({ projectIds: event.target.value ? [event.target.value] : [] })
          }
        >
          <option value="">전체</option>
          {snapshot.projects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Area</span>
        <select
          value={query.areaIds[0] ?? ""}
          onChange={(event) =>
            onChange({ areaIds: event.target.value ? [event.target.value] : [] })
          }
        >
          <option value="">전체</option>
          {snapshot.areas.map((area) => (
            <option value={area.id} key={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <SlidersHorizontal aria-hidden size={15} />
        <span>정렬</span>
        <select
          value={query.sort}
          onChange={(event) =>
            onChange({ sort: event.target.value as BoardQuery["sort"] })
          }
        >
          <option value="dueDate">마감일</option>
          <option value="scheduledDate">예정일</option>
          <option value="title">제목</option>
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={query.showDone}
          onChange={(event) => onChange({ showDone: event.target.checked })}
        />
        최근 완료
      </label>
      <button className="quiet" onClick={onClear} type="button">
        <X aria-hidden size={14} />
        초기화
      </button>
    </section>
  );
}

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { BoardQuery } from "@/shared/api/contracts";

interface Props {
  query: BoardQuery;
  onChange: (patch: Partial<BoardQuery>) => void;
  onClear: () => void;
}

export function BoardFilters({ query, onChange, onClear }: Props) {
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
      <button className="quiet" onClick={onClear} type="button">
        <X aria-hidden size={14} />
        초기화
      </button>
    </section>
  );
}

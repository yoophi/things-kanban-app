import type { KanbanStatus } from "@/shared/api/contracts";

const labels: Record<KanbanStatus, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

export function MoveTodoMenu({
  status,
  disabled,
  onMove,
}: {
  status: KanbanStatus;
  disabled: boolean;
  onMove: (status: KanbanStatus) => void;
}) {
  return (
    <label className="move-menu">
      <span className="sr-only">상태 이동</span>
      <select
        aria-label="상태 이동"
        disabled={disabled}
        value={status}
        onChange={(event) => onMove(event.target.value as KanbanStatus)}
      >
        {Object.entries(labels).map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

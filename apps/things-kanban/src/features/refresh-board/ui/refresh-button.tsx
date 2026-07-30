import { RefreshCw } from "lucide-react";

export function RefreshButton({
  pending,
  onRefresh,
}: {
  pending: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      className="primary"
      onClick={onRefresh}
      disabled={pending}
      type="button"
    >
      <RefreshCw className={pending ? "spin" : ""} aria-hidden size={16} />
      {pending ? "동기화 중" : "새로고침"}
    </button>
  );
}

import { ExternalLink } from "lucide-react";

export function OpenInThingsButton({
  disabled,
  onOpen,
}: {
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className="icon-button"
      type="button"
      disabled={disabled}
      onClick={onOpen}
      aria-label="Things에서 열기"
      title={disabled ? "원본 식별자가 없어 열 수 없습니다" : "Things에서 열기"}
    >
      <ExternalLink aria-hidden size={15} />
    </button>
  );
}

import { ExternalLink } from "lucide-react";
import { IconButton } from "@/shared/ui/atoms/icon-button";

export function OpenInThingsButton({
  disabled,
  onOpen,
}: {
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <IconButton
      label="Things에서 열기"
      disabled={disabled}
      onClick={onOpen}
      title={disabled ? "원본 식별자가 없어 열 수 없습니다" : "Things에서 열기"}
    >
      <ExternalLink aria-hidden size={15} />
    </IconButton>
  );
}

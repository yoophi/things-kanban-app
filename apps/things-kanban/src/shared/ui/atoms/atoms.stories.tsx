import { ExternalLink } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./icon-button";
import { CountBadge } from "./count-badge";

const meta: Meta<typeof IconButton> = {
  title: "Atoms/IconButton",
  component: IconButton,
  args: {
    label: "원본에서 열기",
    children: <ExternalLink aria-hidden size={16} />,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Disabled: Story = { args: { disabled: true } };

export const Count: Story = {
  render: () => <CountBadge count={4} />,
};

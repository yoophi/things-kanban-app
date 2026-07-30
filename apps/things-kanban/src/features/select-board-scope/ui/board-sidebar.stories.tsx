import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { storyBoardFixture } from "@/shared/test/storybook-board-fixtures";
import { BoardSidebar } from "./board-sidebar";

const meta = {
  title: "Organisms/BoardSidebar",
  component: BoardSidebar,
  args: {
    snapshot: storyBoardFixture,
    scope: { kind: "all" },
    collapsed: false,
    onSelect: fn(),
    onToggleCollapsed: fn(),
  },
} satisfies Meta<typeof BoardSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};
export const Collapsed: Story = { args: { collapsed: true } };

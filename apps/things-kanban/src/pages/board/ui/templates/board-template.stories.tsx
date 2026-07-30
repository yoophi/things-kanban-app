import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { defaultBoardQuery } from "@/entities/board/model";
import {
  emptyBoardFixture,
  pendingTodoFixture,
  storyBoardFixture,
} from "@/shared/test/storybook-board-fixtures";
import { BoardTemplate } from "./board-template";

const meta = {
  title: "Templates/BoardTemplate",
  component: BoardTemplate,
  parameters: { layout: "fullscreen" },
  args: {
    snapshot: storyBoardFixture,
    unfilteredSnapshot: storyBoardFixture,
    query: { ...defaultBoardQuery, tagNames: [] },
    scope: { kind: "all" },
    collapsed: false,
    refreshing: false,
    onFilterChange: fn(),
    onFilterClear: fn(),
    onScopeSelect: fn(),
    onToggleSidebar: fn(),
    onRefresh: fn(),
    onMove: fn(),
    onOpen: fn(),
  },
} satisfies Meta<typeof BoardTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = {
  args: { snapshot: emptyBoardFixture, unfilteredSnapshot: emptyBoardFixture },
};
export const Pending: Story = {
  args: { pendingId: pendingTodoFixture.id, refreshing: true },
};
export const Error: Story = {
  args: {
    errorMessage:
      "합성 오류 상태입니다. 실제 Things 또는 Tauri command를 호출하지 않습니다.",
  },
};

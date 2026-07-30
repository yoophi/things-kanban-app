import { DragDropProvider } from "@dnd-kit/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  conflictTodoFixture,
  pendingTodoFixture,
} from "@/shared/test/storybook-board-fixtures";
import { BoardColumn } from "./board-column";

const meta = {
  title: "Organisms/BoardColumn",
  component: BoardColumn,
  decorators: [
    (Story) => (
      <DragDropProvider>
        <Story />
      </DragDropProvider>
    ),
  ],
  args: {
    title: "In Progress",
    status: "inProgress",
    todos: [conflictTodoFixture],
    onMove: fn(),
    onOpen: fn(),
  },
} satisfies Meta<typeof BoardColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = { args: { todos: [] } };
export const Pending: Story = {
  args: { todos: [pendingTodoFixture], pendingId: pendingTodoFixture.id },
};

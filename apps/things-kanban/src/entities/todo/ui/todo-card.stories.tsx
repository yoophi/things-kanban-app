import { DragDropProvider } from "@dnd-kit/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  conflictTodoFixture,
  pendingTodoFixture,
} from "@/shared/test/storybook-board-fixtures";
import { TodoCard } from "./todo-card";

const meta = {
  title: "Molecules/TodoCard",
  component: TodoCard,
  decorators: [
    (Story) => (
      <DragDropProvider>
        <Story />
      </DragDropProvider>
    ),
  ],
  args: {
    todo: pendingTodoFixture,
    pending: false,
    onMove: fn(),
    onOpen: fn(),
  },
} satisfies Meta<typeof TodoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Pending: Story = { args: { pending: true } };
export const Conflict: Story = { args: { todo: conflictTodoFixture } };

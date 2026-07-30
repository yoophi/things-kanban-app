import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MoveTodoMenu } from "./move-todo-menu";

const meta = {
  title: "Molecules/MoveTodoMenu",
  component: MoveTodoMenu,
  args: { status: "todo", disabled: false, onMove: fn() },
} satisfies Meta<typeof MoveTodoMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Todo: Story = {};
export const Disabled: Story = { args: { disabled: true } };

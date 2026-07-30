import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RefreshButton } from "./refresh-button";

const meta = {
  title: "Molecules/RefreshButton",
  component: RefreshButton,
  args: { pending: false, onRefresh: fn() },
} satisfies Meta<typeof RefreshButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Pending: Story = { args: { pending: true } };

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { OpenInThingsButton } from "./open-in-things-button";

const meta = {
  title: "Molecules/OpenInThingsButton",
  component: OpenInThingsButton,
  args: { onOpen: fn() },
} satisfies Meta<typeof OpenInThingsButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const MissingId: Story = { args: { disabled: true } };

import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardSkeleton } from "./board-skeleton";

const meta = {
  title: "Organisms/BoardSkeleton",
  component: BoardSkeleton,
} satisfies Meta<typeof BoardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { defaultBoardQuery } from "@/entities/board/model";
import { BoardFilters } from "./board-filters";

const meta = {
  title: "Organisms/BoardFilters",
  component: BoardFilters,
  args: {
    query: { ...defaultBoardQuery, tagNames: [] },
    onChange: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof BoardFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Searching: Story = {
  args: {
    query: { ...defaultBoardQuery, tagNames: [], search: "합성 작업" },
  },
};

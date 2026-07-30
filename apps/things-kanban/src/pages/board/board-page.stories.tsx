import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardPage } from "./board-page";
import { QueryProvider } from "@/app/providers/query-provider";

const meta: Meta<typeof BoardPage> = {
  title: "Pages/Board",
  component: BoardPage,
  decorators: [
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const ThreeColumnsWithNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Todo, In Progress, Done 열과 Area/Project 사이드바를 함께 표시합니다.",
      },
    },
  },
};

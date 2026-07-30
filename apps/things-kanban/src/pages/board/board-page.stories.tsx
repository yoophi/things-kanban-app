import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardPage } from "./board-page";
import { StoryProviders } from "@/shared/test/storybook-decorators";

const meta: Meta<typeof BoardPage> = {
  title: "Pages/BoardPage",
  component: BoardPage,
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const FourColumnsWithNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Backlog, Todo, In Progress, Done 열과 Area/Project 사이드바를 함께 표시합니다.",
      },
    },
  },
};

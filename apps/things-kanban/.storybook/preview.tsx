import type { Preview } from "@storybook/react-vite";
import "../src/app/styles/globals.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
  },
};

export default preview;

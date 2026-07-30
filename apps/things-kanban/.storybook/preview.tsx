import type { Preview } from "@storybook/react-vite";
import { initializeReactGrab } from "./react-grab-loader";
import "../src/app/styles/globals.css";

void initializeReactGrab();

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    options: {
      storySort: {
        order: ["Atoms", "Molecules", "Organisms", "Templates", "Pages"],
      },
    },
  },
};

export default preview;

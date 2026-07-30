import { BoardPage } from "@/pages/board/board-page";
import { ErrorBoundary } from "./providers/error-boundary";
import { QueryProvider } from "./providers/query-provider";

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BoardPage />
      </QueryProvider>
    </ErrorBoundary>
  );
}

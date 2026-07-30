export function BoardSkeleton() {
  return (
    <div
      className="board skeleton"
      aria-label="보드를 불러오는 중"
      aria-busy="true"
    >
      {[1, 2, 3].map((column) => (
        <div className="column" key={column}>
          <div className="skeleton-line" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ))}
    </div>
  );
}

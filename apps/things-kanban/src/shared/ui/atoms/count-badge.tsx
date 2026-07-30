export function CountBadge({ count }: { count: number }) {
  return <span aria-label={`${count}개`}>{count}</span>;
}

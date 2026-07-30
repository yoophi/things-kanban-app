export function StatusAnnouncer({ message }: { message: string }) {
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {message}
    </div>
  );
}

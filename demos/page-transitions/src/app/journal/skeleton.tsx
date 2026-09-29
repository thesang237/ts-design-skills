export function JournalSkeleton() {
  return (
    <ul className="entries skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i}>
          <span className="bone bone-s" />
          <span className="bone bone-l" />
        </li>
      ))}
    </ul>
  )
}

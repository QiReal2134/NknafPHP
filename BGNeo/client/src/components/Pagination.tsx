interface PaginationProps { current: number; total: number; pageSize: number; onChange: (page: number) => void }

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return (
    <nav className="pagination" aria-label="分页导航">
      <button disabled={current <= 1} onClick={() => onChange(current - 1)}>&laquo;</button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`dots-${i}`} className="pagination-dots">...</span>
      ) : (
        <button key={p} className={current === p ? 'active' : ''} onClick={() => onChange(p as number)}>{p}</button>
      ))}
      <button disabled={current >= totalPages} onClick={() => onChange(current + 1)}>&raquo;</button>
    </nav>
  );
}

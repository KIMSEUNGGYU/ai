interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div style={styles.container}>
      <span style={styles.info}>
        {startItem}-{endItem} / {total}건
      </span>

      <div style={styles.buttons}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            ...styles.btn,
            ...(page <= 1 ? styles.btnDisabled : {}),
          }}
        >
          &#8249;
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} style={styles.dots}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                ...styles.btn,
                ...(p === page ? styles.btnActive : {}),
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            ...styles.btn,
            ...(page >= totalPages ? styles.btnDisabled : {}),
          }}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
  },
  info: {
    fontSize: 12,
    color: "#484f58",
  },
  buttons: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  btn: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#c9d1d9",
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
    minWidth: 32,
    textAlign: "center",
  },
  btnActive: {
    background: "#58a6ff",
    color: "#0d1117",
    borderColor: "#58a6ff",
    fontWeight: 600,
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  dots: {
    color: "#484f58",
    fontSize: 12,
    padding: "0 4px",
  },
};

import { useState, useCallback, useEffect } from "react";

interface PromptLogFiltersProps {
  users: string[];
  projects: string[];
  onFilterChange: (filters: PromptLogFilterValues) => void;
}

export interface PromptLogFilterValues {
  userId: string;
  search: string;
  projectPath: string;
  dateFrom: string;
  dateTo: string;
}

export function PromptLogFilters({ users, projects, onFilterChange }: PromptLogFiltersProps) {
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange({
      userId,
      search: debouncedSearch,
      projectPath,
      dateFrom,
      dateTo,
    });
  }, [userId, debouncedSearch, projectPath, dateFrom, dateTo, onFilterChange]);

  const hasActiveFilters = userId || search || projectPath || dateFrom || dateTo;

  const resetFilters = useCallback(() => {
    setUserId("");
    setSearch("");
    setProjectPath("");
    setDateFrom("");
    setDateTo("");
  }, []);

  return (
    <div style={styles.container}>
      {/* Primary row: search + user filter */}
      <div style={styles.primaryRow}>
        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>&#128269;</span>
          <input
            type="text"
            placeholder="프롬프트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={styles.clearSearchBtn}
            >
              &times;
            </button>
          )}
        </div>

        <label style={styles.filterLabel}>
          <span style={styles.filterLabelText}>User</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">전체</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            ...styles.expandBtn,
            ...(expanded ? styles.expandBtnActive : {}),
          }}
        >
          {expanded ? "필터 접기" : "상세 필터"}
          <span style={styles.expandArrow}>{expanded ? "▲" : "▼"}</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={styles.resetBtn}
          >
            초기화
          </button>
        )}
      </div>

      {/* Expanded: additional filters */}
      {expanded && (
        <div style={styles.expandedRow}>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>프로젝트</span>
            <select
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">전체</option>
              {projects.map((p) => (
                <option key={p} value={p}>{shortenPath(p)}</option>
              ))}
            </select>
          </label>

          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>시작일</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value ? `${e.target.value}T00:00:00.000Z` : "")}
              style={styles.filterInput}
            />
          </label>

          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>종료일</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value ? `${e.target.value}T23:59:59.999Z` : "")}
              style={styles.filterInput}
            />
          </label>
        </div>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div style={styles.badgeRow}>
          {userId && (
            <span style={styles.badge}>
              User: {userId}
              <button onClick={() => setUserId("")} style={styles.badgeClose}>&times;</button>
            </span>
          )}
          {search && (
            <span style={styles.badge}>
              검색: &quot;{search}&quot;
              <button onClick={() => setSearch("")} style={styles.badgeClose}>&times;</button>
            </span>
          )}
          {projectPath && (
            <span style={styles.badge}>
              프로젝트: {shortenPath(projectPath)}
              <button onClick={() => setProjectPath("")} style={styles.badgeClose}>&times;</button>
            </span>
          )}
          {dateFrom && (
            <span style={styles.badge}>
              From: {dateFrom.slice(0, 10)}
              <button onClick={() => setDateFrom("")} style={styles.badgeClose}>&times;</button>
            </span>
          )}
          {dateTo && (
            <span style={styles.badge}>
              To: {dateTo.slice(0, 10)}
              <button onClick={() => setDateTo("")} style={styles.badgeClose}>&times;</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function shortenPath(p: string): string {
  return p.replace(/^\/Users\/[^/]+\//, "~/");
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 16px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 8,
  },
  primaryRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 200,
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "0 10px",
    position: "relative",
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#c9d1d9",
    fontSize: 13,
    padding: "8px 0",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  clearSearchBtn: {
    background: "transparent",
    border: "none",
    color: "#8b949e",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 2px",
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  filterLabelText: {
    fontSize: 11,
    color: "#8b949e",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  filterSelect: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#c9d1d9",
    padding: "6px 8px",
    fontSize: 12,
    fontFamily: "'SF Mono', monospace",
  },
  filterInput: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#c9d1d9",
    padding: "5px 8px",
    fontSize: 12,
    fontFamily: "'SF Mono', monospace",
    colorScheme: "dark",
  },
  expandBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#8b949e",
    padding: "6px 10px",
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  },
  expandBtnActive: {
    borderColor: "#58a6ff",
    color: "#58a6ff",
  },
  expandArrow: {
    fontSize: 8,
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#f85149",
    padding: "6px 12px",
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  expandedRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingTop: 8,
    borderTop: "1px solid #21262d",
    flexWrap: "wrap",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 12,
    fontSize: 11,
    color: "#c9d1d9",
  },
  badgeClose: {
    background: "transparent",
    border: "none",
    color: "#f85149",
    fontSize: 14,
    cursor: "pointer",
    padding: "0 1px",
    lineHeight: 1,
  },
};

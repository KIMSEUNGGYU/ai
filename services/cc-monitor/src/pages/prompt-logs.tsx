import { useCallback, useEffect, useState, useRef } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getPromptLogs, getPromptLogUsers, getPromptLogProjects } from "@/lib/queries";
import { PromptLogTable } from "@/components/PromptLogTable";
import { PromptLogDetailPanel } from "@/components/PromptLogDetail";
import { PromptLogFilters, type PromptLogFilterValues } from "@/components/PromptLogFilters";
import { Pagination } from "@/components/Pagination";
import type { PromptLog, PromptLogDetail, PromptLogListResponse } from "@/lib/types";

interface PageData {
  initialLogs: PromptLogListResponse;
  users: string[];
  projects: string[];
}

export const getServerSideProps: GetServerSideProps<PageData> = async () => {
  return {
    props: {
      initialLogs: getPromptLogs({ limit: 20 }),
      users: getPromptLogUsers(),
      projects: getPromptLogProjects(),
    },
  };
};

export default function PromptLogsPage({
  initialLogs,
  users,
  projects,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [logsData, setLogsData] = useState<PromptLogListResponse>(initialLogs);
  const [selectedLog, setSelectedLog] = useState<PromptLog | null>(null);
  const [logDetail, setLogDetail] = useState<PromptLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filtersRef = useRef<PromptLogFilterValues>({
    userId: "",
    search: "",
    projectPath: "",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch logs with filters
  const fetchLogs = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      const f = filtersRef.current;
      if (f.userId) params.set("userId", f.userId);
      if (f.search) params.set("search", f.search);
      if (f.projectPath) params.set("projectPath", f.projectPath);
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);

      const res = await fetch(`/api/prompt-logs?${params}`);
      const data = await res.json() as PromptLogListResponse;
      setLogsData(data);
      setCurrentPage(data.page);
    } catch (error) {
      console.error("Failed to fetch prompt logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detail when selecting a log
  const fetchDetail = useCallback(async (log: PromptLog) => {
    setSelectedLog(log);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/prompt-logs?id=${log.id}`);
      const data = await res.json();
      setLogDetail(data.log ?? data.detail ?? null);
    } catch (error) {
      console.error("Failed to fetch prompt log detail:", error);
      setLogDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: PromptLogFilterValues) => {
    filtersRef.current = filters;
    setCurrentPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    fetchLogs(page);
    // Scroll to top of table
    window.scrollTo({ top: 200, behavior: "smooth" });
  }, [fetchLogs]);

  // Handle close detail
  const handleCloseDetail = useCallback(() => {
    setSelectedLog(null);
    setLogDetail(null);
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link href="/" style={styles.backLink}>
            &larr; 대시보드
          </Link>
          <h1 style={styles.headerTitle}>프롬프트 로그</h1>
          <span style={styles.headerSub}>
            총 {logsData.total}건의 프롬프트
          </span>
        </div>
      </header>

      {/* Filters */}
      <PromptLogFilters
        users={users}
        projects={projects}
        onFilterChange={handleFilterChange}
      />

      {/* Main content: table + detail */}
      <div style={styles.content}>
        <div style={selectedLog ? styles.tableAreaWithDetail : styles.tableArea}>
          {/* Loading overlay */}
          {loading && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>로딩 중...</span>
            </div>
          )}

          {/* Table */}
          <PromptLogTable
            logs={logsData.logs}
            onSelect={fetchDetail}
            selectedId={selectedLog?.id ?? null}
          />

          {/* Pagination */}
          <Pagination
            page={logsData.page}
            totalPages={logsData.totalPages}
            total={logsData.total}
            limit={logsData.limit}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Detail panel */}
        {selectedLog && (
          <div style={styles.detailArea}>
            <PromptLogDetailPanel
              detail={logDetail}
              loading={detailLoading}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "24px 32px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1px solid #21262d",
    paddingBottom: 16,
  },
  headerLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
  },
  backLink: {
    fontSize: 13,
    color: "#58a6ff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f0f6fc",
  },
  headerSub: {
    fontSize: 13,
    color: "#484f58",
  },
  content: {
    display: "flex",
    gap: 24,
    marginTop: 16,
    alignItems: "flex-start",
  },
  tableArea: {
    flex: 1,
    position: "relative",
  },
  tableAreaWithDetail: {
    flex: 1,
    position: "relative",
    maxWidth: "calc(100% - 420px)",
  },
  detailArea: {
    width: 400,
    flexShrink: 0,
    position: "sticky",
    top: 24,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(13, 17, 23, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: 8,
  },
  loadingText: {
    color: "#8b949e",
    fontSize: 14,
    background: "#161b22",
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #30363d",
  },
};

import { useCallback, useEffect, useState, useRef } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getPromptLogs, getPromptLogUsers, getPromptLogProjects } from "@/lib/queries";
import { PromptLogTable } from "@/components/PromptLogTable";
import { PromptLogDetailPanel } from "@/components/PromptLogDetail";
import { PromptLogFilters, type PromptLogFilterValues } from "@/components/PromptLogFilters";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PromptLog, PromptLogDetail, PromptLogListResponse } from "@/lib/types";

interface PageData {
  initialLogs: PromptLogListResponse;
  users: string[];
  projects: string[];
}

export const getServerSideProps: GetServerSideProps<PageData> = async () => {
  const [initialLogs, users, projects] = await Promise.all([
    getPromptLogs({ limit: 20 }),
    getPromptLogUsers(),
    getPromptLogProjects(),
  ]);

  return {
    props: { initialLogs, users, projects },
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
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      {/* Header */}
      <header className="mb-5 flex items-end justify-between border-b border-border pb-4">
        <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/">&larr; 대시보드</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">프롬프트 로그</h1>
          <span className="text-sm text-muted-foreground">
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
      <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-start">
        <div
          className={cn(
            "relative flex-1",
            selectedLog && "xl:max-w-[calc(100%-420px)]"
          )}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
              <span className="rounded-md border border-input bg-card px-4 py-2 text-sm text-muted-foreground">
                로딩 중...
              </span>
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
          <div className="w-full shrink-0 xl:sticky xl:top-6 xl:w-[400px]">
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

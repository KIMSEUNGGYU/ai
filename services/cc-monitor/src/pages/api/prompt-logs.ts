// ── GET & POST /api/prompt-logs — 프롬프트 로그 조회 및 저장 API ──
//
// GET  사용법:
//   GET /api/prompt-logs                              → 전체 목록 (기본 20건, 1페이지)
//   GET /api/prompt-logs?userId=alice                  → 사용자 필터
//   GET /api/prompt-logs?sessionId=abc-123             → 세션 필터
//   GET /api/prompt-logs?dateFrom=2025-01-01&dateTo=2025-12-31  → 날짜 범위 필터
//   GET /api/prompt-logs?search=refactor               → 프롬프트 텍스트 검색
//   GET /api/prompt-logs?projectPath=/my/project       → 프로젝트 경로 필터
//   GET /api/prompt-logs?page=2&limit=10               → 페이지네이션
//   GET /api/prompt-logs?id=42                         → 단일 프롬프트 상세 조회
//   GET /api/prompt-logs?meta=true                     → 필터 옵션 메타 데이터 (사용자 + 프로젝트 목록)
//
// POST 사용법:
//   POST /api/prompt-logs  { session_id, prompt_text, ... }       → 단건 프롬프트 로그 저장
//   POST /api/prompt-logs  { logs: [{ session_id, prompt_text, ... }, ...] } → 배치 저장
//
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getPromptLogs,
  getPromptLogDetail,
  getPromptLogUsers,
  getPromptLogProjects,
  insertPromptLog,
  insertPromptLogBatch,
} from "@/lib/queries";
import type {
  PromptLogFilters,
  PromptLogListResponse,
  PromptLogDetail,
  PromptLogInput,
  PromptLogInsertResult,
} from "@/lib/types";

/** 단건 상세 응답 */
interface DetailResponse {
  log: PromptLogDetail;
}

/** 필터 메타 데이터 응답 */
interface MetaResponse {
  users: string[];
  projects: string[];
}

/** POST 단건 저장 성공 응답 */
interface InsertResponse {
  ok: true;
  result: PromptLogInsertResult;
}

/** POST 배치 저장 성공 응답 */
interface BatchInsertResponse {
  ok: true;
  results: PromptLogInsertResult[];
  count: number;
}

/** 에러 응답 */
interface ErrorResponse {
  error: string;
}

type ApiResponse =
  | PromptLogListResponse
  | DetailResponse
  | MetaResponse
  | InsertResponse
  | BatchInsertResponse
  | ErrorResponse;

// ── 헬퍼 ──

function parseString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

function parsePositiveInt(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  if (isNaN(n) || !Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

/**
 * PromptLogInput 필수 필드 검증
 */
function validatePromptLogInput(
  body: unknown,
): { valid: true; input: PromptLogInput } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.session_id !== "string" || obj.session_id.trim().length === 0) {
    return { valid: false, error: "session_id is required and must be a non-empty string" };
  }

  if (typeof obj.prompt_text !== "string" || obj.prompt_text.trim().length === 0) {
    return { valid: false, error: "prompt_text is required and must be a non-empty string" };
  }

  // timestamp 유효성 검증 (선택 필드)
  if (obj.timestamp !== undefined) {
    if (typeof obj.timestamp !== "string" || isNaN(Date.parse(obj.timestamp))) {
      return { valid: false, error: "timestamp must be a valid ISO 8601 date string" };
    }
  }

  const input: PromptLogInput = {
    session_id: obj.session_id.trim(),
    prompt_text: obj.prompt_text as string,
  };

  // 선택 필드
  if (typeof obj.user_id === "string" && obj.user_id.trim().length > 0) {
    input.user_id = obj.user_id.trim();
  }
  if (typeof obj.project_path === "string") {
    input.project_path = obj.project_path;
  }
  if (typeof obj.model === "string" && obj.model.trim().length > 0) {
    input.model = obj.model.trim();
  }
  if (typeof obj.permission_mode === "string" && obj.permission_mode.trim().length > 0) {
    input.permission_mode = obj.permission_mode.trim();
  }
  if (typeof obj.timestamp === "string") {
    input.timestamp = obj.timestamp;
  }
  if (obj.raw_data && typeof obj.raw_data === "object" && !Array.isArray(obj.raw_data)) {
    input.raw_data = obj.raw_data as Record<string, unknown>;
  }

  return { valid: true, input };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  // ── POST: 프롬프트 로그 저장 ──
  if (req.method === "POST") {
    return handlePost(req, res);
  }

  // ── GET: 프롬프트 로그 조회 ──
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}

// ── POST 핸들러 ──

function handlePost(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const body = req.body;

    // x-cc-user 헤더에서 사용자 ID 추출 (기존 이벤트 API와 동일 패턴)
    const headerUserId = req.headers["x-cc-user"] as string | undefined;

    // ── 배치 저장: { logs: [...] } ──
    if (body && typeof body === "object" && Array.isArray(body.logs)) {
      const logs = body.logs as unknown[];

      if (logs.length === 0) {
        return res.status(400).json({ error: "logs array must not be empty" });
      }

      if (logs.length > 100) {
        return res.status(400).json({ error: "Batch size exceeded: maximum 100 logs per request" });
      }

      const validatedInputs: PromptLogInput[] = [];

      for (let i = 0; i < logs.length; i++) {
        const result = validatePromptLogInput(logs[i]);
        if (!result.valid) {
          return res.status(400).json({ error: `logs[${i}]: ${result.error}` });
        }
        // 헤더 user_id 가 있고 바디에 없으면 헤더 값 사용
        if (headerUserId && !result.input.user_id) {
          result.input.user_id = headerUserId;
        }
        validatedInputs.push(result.input);
      }

      const results = insertPromptLogBatch(validatedInputs);
      return res.status(201).json({ ok: true, results, count: results.length });
    }

    // ── 단건 저장: { session_id, prompt_text, ... } ──
    const validation = validatePromptLogInput(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // 헤더 user_id 가 있고 바디에 없으면 헤더 값 사용
    if (headerUserId && !validation.input.user_id) {
      validation.input.user_id = headerUserId;
    }

    const result = insertPromptLog(validation.input);
    return res.status(201).json({ ok: true, result });
  } catch (error) {
    console.error("[prompt-logs] POST error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET 핸들러 ──

function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // ── 1) 필터 메타 데이터 조회 (사용자 목록 + 프로젝트 목록) ──
    // GET /api/prompt-logs?meta=true
    if (req.query.meta === "true" || req.query.options === "true") {
      const users = getPromptLogUsers();
      const projects = getPromptLogProjects();
      return res.status(200).json({ users, projects });
    }

    // ── 2) 단일 프롬프트 상세 조회 ──
    // GET /api/prompt-logs?id=42
    if (req.query.id) {
      const id = parsePositiveInt(req.query.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid id: must be a positive integer" });
      }
      const log = getPromptLogDetail(id);
      if (!log) {
        return res.status(404).json({ error: "Prompt log not found" });
      }
      return res.status(200).json({ log });
    }

    // ── 3) 프롬프트 로그 목록 조회 (필터링 + 페이지네이션 + 검색) ──
    const filters: PromptLogFilters = {};

    // 사용자 필터
    filters.userId = parseString(req.query.userId);

    // 세션 필터
    filters.sessionId = parseString(req.query.sessionId);

    // 프로젝트 경로 필터 (부분 일치)
    filters.projectPath = parseString(req.query.projectPath);

    // 텍스트 검색 (프롬프트 내용 부분 일치)
    filters.search = parseString(req.query.search);

    // 날짜 범위 필터 (ISO 8601 형식)
    filters.dateFrom = parseString(req.query.dateFrom);
    filters.dateTo = parseString(req.query.dateTo);

    // 날짜 유효성 검증
    if (filters.dateFrom && isNaN(Date.parse(filters.dateFrom))) {
      return res.status(400).json({ error: "Invalid dateFrom: must be a valid ISO 8601 date string" });
    }
    if (filters.dateTo && isNaN(Date.parse(filters.dateTo))) {
      return res.status(400).json({ error: "Invalid dateTo: must be a valid ISO 8601 date string" });
    }

    // 페이지네이션
    filters.page = parsePositiveInt(req.query.page);
    filters.limit = parsePositiveInt(req.query.limit);

    const result = getPromptLogs(filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[prompt-logs] GET error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET & POST /api/prompt-logs — 프롬프트 로그 조회 및 저장 API ──
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

  if (obj.timestamp !== undefined) {
    if (typeof obj.timestamp !== "string" || isNaN(Date.parse(obj.timestamp))) {
      return { valid: false, error: "timestamp must be a valid ISO 8601 date string" };
    }
  }

  const input: PromptLogInput = {
    session_id: obj.session_id.trim(),
    prompt_text: obj.prompt_text as string,
  };

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method === "POST") {
    return handlePost(req, res);
  }

  if (req.method === "GET") {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}

// ── POST 핸들러 ──

async function handlePost(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const body = req.body;
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
        if (headerUserId && !result.input.user_id) {
          result.input.user_id = headerUserId;
        }
        validatedInputs.push(result.input);
      }

      const results = await insertPromptLogBatch(validatedInputs);
      return res.status(201).json({ ok: true, results, count: results.length });
    }

    // ── 단건 저장 ──
    const validation = validatePromptLogInput(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (headerUserId && !validation.input.user_id) {
      validation.input.user_id = headerUserId;
    }

    const result = await insertPromptLog(validation.input);
    return res.status(201).json({ ok: true, result });
  } catch (error) {
    console.error("[prompt-logs] POST error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET 핸들러 ──

async function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // ── 1) 필터 메타 데이터 조회 ──
    if (req.query.meta === "true" || req.query.options === "true") {
      const [users, projects] = await Promise.all([
        getPromptLogUsers(),
        getPromptLogProjects(),
      ]);
      return res.status(200).json({ users, projects });
    }

    // ── 2) 단일 프롬프트 상세 조회 ──
    if (req.query.id) {
      const id = parsePositiveInt(req.query.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid id: must be a positive integer" });
      }
      const log = await getPromptLogDetail(id);
      if (!log) {
        return res.status(404).json({ error: "Prompt log not found" });
      }
      return res.status(200).json({ log });
    }

    // ── 3) 프롬프트 로그 목록 조회 ──
    const filters: PromptLogFilters = {};

    filters.userId = parseString(req.query.userId);
    filters.sessionId = parseString(req.query.sessionId);
    filters.projectPath = parseString(req.query.projectPath);
    filters.search = parseString(req.query.search);
    filters.dateFrom = parseString(req.query.dateFrom);
    filters.dateTo = parseString(req.query.dateTo);

    if (filters.dateFrom && isNaN(Date.parse(filters.dateFrom))) {
      return res.status(400).json({ error: "Invalid dateFrom: must be a valid ISO 8601 date string" });
    }
    if (filters.dateTo && isNaN(Date.parse(filters.dateTo))) {
      return res.status(400).json({ error: "Invalid dateTo: must be a valid ISO 8601 date string" });
    }

    filters.page = parsePositiveInt(req.query.page);
    filters.limit = parsePositiveInt(req.query.limit);

    const result = await getPromptLogs(filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[prompt-logs] GET error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

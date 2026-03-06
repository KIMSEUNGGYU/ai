import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

/** fe-workflow 플러그인 경로 (SDK query()에 전달) */
export const FE_WORKFLOW_PLUGIN = {
  type: "local" as const,
  path: resolve(homedir(), "dev/ai-ax/fe-workflow"),
};

/** 스펙 파일 로드 */
export function loadSpec(specPath: string): string {
  try {
    const resolved = specPath.startsWith("~")
      ? resolve(homedir(), specPath.slice(2))
      : resolve(specPath);
    return readFileSync(resolved, "utf-8");
  } catch {
    throw new Error(`스펙 파일을 읽을 수 없습니다: ${specPath}`);
  }
}

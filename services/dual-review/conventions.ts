import { resolve } from "path";
import { homedir } from "os";

/** fe-workflow 플러그인 경로 (Claude Agent SDK query()에 전달) */
export const FE_WORKFLOW_PLUGIN = {
  type: "local" as const,
  path: resolve(homedir(), "dev/ai-ax/fe-workflow"),
};

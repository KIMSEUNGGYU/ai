import fs from "node:fs";
import readline from "node:readline";
import os from "node:os";

function resolveHomePath(filePath: string): string {
  return filePath.startsWith("~") ? filePath.replace("~", os.homedir()) : filePath;
}

export interface TranscriptUsage {
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  num_turns: number;
}

export async function parseSessionName(
  transcriptPath: string
): Promise<string | null> {
  const resolved = resolveHomePath(transcriptPath);
  if (!fs.existsSync(resolved)) return null;

  let lastRename: string | null = null;
  const rl = readline.createInterface({
    input: fs.createReadStream(resolved, "utf-8"),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.includes("/rename")) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === "system" && obj.subtype === "local_command") {
        const content = obj.content as string;
        const match = content.match(/<command-name>\/rename<\/command-name>[\s\S]*?<command-args>(.*?)<\/command-args>/);
        if (match?.[1]) {
          lastRename = match[1];
        }
      }
    } catch {
      // skip
    }
  }

  return lastRename;
}

export async function parseTranscriptUsage(
  transcriptPath: string
): Promise<TranscriptUsage | null> {
  const resolved = resolveHomePath(transcriptPath);

  if (!fs.existsSync(resolved)) return null;

  const result: TranscriptUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_create_tokens: 0,
    cache_read_tokens: 0,
    num_turns: 0,
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(resolved, "utf-8"),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === "assistant" && obj.message?.usage) {
        const u = obj.message.usage;
        result.input_tokens += u.input_tokens ?? 0;
        result.output_tokens += u.output_tokens ?? 0;
        result.cache_create_tokens += u.cache_creation_input_tokens ?? 0;
        result.cache_read_tokens += u.cache_read_input_tokens ?? 0;
        result.num_turns += 1;
      }
    } catch {
      // skip malformed lines
    }
  }

  return result;
}

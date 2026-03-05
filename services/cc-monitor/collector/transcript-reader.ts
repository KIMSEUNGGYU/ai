import fs from "node:fs";
import readline from "node:readline";
import os from "node:os";

export interface TranscriptUsage {
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  num_turns: number;
}

export async function parseTranscriptUsage(
  transcriptPath: string
): Promise<TranscriptUsage | null> {
  const resolved = transcriptPath.startsWith("~")
    ? transcriptPath.replace("~", os.homedir())
    : transcriptPath;

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

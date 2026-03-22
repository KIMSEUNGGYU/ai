/**
 * extract-corrections.mjs
 *
 * transcript JSONL에서 user/assistant 대화를 추출.
 * 노이즈(system-reminder, hook, command 등) 제거 후 전체 대화 반환.
 *
 * Usage: node extract-corrections.mjs <transcript-path> [<transcript-path2> ...]
 * Output: JSON { messages: Array<{role, text}>, stats: { total, extracted } }
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const NOISE_PATTERNS = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g,
  /<command-name>[\s\S]*?<\/command-name>/g,
  /<command-message>[\s\S]*?<\/command-message>/g,
  /<command-args>[\s\S]*?<\/command-args>/g,
  /<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g,
  /<skill-suggestion>[\s\S]*?<\/skill-suggestion>/g,
];

const ASSISTANT_MAX_LEN = 800;

function cleanText(raw) {
  if (!raw) return null;
  let text = raw;
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }
  text = text.trim();
  return text.length < 2 ? null : text;
}

function extractContent(content, maxLen = 0) {
  if (!content) return null;

  let text;
  if (typeof content === 'string') {
    text = cleanText(content);
  } else if (Array.isArray(content)) {
    const texts = content
      .filter(item => item?.type === 'text')
      .map(item => cleanText(item.text))
      .filter(Boolean);
    text = texts.join('\n') || null;
  } else {
    return null;
  }

  if (!text) return null;
  if (maxLen > 0 && text.length > maxLen) {
    return text.slice(0, maxLen) + '...';
  }
  return text;
}

async function extractMessages(transcriptPath) {
  const messages = [];

  const rl = createInterface({
    input: createReadStream(transcriptPath, 'utf-8'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    if (obj.type === 'user') {
      const text = extractContent(obj.message?.content);
      if (text) messages.push({ role: 'user', text });
    } else if (obj.type === 'assistant') {
      const text = extractContent(obj.message?.content, ASSISTANT_MAX_LEN);
      if (text) messages.push({ role: 'assistant', text });
    }
  }

  return messages;
}

// --- main ---

const transcriptPaths = process.argv.slice(2);

if (transcriptPaths.length === 0) {
  console.error('Usage: node extract-corrections.mjs <transcript-path> [...]');
  process.exit(1);
}

let allMessages = [];

for (const path of transcriptPaths) {
  try {
    const messages = await extractMessages(path);
    allMessages.push(...messages);
  } catch (err) {
    console.error(`Warning: ${path} 읽기 실패 - ${err.message}`);
  }
}

const output = {
  messages: allMessages,
  stats: {
    total: allMessages.length,
    extracted: allMessages.length,
  },
};

console.log(JSON.stringify(output, null, 2));

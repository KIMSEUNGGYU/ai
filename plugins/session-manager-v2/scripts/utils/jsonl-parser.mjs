/**
 * JSONL 파서 유틸리티
 *
 * Claude Code JSONL transcript에서 앞 N개 + 뒤 N개 메시지를 추출해
 * 포맷된 컨텍스트 문자열을 반환한다.
 *
 * 필터 규칙:
 * - type === "user"  → message.content가 string (tool_result 아닌 것)
 * - type === "assistant" → content[].type === "text"인 항목
 * - progress / system / file-history-snapshot → skip
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/**
 * JSONL 파일에서 대화 메시지를 파싱한다.
 * @param {string} jsonlPath - JSONL 파일 경로
 * @returns {Promise<Array<{role: string, text: string}>>} 필터된 메시지 배열
 */
export async function parseMessages(jsonlPath) {
  const messages = [];

  const rl = createInterface({
    input: createReadStream(jsonlPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const { type, message } = entry;

    // skip 대상
    if (!['user', 'assistant'].includes(type)) continue;
    if (!message) continue;

    const content = message.content;

    if (type === 'user') {
      // string 컨텐츠만 (tool_result 배열은 제외)
      if (typeof content === 'string' && content.trim()) {
        messages.push({ role: 'user', text: content.trim() });
      }
    } else if (type === 'assistant') {
      // text 타입 content 항목만 추출
      if (Array.isArray(content)) {
        const texts = content
          .filter((c) => c.type === 'text' && c.text?.trim())
          .map((c) => c.text.trim())
          .join('\n');
        if (texts) {
          messages.push({ role: 'assistant', text: texts });
        }
      }
    }
  }

  return messages;
}

/**
 * 메시지 배열에서 앞 N개 + 뒤 N개를 추출해 포맷된 문자열로 반환한다.
 * @param {Array<{role: string, text: string}>} messages
 * @param {number} n - 앞/뒤 각각 가져올 메시지 수
 * @returns {string} 포맷된 컨텍스트 문자열
 */
export function formatContext(messages, n = 15) {
  if (messages.length === 0) return '';

  // 앞 N + 뒤 N (겹침 제거)
  const headEnd = Math.min(n, messages.length);
  const tailStart = Math.max(headEnd, messages.length - n);

  const head = messages.slice(0, headEnd);
  const tail = messages.slice(tailStart);
  const hasGap = tailStart > headEnd;

  const formatMessages = (msgs) =>
    msgs
      .map(({ role, text }) => {
        const label = role === 'user' ? 'user' : 'assistant';
        // 너무 긴 메시지는 앞 300자만
        const snippet = text.length > 300 ? text.slice(0, 300) + '…' : text;
        return `${label}: ${snippet}`;
      })
      .join('\n');

  let output = '';
  output += '[의도 파악 — 세션 시작부]\n';
  output += formatMessages(head);

  if (hasGap) {
    output += '\n\n… (중간 생략) …\n\n';
    output += '[현재 상태 — 세션 끝부]\n';
    output += formatMessages(tail);
  }

  return output;
}

/**
 * JSONL 파일을 읽어 앞+뒤 컨텍스트 문자열을 반환하는 통합 함수
 * @param {string} jsonlPath
 * @param {number} n
 * @returns {Promise<string>}
 */
export async function extractContext(jsonlPath, n = 15) {
  const messages = await parseMessages(jsonlPath);
  return formatContext(messages, n);
}

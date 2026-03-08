/**
 * extract-corrections.mjs
 *
 * transcript JSONL에서 사용자 메시지를 추출하여 교정 분석용 텍스트 생성.
 * 추출 전략: 초반 3개(맥락) + 중간(학습 신호만) + 마지막 7개(교정 집중 구간)
 * 학습 신호: 교정 키워드(부정/수정) + 긍정 키워드(기억/유지/선호)
 *
 * Usage: node extract-corrections.mjs <transcript-path> [<transcript-path2> ...]
 * Output: JSON { messages: string[], stats: { total, extracted, correctionHits, positiveHits } }
 */

import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const CORRECTION_KEYWORDS = [
  '아니', '그게 아니라', '이렇게 해', '왜 못', '필요없', '필요 없',
  '그렇게 말고', '다시 해', '수정해', '고쳐', '바꿔', '잘못',
  '틀렸', '아닌데', '그게 아닌', '하지 마', '하지마', '빼',
  '넣지 마', '안 했', '못 했', '왜 이렇게', '이상한', '엉뚱',
  '아까', '그거 말고', '다르게', '이게 아니라', '아니',
  '안 돼', '안돼', '그만', '됐어', '치워',
  '왜 자꾸', '아직', '덜', '너무', '과하',
];

const POSITIVE_KEYWORDS = [
  '기억해', '좋아', '이거 좋', '맞아', '이렇게 해줘',
  '앞으로', '항상', '계속', '유지해', '이대로',
  '잊지 마', '명심', '참고해',
];

const FIRST_N = 3;
const LAST_N = 7;

async function extractUserMessages(transcriptPath) {
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

    if (obj.type !== 'user') continue;

    const text = extractText(obj.message?.content);
    if (!text) continue;

    messages.push(text);
  }

  return messages;
}

function extractText(content) {
  if (!content) return null;

  if (typeof content === 'string') {
    return cleanText(content);
  }

  if (Array.isArray(content)) {
    const texts = content
      .filter(item => item?.type === 'text')
      .map(item => cleanText(item.text))
      .filter(Boolean);
    return texts.join('\n') || null;
  }

  return null;
}

function cleanText(raw) {
  if (!raw) return null;

  // system-reminder, hook output 등 제거
  let text = raw
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '')
    .replace(/<command-name>[\s\S]*?<\/command-name>/g, '')
    .replace(/<command-message>[\s\S]*?<\/command-message>/g, '')
    .replace(/<command-args>[\s\S]*?<\/command-args>/g, '')
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, '')
    .replace(/<skill-suggestion>[\s\S]*?<\/skill-suggestion>/g, '')
    .trim();

  // 빈 문자열 또는 너무 짧은 것 필터
  if (text.length < 2) return null;

  return text;
}

function hasCorrection(text) {
  const lower = text.toLowerCase();
  return CORRECTION_KEYWORDS.some(kw => lower.includes(kw));
}

function hasPositive(text) {
  const lower = text.toLowerCase();
  return POSITIVE_KEYWORDS.some(kw => lower.includes(kw));
}

function hasLearningSignal(text) {
  return hasCorrection(text) || hasPositive(text);
}

function selectMessages(allMessages) {
  if (allMessages.length <= FIRST_N + LAST_N) {
    return {
      selected: allMessages,
      correctionHits: allMessages.filter(hasCorrection).length,
      positiveHits: allMessages.filter(hasPositive).length,
    };
  }

  const first = allMessages.slice(0, FIRST_N);
  const last = allMessages.slice(-LAST_N);
  const middle = allMessages.slice(FIRST_N, -LAST_N);

  // 중간에서 학습 신호 포함 메시지만
  const middleSignals = middle.filter(hasLearningSignal);

  const selected = [...first, ...middleSignals, ...last];
  const correctionHits = selected.filter(hasCorrection).length;
  const positiveHits = selected.filter(hasPositive).length;

  return { selected, correctionHits, positiveHits };
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
    const messages = await extractUserMessages(path);
    allMessages.push(...messages);
  } catch (err) {
    console.error(`Warning: ${path} 읽기 실패 - ${err.message}`);
  }
}

const { selected, correctionHits, positiveHits } = selectMessages(allMessages);

const output = {
  messages: selected,
  stats: {
    total: allMessages.length,
    extracted: selected.length,
    correctionHits,
    positiveHits,
  },
};

console.log(JSON.stringify(output, null, 2));

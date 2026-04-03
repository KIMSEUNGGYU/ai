#!/usr/bin/env node

/**
 * transcript JSONL에서 user/assistant 메시지를 추출한다.
 * recap의 extract-transcripts.mjs 기반 — 파일 경로 입력 방식으로 변경.
 *
 * Usage: node extract-corrections.mjs <transcript-path> [<transcript-path2> ...]
 * Output: 세션별 USER/AI 대화 텍스트 (stdout)
 */

import { readFileSync } from 'fs';
import { basename } from 'path';

const NOISE_PREFIXES = [
  '<command-',
  '<system-reminder>',
  'SessionStart',
  '<local-command',
];
const SKIP_TEXTS = ['', '[Request interrupted by user]'];

// 스킬 프롬프트 감지: <command-message>에서 스킬명과 args를 추출
function parseCommandMessage(content) {
  if (typeof content !== 'string') return null;
  const nameMatch = content.match(/<command-name>\/?(.*?)<\/command-name>/);
  const argsMatch = content.match(/<command-args>([\s\S]*?)<\/command-args>/);
  if (!nameMatch) return null;
  return {
    skillName: nameMatch[1],
    args: argsMatch ? argsMatch[1].trim() : '',
  };
}

// tool_result에서 "Launching skill: xxx" 감지
function parseLaunchingSkill(content) {
  if (!Array.isArray(content)) return null;
  for (const c of content) {
    if (c.type === 'tool_result') {
      const text =
        typeof c.content === 'string'
          ? c.content
          : Array.isArray(c.content)
            ? c.content.map((x) => x.text || '').join('')
            : '';
      const match = text.match(/Launching skill:\s*(.+)/);
      if (match) return match[1].trim();
    }
  }
  return null;
}

// 스킬 프롬프트 본문 감지 (Base directory for this skill:)
function isSkillBody(text) {
  return text.startsWith('Base directory for this skill:');
}

function extractFromFile(filePath) {
  const sessionId = basename(filePath).replace('.jsonl', '').slice(0, 8);

  let lines;
  try {
    lines = readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  } catch (err) {
    console.error(`Warning: ${filePath} 읽기 실패 - ${err.message}`);
    return [];
  }

  const messages = [];
  let skipNextUserText = false;

  for (const line of lines) {
    let d;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }

    if (d.type === 'user') {
      const content = d.message?.content;

      // string content 처리
      if (typeof content === 'string') {
        const cmd = parseCommandMessage(content);
        if (cmd) {
          skipNextUserText = true;
          const argsText = cmd.args ? ` ${cmd.args}` : '';
          messages.push({ role: 'user', text: `[/${cmd.skillName}]${argsText}` });
          continue;
        }
        // 노이즈 필터
        if (NOISE_PREFIXES.some((p) => content.startsWith(p))) continue;
        if (SKIP_TEXTS.includes(content.trim())) continue;
        // 일반 텍스트 user 메시지
        messages.push({ role: 'user', text: content });
        continue;
      }

      if (!Array.isArray(content)) continue;

      // tool_result에서 "Launching skill" 감지
      const launchedSkill = parseLaunchingSkill(content);
      if (launchedSkill) {
        skipNextUserText = true;
        continue;
      }

      for (const c of content) {
        if (c?.type !== 'text') continue;
        const text = c.text;
        if (NOISE_PREFIXES.some((p) => text.startsWith(p))) continue;
        if (SKIP_TEXTS.includes(text.trim())) continue;

        // 스킬 본문 스킵
        if (skipNextUserText) {
          skipNextUserText = false;
          if (isSkillBody(text) || text.length > 1000) {
            const argsMatch = text.match(/\nARGUMENTS:\s*(.+)/);
            if (argsMatch) {
              messages.push({ role: 'user', text: `  args: ${argsMatch[1].trim()}` });
            }
            continue;
          }
        }

        // "Base directory for this skill:" 단독 감지
        if (isSkillBody(text)) {
          const nameMatch = text.match(/^Base directory for this skill:.*?skills\/([^/\n]+)/);
          const skillName = nameMatch ? nameMatch[1] : 'unknown';
          const argsMatch = text.match(/\nARGUMENTS:\s*(.+)/);
          const argsText = argsMatch ? ` ${argsMatch[1].trim()}` : '';
          messages.push({ role: 'user', text: `[/${skillName}]${argsText}` });
          continue;
        }

        messages.push({ role: 'user', text });
      }
    } else if (d.type === 'assistant') {
      skipNextUserText = false;
      const content = d.message?.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (c?.type !== 'text') continue;
        messages.push({ role: 'assistant', text: c.text });
      }
    }
  }

  return { sessionId, messages };
}

// --- main ---

const transcriptPaths = process.argv.slice(2);

if (transcriptPaths.length === 0) {
  console.error('Usage: node extract-corrections.mjs <transcript-path> [...]');
  process.exit(1);
}

for (const path of transcriptPaths) {
  const result = extractFromFile(path);
  if (!result.messages || result.messages.length === 0) continue;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SESSION: ${result.sessionId}`);
  console.log('='.repeat(60));

  for (const m of result.messages) {
    const roleIcon = m.role === 'user' ? 'USER' : 'AI';
    const indented = m.text.replaceAll('\n', '\n  ');
    console.log(`\n${roleIcon}:`);
    console.log(`  ${indented}`);
  }
}

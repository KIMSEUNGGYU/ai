# 하네스 설정

## 컨벤션 문서
- conventions/code-principles.md
- conventions/folder-structure.md
- conventions/api-layer.md
- conventions/coding-style.md

## Static Gate 명령
- tsc --noEmit
- biome check
- ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/harness-check.sh

## 평가 설정
- 품질 점수 임계값: 8.0
- Contract 가중치: 0.6
- 열린 평가 가중치: 0.3
- Contrarian 가중치: 0.1

## 안전장치
- Static Gate 최대 재시도: 3
- Eval Loop 최대 재시도: 3

const TOOL_DESCRIPTIONS: Record<string, string> = {
  ToolSearch: "사용 가능한 deferred 도구를 검색/로드하는 메타 도구",
  AskUserQuestion: "사용자에게 선택지를 제시하고 답변을 받는 도구",
  Skill: "등록된 스킬(slash command)을 실행",
  Agent: "독립 서브에이전트를 생성하여 병렬 작업 수행",
  Bash: "쉘 명령어 실행 (timeout 2분, background 가능)",
  Read: "파일 읽기 (이미지, PDF, 노트북 지원)",
  Edit: "파일 부분 수정 (문자열 치환 방식)",
  Write: "파일 생성 또는 전체 덮어쓰기",
  NotebookEdit: "Jupyter 노트북 셀 편집",
  Grep: "파일 내용 검색 (정규식 지원)",
  Glob: "파일명 패턴 매칭 검색",
  EnterPlanMode: "Plan Mode 진입 (읽기 전용 탐색)",
  ExitPlanMode: "Plan Mode 종료",
  TaskCreate: "백그라운드 태스크 생성",
  TaskUpdate: "태스크 상태 업데이트",
  WebFetch: "URL에서 콘텐츠 가져오기",
  WebSearch: "웹 검색 수행",
};

export function getToolDescription(toolName: string): string {
  if (TOOL_DESCRIPTIONS[toolName]) {
    return TOOL_DESCRIPTIONS[toolName];
  }

  if (toolName.startsWith("mcp__")) {
    const rest = toolName.slice(5); // "mcp__" 제거
    const sepIndex = rest.indexOf("__");
    if (sepIndex !== -1) {
      const provider = rest.slice(0, sepIndex);
      const tool = rest.slice(sepIndex + 2);
      return `MCP: ${provider} / ${tool}`;
    }
    return `MCP: ${rest}`;
  }

  return toolName;
}

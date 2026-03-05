import type { AgentFn } from "@agents/eval";
import { runSpecAgent } from "../../agents/spec-agent.js";

interface SpecInput {
  planningDoc: string;
  ticketId?: string;
}

export const specAgentFn: AgentFn<SpecInput> = async (input) => {
  const result = await runSpecAgent(input);
  return {
    output: result.output,
    costUsd: result.cost,
  };
};

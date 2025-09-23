import { runAgentCase } from "./_agentTestKit";
import { ScoutEval } from "../../../lib/ai/scoutEval";

// Factory function to create ScoutEval instance
function createScoutEvalAgent() {
  return ScoutEval.getInstance();
}

describe("ScoutEval", () => {
  test("happy", async () => await runAgentCase(createScoutEvalAgent, "happy"));
  test("no-auth", async () => await runAgentCase(createScoutEvalAgent, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createScoutEvalAgent, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createScoutEvalAgent, "provider-fail"));
});

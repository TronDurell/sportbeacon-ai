import { runAgentCase } from "./_agentTestKit";
import { CoachAgent } from "../../../lib/ai/coachAgent";

// Factory function to create CoachAgent instance
function createCoachAgent() {
  return CoachAgent.getInstance();
}

describe("CoachAgent", () => {
  test("happy", async () => await runAgentCase(createCoachAgent, "happy"));
  test("no-auth", async () => await runAgentCase(createCoachAgent, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createCoachAgent, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createCoachAgent, "provider-fail"));
});

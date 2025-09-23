import { runAgentCase } from "./_agentTestKit";
import CivicAgent from "../../../frontend/src/lib/ai/CivicAgent";

// Factory function to create TownRec agent (using CivicAgent)
function createTownRecAgent() {
  return new CivicAgent("Test Town", [], "admin");
}

describe("TownRecAgent", () => {
  test("happy", async () => await runAgentCase(createTownRecAgent, "happy"));
  test("no-auth", async () => await runAgentCase(createTownRecAgent, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createTownRecAgent, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createTownRecAgent, "provider-fail"));
});

import { runAgentCase } from "./_agentTestKit";
import { CivicIndexer } from "../../../lib/ai/civicIndexer";

// Factory function to create CivicIndexer instance
function createCivicIndexer() {
  return CivicIndexer.getInstance();
}

describe("CivicIndexer", () => {
  test("happy", async () => await runAgentCase(createCivicIndexer, "happy"));
  test("no-auth", async () => await runAgentCase(createCivicIndexer, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createCivicIndexer, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createCivicIndexer, "provider-fail"));
});

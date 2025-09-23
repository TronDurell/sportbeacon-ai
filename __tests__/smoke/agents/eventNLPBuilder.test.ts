import { runAgentCase } from "./_agentTestKit";
import { EventNLPBuilder } from "../../../lib/ai/eventNLPBuilder";

// Factory function to create EventNLPBuilder instance
function createEventNLPBuilder() {
  return EventNLPBuilder.getInstance();
}

describe("EventNLPBuilder", () => {
  test("happy", async () => await runAgentCase(createEventNLPBuilder, "happy"));
  test("no-auth", async () => await runAgentCase(createEventNLPBuilder, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createEventNLPBuilder, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createEventNLPBuilder, "provider-fail"));
});

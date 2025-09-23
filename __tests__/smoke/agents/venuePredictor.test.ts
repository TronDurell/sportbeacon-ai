import { runAgentCase } from "./_agentTestKit";
import { VenuePredictor } from "../../../lib/ai/venuePredictor";

// Factory function to create VenuePredictor instance
function createVenuePredictor() {
  return VenuePredictor.getInstance();
}

describe("VenuePredictor", () => {
  test("happy", async () => await runAgentCase(createVenuePredictor, "happy"));
  test("no-auth", async () => await runAgentCase(createVenuePredictor, "no-auth"));
  test("schema-fail", async () => await runAgentCase(createVenuePredictor, "schema-fail"));
  test("provider-fail", async () => await runAgentCase(createVenuePredictor, "provider-fail"));
});

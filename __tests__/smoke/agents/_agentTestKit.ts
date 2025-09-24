type Case = "happy" | "no-auth" | "schema-fail" | "provider-fail";

export async function runAgentCase(agentFactory: any, caseType: Case) {
  const agent = agentFactory(); // assumes default config/DI inside
  
  // Initialize the agent first (if it has an initialize method)
  if (agent.initialize) {
    await agent.initialize();
  }
  
  if (caseType === "no-auth") {
    process.env.TEST_DISABLE_AUTH = "1";
  }
  
  if (caseType === "schema-fail") {
    // Test with invalid parameters for each agent type
    if (agent.getUserRecommendations) {
      return expect(agent.getUserRecommendations("")).rejects.toThrow();
    } else if (agent.analyzeVideo) {
      return expect(agent.analyzeVideo("")).rejects.toThrow();
    } else if (agent.getVenuePrediction) {
      return expect(agent.getVenuePrediction("")).rejects.toThrow();
    } else if (agent.parseCommand) {
      return expect(agent.parseCommand({})).rejects.toThrow();
    } else if (agent.calculateCivicHealthIndex) {
      return expect(agent.calculateCivicHealthIndex("")).rejects.toThrow();
    } else if (agent.processQuery) {
      return expect(agent.processQuery({})).rejects.toThrow();
    } else if (agent.handleQuery) {
      return expect(agent.handleQuery({ type: "invalid" } as any)).rejects.toThrow();
    }
  }
  
  if (caseType === "provider-fail") {
    // Simulate external provider error via environment or mock
    process.env.MOCK_PROVIDER_FAIL = "1";
    if (agent.getUserRecommendations) {
      return expect(agent.getUserRecommendations("test-user")).rejects.toThrow();
    } else if (agent.analyzeVideo) {
      return expect(agent.analyzeVideo("test-video")).rejects.toThrow();
    } else if (agent.getVenuePrediction) {
      return expect(agent.getVenuePrediction("test-venue")).rejects.toThrow();
    } else if (agent.parseCommand) {
      return expect(agent.parseCommand({ text: "test" })).rejects.toThrow();
    } else if (agent.calculateCivicHealthIndex) {
      return expect(agent.calculateCivicHealthIndex("test-town")).rejects.toThrow();
    } else if (agent.processQuery) {
      return expect(agent.processQuery({ query: "test" })).rejects.toThrow();
    } else if (agent.handleQuery) {
      return expect(agent.handleQuery({ 
        type: "general", 
        question: "test query", 
        context: {} 
      } as any)).rejects.toThrow();
    }
  }
  
  // happy path - test the main method for each agent
  let out;
  if (agent.getUserRecommendations) {
    out = await agent.getUserRecommendations("test-user");
  } else if (agent.analyzeVideo) {
    out = await agent.analyzeVideo("https://example.com/video.mp4");
  } else if (agent.getVenuePrediction) {
    out = await agent.getVenuePrediction("test-venue");
  } else if (agent.parseCommand) {
    out = await agent.parseCommand({ text: "test command", userId: "test-user", timestamp: new Date() });
  } else if (agent.calculateCivicHealthIndex) {
    out = await agent.calculateCivicHealthIndex("test-town");
  } else if (agent.processQuery) {
    out = await agent.processQuery({ query: "test query" });
  } else if (agent.handleQuery) {
    out = await agent.handleQuery({ 
      type: "general", 
      question: "test query", 
      context: {} 
    });
  }
  
  expect(out).toBeTruthy();
  expect(typeof out).toBe("object");
}

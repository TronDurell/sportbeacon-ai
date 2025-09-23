import { rest } from "msw";

export const handlers = [
  // Example AI provider mock
  rest.post("https://api.openai.com/v1/chat/completions", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ id: "mock", choices: [{ message: { content: "ok" } }] }))
  ),
  // Add other 3rd-party mocks as needed
];

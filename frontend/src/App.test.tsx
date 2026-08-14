import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SportBeaconAI shell", () => {
  it("renders the header, navigation, and feature cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "ok",
          service: "sportbeacon-ai",
          version: "0.1.0",
        }),
      ),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "SportBeaconAI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Player Insights" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Drill Planning" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Matchmaking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Prototype")).toBeInTheDocument();
    expect(screen.getByTestId("health-status")).toHaveTextContent(
      "Checking backend",
    );

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("Connected");
    });
  });

  it("shows a connected state after a successful health response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "ok",
        service: "sportbeacon-ai",
        version: "0.1.0",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("Connected");
    });
    expect(screen.getByTestId("health-status")).toHaveTextContent(
      "sportbeacon-ai 0.1.0",
    );
    expect(fetchMock).toHaveBeenCalled();
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toMatch(/\/api\/health$/);
  });

  it("shows an error state with retry when the health request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          service: "sportbeacon-ai",
          version: "0.1.0",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent(
        "Backend unreachable",
      );
    });
    expect(screen.getByTestId("health-status")).toHaveTextContent("network down");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("Connected");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

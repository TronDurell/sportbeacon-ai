/**
 * Flow: registration review → waitlist → sibling pairing → age exception approval
 * → referee scheduling → roster update
 */
import supertest from "supertest";
import { seedDemoData } from "./bootstrap";

const BASE = process.env.FUNCTIONS_EMULATOR || "http://127.0.0.1:5001/sportbeacon-ai/us-central1";
const api = supertest(BASE);

describe("Town Rec E2E", () => {
  beforeAll(async () => {
    // Initialize Firebase emulator data
    const { initializeApp } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    
    const app = initializeApp({ projectId: "sportbeacon-ai" });
    const db = getFirestore(app);
    
    await seedDemoData(db);
  });

  it("completes the core flow", async () => {
    // admin approves registration
    await api.post("/updateRegistrationStatus")
      .send({ id: "reg1", status: "approved" })
      .expect(200);

    // waitlist automation
    await api.post("/runWaitlist")
      .send({ leagueId: "demo-league" })
      .expect(200);

    // sibling pairing
    await api.post("/pairSiblings")
      .send({ leagueId: "demo-league", group: "A" })
      .expect(200);

    // age exception
    await api.post("/requestAgeException")
      .send({ playerId: "p1", reason: "plays up" })
      .expect(200);
    
    await api.post("/approveAgeException")
      .send({ playerId: "p1" })
      .expect(200);

    // referee scheduling
    await api.post("/scheduleReferees")
      .send({ leagueId: "demo-league", date: "2025-01-25" })
      .expect(200);

    // roster update check
    const res = await api.get("/getLeagueRosters")
      .query({ leagueId: "demo-league" })
      .expect(200);
    
    expect(res.body).toBeTruthy();
  });
});

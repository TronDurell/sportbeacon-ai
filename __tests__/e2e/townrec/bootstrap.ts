export async function seedDemoData(db: any) {
  await db.collection("leagues").doc("demo-league").set({ 
    name: "Demo League", 
    sport: "soccer",
    ageGroups: ["U10", "U12"],
    status: "active"
  });
  
  await db.collection("registrations").doc("reg1").set({ 
    playerId: "p1", 
    siblingGroup: "A", 
    age: 10, 
    status: "pending",
    leagueId: "demo-league"
  });
  
  await db.collection("players").doc("p1").set({
    name: "Demo Player",
    age: 10,
    skillLevel: "beginner"
  });
}

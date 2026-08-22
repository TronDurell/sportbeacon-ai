export type RunConnectionContext = {
  id: string;
  title: string;
  myParticipation: { status: string } | null;
};

/** Only a verified check-in or a completed run unlocks the connection surface. */
export function connectionsAreAvailable(run: RunConnectionContext): boolean {
  const status = run.myParticipation?.status;
  return status === "checked_in" || status === "completed";
}

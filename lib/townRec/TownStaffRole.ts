// Mock TownStaffRole
export class TownStaffRole {
  async getRole(userId: string): Promise<string> {
    return 'user';
  }
}

export default TownStaffRole;

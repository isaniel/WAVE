export interface UserRecord {
    uid: string;
    fullName: string;
    email: string;
    passwordHash: string;
    role: string;
    department: string;
    isActive: boolean;
    matricNumber?: string;
    staffId?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const jsonDb: {
    /**
     * Read all users from the JSON file database
     */
    readUsers(): UserRecord[];
    /**
     * Write all users to the JSON file database
     */
    writeUsers(users: UserRecord[]): void;
    /**
     * Find a user by email (case-insensitive)
     */
    findByEmail(email: string): UserRecord | null;
    /**
     * Find a user by unique ID (uid)
     */
    findById(uid: string): UserRecord | null;
    /**
     * Insert a new user into the database
     */
    createUser(user: UserRecord): void;
    /**
     * Search users by name or email (case-insensitive)
     */
    searchUsers(searchTerm: string): UserRecord[];
};
//# sourceMappingURL=jsonDb.d.ts.map
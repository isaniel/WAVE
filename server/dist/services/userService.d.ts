import { UserRecord } from './jsonDb';
export interface UserRegisterData {
    fullName: string;
    email: string;
    passwordHash: string;
    role: string;
    department: string;
    matricNumber?: string;
    staffId?: string;
}
export declare const userService: {
    /**
     * Securely hash a plain text password
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Compare a plain text password against a stored hash
     */
    comparePassword(password: string, hash: string): Promise<boolean>;
    /**
     * Find a user by their email in the database
     */
    findUserByEmail(email: string): Promise<UserRecord | null>;
    /**
     * Find a user by their unique ID (uid)
     */
    findUserById(uid: string): Promise<UserRecord | null>;
    /**
     * Create a new user with secure password hashing
     */
    createUser(data: UserRegisterData): Promise<UserRecord>;
    /**
     * Search users by name or email (excluding a specific UID, e.g., the current user)
     */
    searchUsers(searchTerm: string, excludeUid?: string): Promise<Omit<UserRecord, "passwordHash">[]>;
};
//# sourceMappingURL=userService.d.ts.map
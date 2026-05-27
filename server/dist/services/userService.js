"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const firebase_1 = require("../config/firebase");
const jsonDb_1 = require("./jsonDb");
// Toggle database mode using an environment variable
// Set USE_LOCAL_DB=true in your server/.env to use the local JSON file database
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
if (USE_LOCAL_DB) {
    console.log('📦 Database Mode: Local JSON File Database (users.json)');
}
else {
    console.log('☁️ Database Mode: Firestore Cloud Database');
}
exports.userService = {
    /**
     * Securely hash a plain text password
     */
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    },
    /**
     * Compare a plain text password against a stored hash
     */
    async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    },
    /**
     * Find a user by their email in the database
     */
    async findUserByEmail(email) {
        if (USE_LOCAL_DB) {
            return jsonDb_1.jsonDb.findByEmail(email);
        }
        else {
            try {
                const querySnapshot = await firebase_1.db
                    .collection('users')
                    .where('email', '==', email)
                    .limit(1)
                    .get();
                if (querySnapshot.empty)
                    return null;
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                return {
                    uid: doc.id,
                    ...data,
                };
            }
            catch (error) {
                console.error('Error finding user in Firestore:', error);
                throw error;
            }
        }
    },
    /**
     * Find a user by their unique ID (uid)
     */
    async findUserById(uid) {
        if (USE_LOCAL_DB) {
            return jsonDb_1.jsonDb.findById(uid);
        }
        else {
            try {
                const doc = await firebase_1.db.collection('users').doc(uid).get();
                if (!doc.exists)
                    return null;
                return {
                    uid: doc.id,
                    ...doc.data(),
                };
            }
            catch (error) {
                console.error('Error finding user by ID in Firestore:', error);
                throw error;
            }
        }
    },
    /**
     * Create a new user with secure password hashing
     */
    async createUser(data) {
        const { fullName, email, passwordHash, role, department, matricNumber, staffId } = data;
        if (USE_LOCAL_DB) {
            // Create user with a generated unique ID in the JSON DB
            const uid = 'local_' + Math.random().toString(36).substr(2, 9);
            const now = new Date().toISOString();
            const newUser = {
                uid,
                fullName,
                email,
                passwordHash,
                role,
                department,
                isActive: true,
                ...(matricNumber ? { matricNumber } : {}),
                ...(staffId ? { staffId } : {}),
                createdAt: now,
                updatedAt: now,
            };
            jsonDb_1.jsonDb.createUser(newUser);
            return newUser;
        }
        else {
            // 1. Create a corresponding Firebase Auth User
            let firebaseUser;
            try {
                firebaseUser = await firebase_1.authAdmin.createUser({
                    email,
                    displayName: fullName,
                });
            }
            catch (authError) {
                console.error('Error creating user in Firebase Auth:', authError);
                if (authError.code === 'auth/email-already-in-use') {
                    throw new Error('Email is already registered.');
                }
                throw new Error('Failed to register user in Authentication system.');
            }
            // 2. Save complete profile (including passwordHash) in Firestore Database
            try {
                const now = new Date().toISOString();
                const userData = {
                    fullName,
                    email,
                    passwordHash, // Stored securely as a bcrypt hash!
                    role,
                    department,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                    ...(matricNumber ? { matricNumber } : {}),
                    ...(staffId ? { staffId } : {}),
                };
                await firebase_1.db.collection('users').doc(firebaseUser.uid).set(userData);
                return {
                    uid: firebaseUser.uid,
                    ...userData,
                };
            }
            catch (dbError) {
                console.error('Error saving user in Firestore:', dbError);
                // Rollback Firebase Auth user if DB write fails
                try {
                    await firebase_1.authAdmin.deleteUser(firebaseUser.uid);
                }
                catch (rollbackError) {
                    console.error('Auth rollback failed:', rollbackError);
                }
                throw new Error('Failed to save user profile in Database.');
            }
        }
    },
    /**
     * Search users by name or email (excluding a specific UID, e.g., the current user)
     */
    async searchUsers(searchTerm, excludeUid) {
        let matches = [];
        if (USE_LOCAL_DB) {
            matches = jsonDb_1.jsonDb.searchUsers(searchTerm);
        }
        else {
            try {
                // Since Firestore doesn't support easy case-insensitive regex searches out-of-the-box
                // without heavy setups (like Algolia), we do a reliable exact-bound query or a clean full list fetch.
                // For standard campus deployments, we can query all users (using Server Admin privileges)
                // and filter in memory, which works beautifully and has no limits or query rule issues!
                const snapshot = await firebase_1.db.collection('users').get();
                const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
                const query = searchTerm.toLowerCase();
                matches = allUsers.filter(u => u.fullName.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query));
            }
            catch (error) {
                console.error('Error searching users in Firestore:', error);
                throw error;
            }
        }
        // Filter out excluded user and remove the passwordHash from the returned data for security!
        return matches
            .filter(u => u.uid !== excludeUid)
            .map(({ passwordHash, ...rest }) => rest);
    }
};
/* ============================================================================
   HOW TO SWITCH TO OTHER DATABASES (MYSQL / MONGODB)
   ============================================================================
   
   If you wish to switch this system to MySQL or MongoDB, you only need to modify
   this service! The rest of the server will continue to work perfectly.

   --- FOR MONGODB (Mongoose) ---
   1. Install dependencies: npm install mongoose
   2. Create a User schema and model:
      const UserSchema = new Schema({
        fullName: String,
        email: { type: String, unique: true },
        passwordHash: String,
        role: String,
        ...
      });
      const User = model('User', UserSchema);
   3. Update methods:
      - findUserByEmail: return await User.findOne({ email }).lean();
      - createUser: return await User.create(data);
      - searchUsers: return await User.find({
          $or: [
            { fullName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        }).lean();

   --- FOR MYSQL (mysql2 / Sequelize) ---
   1. Install dependencies: npm install mysql2
   2. Create a connection pool or model.
   3. Update methods:
      - findUserByEmail:
          const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
          return rows[0] || null;
      - createUser:
          const [result] = await pool.query(
            'INSERT INTO users (fullName, email, passwordHash, role, department...) VALUES (?, ?, ?, ?...)',
            [fullName, email, passwordHash...]
          );
          return { uid: result.insertId, ...data };
      - searchUsers:
          const [rows] = await pool.query(
            'SELECT * FROM users WHERE (fullName LIKE ? OR email LIKE ?) AND uid != ?',
            [`%${searchTerm}%`, `%${searchTerm}%`, excludeUid]
          );
          return rows;
   ============================================================================ */
//# sourceMappingURL=userService.js.map
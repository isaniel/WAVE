"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonDb = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'users.json');
// Ensure database directory and file exist
function initializeDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
}
exports.jsonDb = {
    /**
     * Read all users from the JSON file database
     */
    readUsers() {
        initializeDb();
        try {
            const data = fs.readFileSync(FILE_PATH, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error reading JSON database:', error);
            return [];
        }
    },
    /**
     * Write all users to the JSON file database
     */
    writeUsers(users) {
        initializeDb();
        try {
            fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error writing to JSON database:', error);
        }
    },
    /**
     * Find a user by email (case-insensitive)
     */
    findByEmail(email) {
        const users = this.readUsers();
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        return found || null;
    },
    /**
     * Find a user by unique ID (uid)
     */
    findById(uid) {
        const users = this.readUsers();
        const found = users.find(u => u.uid === uid);
        return found || null;
    },
    /**
     * Insert a new user into the database
     */
    createUser(user) {
        const users = this.readUsers();
        if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
            throw new Error('User with this email already exists.');
        }
        users.push(user);
        this.writeUsers(users);
    },
    /**
     * Search users by name or email (case-insensitive)
     */
    searchUsers(searchTerm) {
        const users = this.readUsers();
        const query = searchTerm.toLowerCase();
        return users.filter(u => u.fullName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query));
    }
};
//# sourceMappingURL=jsonDb.js.map
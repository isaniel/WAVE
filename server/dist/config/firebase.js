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
exports.authAdmin = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Initialize Firebase Admin SDK
function initializeFirebase() {
    // Option 1: Using GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    // Option 2: Using FIREBASE_SERVICE_ACCOUNT_KEY (inline JSON)
    const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (credPath) {
        const resolvedPath = path.resolve(credPath);
        if (fs.existsSync(resolvedPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized with service account file');
        }
        else {
            console.error(`Service account file not found at: ${resolvedPath}`);
            process.exit(1);
        }
    }
    else if (credJson) {
        try {
            const serviceAccount = JSON.parse(credJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized with inline credentials');
        }
        catch (error) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
            process.exit(1);
        }
    }
    else {
        console.error('No Firebase credentials provided. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY');
        process.exit(1);
    }
}
initializeFirebase();
exports.db = admin.firestore();
exports.authAdmin = admin.auth();
exports.default = admin;
//# sourceMappingURL=firebase.js.map
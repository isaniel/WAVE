import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
function initializeFirebase(): void {
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
    } else {
      console.error(`Service account file not found at: ${resolvedPath}`);
      process.exit(1);
    }
  } else if (credJson) {
    try {
      const serviceAccount = JSON.parse(credJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized with inline credentials');
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      process.exit(1);
    }
  } else {
    console.error('No Firebase credentials provided. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
}

initializeFirebase();

export const db = admin.firestore();
export const authAdmin = admin.auth();
export default admin;

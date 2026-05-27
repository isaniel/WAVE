import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { User, RegisterData, Room, RoomMessage, PrivateChat, PrivateMessage, Announcement } from '@/types';
import seedData from '@/data/data.json';

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

type SeedStaff = {
  name: string;
  email: string;
  staffId: string;
  role?: string;
};

type SeedData = {
  students: Array<{ name: string; email: string; matricNumber: string }>;
  staff: SeedStaff[];
};

const typedSeedData = seedData as SeedData;
const normalize = (value: string) => value.trim().toLowerCase();

const resolveRoleFromSeedData = (email: string): User['role'] | null => {
  const normalizedEmail = normalize(email);

  if (!normalizedEmail) {
    return null;
  }

  const matchedStudent = typedSeedData.students.find(
    (student) => normalize(student.email) === normalizedEmail
  );

  if (matchedStudent) {
    return 'student';
  }

  const matchedStaff = typedSeedData.staff.find(
    (staffMember) => normalize(staffMember.email) === normalizedEmail
  );

  if (!matchedStaff) {
    return null;
  }

  return normalize(matchedStaff.role ?? '') === 'admin' ? 'admin' : 'lecturer';
};

export const syncUserRoleFromSeedData = async (
  uid: string,
  email: string
): Promise<User | null> => {
  const desiredRole = resolveRoleFromSeedData(email);

  if (!desiredRole) {
    return await getUserProfile(uid);
  }

  const userProfile = await getUserProfile(uid);

  if (!userProfile) {
    return null;
  }

  if (userProfile.role === desiredRole) {
    return userProfile;
  }

  await updateDoc(doc(db, 'users', uid), {
    role: desiredRole,
    updatedAt: Timestamp.now(),
  });

  return {
    ...userProfile,
    role: desiredRole,
  };
};

// Auth Services
export const registerUser = async (data: RegisterData): Promise<User> => {
  const { fullName, email, password, role, department, matricNumber, staffId } = data;

  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update profile
  await updateProfile(firebaseUser, { displayName: fullName });

  // Create user document in Firestore
  const now = Timestamp.now();
  const userData: Omit<User, 'uid'> = {
    fullName,
    email,
    role,
    department,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    // Only include optional fields if they have values (Firestore rejects undefined)
    ...(matricNumber ? { matricNumber } : {}),
    ...(staffId ? { staffId } : {}),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), userData);

  return {
    uid: firebaseUser.uid,
    ...userData,
  };
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserRoleFromSeedData(userCredential.user.uid, userCredential.user.email ?? email);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

// User Services
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() } as User;
};

export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date(),
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as User);
};

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  const normalizedQuery = searchTerm.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs
    .map((doc) => {
      const data = doc.data() as Partial<User>;
      const fullName = typeof data.fullName === 'string' ? data.fullName : '';
      const email = typeof data.email === 'string' ? data.email : '';
      const role =
        data.role === 'student' || data.role === 'lecturer' || data.role === 'admin'
          ? data.role
          : 'student';
      const department = typeof data.department === 'string' ? data.department : '';

      if (!fullName && !email) {
        return null;
      }

      return {
        uid: doc.id,
        fullName,
        email,
        role,
        department,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : false,
      } as User;
    })
    .filter((user): user is User => user !== null);

  return users.filter((user) => {
    const haystack = `${user.fullName} ${user.email} ${user.department}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
};

// Room Services
export const createRoom = async (
  roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'createdByName'>,
  creatorName: string
): Promise<string> => {
  const roomRef = doc(collection(db, 'rooms'));
  const now = new Date();
  
  await setDoc(roomRef, {
    ...roomData,
    createdByName: creatorName,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    lastMessage: null,
  });

  // Add creator as member
  await setDoc(doc(db, 'rooms', roomRef.id, 'members', roomData.createdBy), {
    userId: roomData.createdBy,
    joinedAt: now,
    roleInRoom: 'admin',
  });

  return roomRef.id;
};

export const getRooms = async (category?: string, archived: boolean = false): Promise<Room[]> => {
  let roomsQuery = query(collection(db, 'rooms'), where('isArchived', '==', archived));
  
  if (category) {
    roomsQuery = query(roomsQuery, where('category', '==', category));
  }
  
  roomsQuery = query(roomsQuery, orderBy('createdAt', 'desc'));
  
  const roomsSnapshot = await getDocs(roomsQuery);
  return roomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room);
};

export const getRoomById = async (roomId: string): Promise<Room | null> => {
  const roomDoc = await getDoc(doc(db, 'rooms', roomId));
  if (!roomDoc.exists()) return null;
  return { id: roomDoc.id, ...roomDoc.data() } as Room;
};

export const updateRoom = async (roomId: string, data: Partial<Room>): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  await deleteDoc(doc(db, 'rooms', roomId));
};

export const joinRoom = async (roomId: string, userId: string): Promise<void> => {
  await setDoc(doc(db, 'rooms', roomId, 'members', userId), {
    userId,
    joinedAt: new Date(),
    roleInRoom: 'member',
  });
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  await deleteDoc(doc(db, 'rooms', roomId, 'members', userId));
};

export const getRoomMembers = async (roomId: string): Promise<string[]> => {
  const membersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'members'));
  return membersSnapshot.docs.map((doc) => doc.id);
};

export const isRoomMember = async (roomId: string, userId: string): Promise<boolean> => {
  const memberDoc = await getDoc(doc(db, 'rooms', roomId, 'members', userId));
  return memberDoc.exists();
};

// Room Messages Services
export const getRoomMessages = async (
  roomId: string,
  messageLimit: number = 50,
  lastMessage?: QueryDocumentSnapshot<DocumentData>
): Promise<{ messages: RoomMessage[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  let messagesQuery = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  );

  if (lastMessage) {
    messagesQuery = query(messagesQuery, startAfter(lastMessage));
  }

  const messagesSnapshot = await getDocs(messagesQuery);
  const messages = messagesSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as RoomMessage)
    .reverse();

  const lastDoc = messagesSnapshot.docs[messagesSnapshot.docs.length - 1] || null;

  return { messages, lastDoc };
};

// Private Chat Services
export const getOrCreatePrivateChat = async (userId1: string, userId2: string): Promise<string> => {
  // Check if chat already exists
  const chatsQuery = query(
    collection(db, 'privateChats'),
    where('participants', 'array-contains', userId1)
  );

  const chatsSnapshot = await getDocs(chatsQuery);
  const existingChat = chatsSnapshot.docs.find((doc) => {
    const data = doc.data();
    return data.participants.includes(userId2);
  });

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const chatRef = doc(collection(db, 'privateChats'));
  const now = new Date();

  await setDoc(chatRef, {
    participants: [userId1, userId2],
    createdAt: now,
    updatedAt: now,
  });

  return chatRef.id;
};

export const getUserChats = async (userId: string): Promise<PrivateChat[]> => {
  const chatsQuery = query(
    collection(db, 'privateChats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  const chatsSnapshot = await getDocs(chatsQuery);
  const chats: PrivateChat[] = [];

  for (const chatDoc of chatsSnapshot.docs) {
    const chatData = chatDoc.data();
    const otherUserId = chatData.participants.find((id: string) => id !== userId);
    const otherUser = otherUserId ? await getUserProfile(otherUserId) : null;

    chats.push({
      id: chatDoc.id,
      ...chatData,
      otherUser: otherUser || undefined,
    } as PrivateChat);
  }

  return chats;
};

export const getPrivateMessages = async (
  chatId: string,
  messageLimit: number = 50
): Promise<PrivateMessage[]> => {
  const messagesQuery = query(
    collection(db, 'privateChats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  );

  const messagesSnapshot = await getDocs(messagesQuery);
  return messagesSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as PrivateMessage)
    .reverse();
};

// Announcement Services
export const createAnnouncement = async (
  announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdByName'>,
  creatorName: string
): Promise<string> => {
  const announcementRef = doc(collection(db, 'announcements'));
  const now = new Date();

  await setDoc(announcementRef, {
    ...announcementData,
    createdByName: creatorName,
    createdAt: now,
    updatedAt: now,
  });

  return announcementRef.id;
};

export const getAnnouncements = async (targetAudience?: string): Promise<Announcement[]> => {
  let announcementsQuery = query(
    collection(db, 'announcements'),
    orderBy('pinned', 'desc'),
    orderBy('createdAt', 'desc')
  );

  const announcementsSnapshot = await getDocs(announcementsQuery);
  let announcements = announcementsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Announcement
  );

  if (targetAudience) {
    announcements = announcements.filter(
      (a) => a.targetAudience === 'all' || a.targetAudience === targetAudience
    );
  }

  return announcements;
};

export const updateAnnouncement = async (
  announcementId: string,
  data: Partial<Announcement>
): Promise<void> => {
  await updateDoc(doc(db, 'announcements', announcementId), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  await deleteDoc(doc(db, 'announcements', announcementId));
};

// Statistics for Admin Dashboard
export const getStatistics = async (): Promise<{
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  totalAnnouncements: number;
}> => {
  const [usersSnapshot, roomsSnapshot, announcementsSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'rooms')),
    getDocs(collection(db, 'announcements')),
  ]);

  // Count messages across all rooms
  let totalMessages = 0;
  for (const roomDoc of roomsSnapshot.docs) {
    const messagesSnapshot = await getDocs(collection(db, 'rooms', roomDoc.id, 'messages'));
    totalMessages += messagesSnapshot.size;
  }

  return {
    totalUsers: usersSnapshot.size,
    totalRooms: roomsSnapshot.size,
    totalMessages,
    totalAnnouncements: announcementsSnapshot.size,
  };
};

export { onAuthStateChanged, onSnapshot, Timestamp };

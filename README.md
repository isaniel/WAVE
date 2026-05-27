# Campus Chat Engine

A modern, real-time campus chat application built with React, Firebase, Firestore, and Socket.io. Designed for university communities to facilitate communication between students, lecturers, and administrators.

## Features

### User Roles
- **Students**: Join rooms, send messages, private messaging, view announcements
- **Lecturers**: All student features + create and manage academic rooms
- **Admins**: Full system control including user management, room moderation, and announcements

### Core Features
- **Structured Chat Rooms**: Organized by courses, departments, faculties, and social groups
- **Real-time Messaging**: Instant message delivery using Socket.io
- **Private Messaging**: One-on-one conversations between users
- **Announcement System**: Official campus updates with target audience filtering
- **Admin Dashboard**: User management, room moderation, and system analytics
- **Role-based Access Control**: Secure permissions based on user roles

### Technical Features
- Firebase Authentication with email/password
- Firestore for persistent data storage
- Socket.io for real-time communication
- Responsive design for desktop and mobile
- Dark mode UI
- Message editing and deletion
- Typing indicators
- Online/offline status

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Socket.io-client for real-time communication
- Firebase SDK for authentication and Firestore

### Backend
- Node.js with Express
- Socket.io for WebSocket connections
- Firebase Admin SDK for token verification
- Firestore for data persistence

## Project Structure

```
/mnt/okcomputer/output/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   │   └── admin/      # Admin dashboard pages
│   │   ├── services/       # Firebase and Socket.io services
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main application component
│   ├── .env.example        # Environment variables template
│   └── package.json
├── server/                 # Backend Socket.io server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── socket/         # Socket.io event handlers
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
└── firestore.rules         # Firebase security rules
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase account and project
- Git (optional)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., "campus-chat-engine")
3. Enable **Authentication** with Email/Password provider
4. Create a **Firestore Database** in test mode (or production with rules)
5. Go to Project Settings > Service Accounts
6. Click "Generate new private key" and download the JSON file
7. Go to Project Settings > General > Your apps
8. Create a new Web app and copy the configuration

### 2. Frontend Setup

```bash
cd app

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Firebase configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Firebase service account
PORT=3001
CLIENT_URL=http://localhost:5173

# Option 1: Path to service account file
GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json

# Option 2: Paste the entire JSON content
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 4. Firebase Security Rules

1. Go to Firebase Console > Firestore Database > Rules
2. Copy the contents from `firestore.rules` file
3. Click "Publish"

### 5. Running the Application

**Start the Backend Server:**
```bash
cd server
npm run dev
# or
npm start
```

**Start the Frontend (in a new terminal):**
```bash
cd app
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

### First Time Setup

1. Register as a new user
2. The first user can be manually set as admin in Firestore:
   - Go to Firebase Console > Firestore
   - Find your user document in the `users` collection
   - Change `role` field from "student" to "admin"

### Creating Rooms

- **Lecturers and Admins** can create official rooms
- Rooms can be categorized as: course, department, faculty, social, or announcements
- Rooms can be public (joinable by anyone) or private (invitation only)

### Sending Messages

- Join a room to start sending messages
- Messages are delivered in real-time via Socket.io
- Message history is persisted in Firestore
- Users can edit or delete their own messages
- Admins can delete any message

### Private Messaging

- Go to Messages > New Message
- Search for a user by name or email
- Start a conversation

### Admin Dashboard

Access the admin dashboard at `/admin` (admin users only):
- View system statistics
- Manage users (activate/deactivate, change roles)
- Manage rooms (create, edit, archive, delete)
- Create and manage announcements

## Environment Variables

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_SOCKET_URL` | Socket.io server URL |

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON content |

## API Documentation

### Socket.io Events

#### Room Events
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_room_message` - Send a message to a room
- `receive_room_message` - Receive a room message
- `typing_start` / `typing_stop` - Typing indicators
- `edit_room_message` - Edit a message
- `delete_room_message` - Delete a message

#### Private Message Events
- `join_private_chat` - Join a private chat
- `leave_private_chat` - Leave a private chat
- `send_private_message` - Send a private message
- `receive_private_message` - Receive a private message

## Security Considerations

1. **Authentication**: All socket connections require a valid Firebase ID token
2. **Authorization**: Role-based access control implemented in both frontend and backend
3. **Data Validation**: Input validation on both client and server
4. **Firestore Rules**: Comprehensive security rules to protect data
5. **CORS**: Configured to allow only the frontend origin

## Troubleshooting

### Common Issues

1. **Socket connection fails**
   - Check that the backend server is running
   - Verify `VITE_SOCKET_URL` is correct
   - Check browser console for CORS errors

2. **Firebase authentication fails**
   - Verify Firebase configuration in `.env`
   - Check that Email/Password provider is enabled

3. **Cannot access admin dashboard**
   - Verify user role is set to "admin" in Firestore
   - Check that the user document exists

## License

This project is intended for educational purposes.

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

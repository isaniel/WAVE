# WAVE — Campus Chat Engine
 
A real-time campus communication platform built as a final year project. Students, lecturers, and admins each have different levels of access. Chat is live, rooms are organized by category, and there's a separate announcement system for official updates.
 
The project has two parts — `app` (the frontend) and `server` (the backend). Both need to be running at the same time.
 
---
 
## Requirements
 
Node.js v18 or later. Everything else including Firebase credentials is already in the project.
 
---
 
## Getting it running
 
Open two terminals.
 
**Terminal 1**
```bash
cd server
npm install
npm run dev
```
 
**Terminal 2**
```bash
cd app
npm install
npm run dev
```
 
Then visit **http://localhost:5173** in your browser.
 
---
 
## Test accounts
 
Registration only accepts pre-approved details, so use one of these. The name, email, and ID have to match exactly. Pick your own password when registering.
 
**Admin** — Name: `John Doe` · Email: `mathew@gmail.com` · Staff ID: `DUS100`
 
**Lecturer** — Name: `Sarah Brown` · Email: `sarah.brown@gmail.com` · Staff ID: `DUS150`
 
**Student** — Name: `John Doe` · Email: `mathew43@gmail.com` · Matric No: `DU0200`
 
---
 
## What each role can do
 
Students can join public rooms, send messages, edit or delete their own messages, and start private conversations with other users.
 
Lecturers get everything above, plus the ability to create and manage rooms.
 
Admins get a full admin panel — system stats, user management (change roles, deactivate accounts), room management, and the ability to post announcements.
 
---
 
## Project structure
 
```
WAVE/
├── app/
│   └── src/
│       ├── App.tsx                 routes and auth guards
│       ├── contexts/
│       │   └── AuthContext.tsx     manages the logged-in user and socket connection
│       ├── services/
│       │   ├── firebase.ts         all Firestore reads and writes
│       │   └── socket.ts           socket.io client
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Home.tsx
│       │   ├── Rooms.tsx
│       │   ├── RoomChat.tsx
│       │   ├── Messages.tsx
│       │   ├── PrivateChat.tsx
│       │   ├── Announcements.tsx
│       │   ├── Profile.tsx
│       │   └── admin/
│       │       ├── Dashboard.tsx
│       │       ├── Users.tsx
│       │       └── Rooms.tsx
│       ├── components/
│       │   └── Layout.tsx          sidebar and navigation
│       ├── types/
│       │   └── index.ts            shared TypeScript types
│       └── data/
│           └── data.json           registration allowlist
│
└── server/
    └── src/
        ├── index.ts                Express + Socket.io server entry
        ├── config/
        │   └── firebase.ts         Firebase Admin SDK setup
        ├── middleware/
        │   └── auth.ts             verifies Firebase token on every socket connection
        └── socket/
            ├── roomHandlers.ts     room chat events
            ├── privateHandlers.ts  private message events
            └── statusHandlers.ts   online/offline presence
```
 
---
 
## Tech stack
 
- React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui
- Firebase Authentication + Firestore
- Socket.io
- Node.js + Express

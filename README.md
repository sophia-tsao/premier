# Premier Portal

A web portal for Premier Charter School that gives teachers and staff quick access to their subject-specific Google Drive folders. Users log in with their school credentials, see only the subjects assigned to them, and open the corresponding Drive folder in one click.

## Features

- **Authentication** — Email/password and Google Sign-In via Firebase Auth
- **Role-based access** — Teachers see their assigned subjects; admins can manage all users
- **Subject Drive** — Each subject links directly to its Google Drive folder
- **User management** — Admins can add, edit, and deactivate user accounts
- **Covers all grade levels** — Pre-K through 12th grade, including AP and elective courses

## Tech Stack

- **Frontend**: React (Create React App)
- **Auth & Database**: Firebase Authentication + Cloud Firestore
- **Routing**: React Router v6
- **File storage**: Google Drive (linked via Drive folder URLs)

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/en/download) — includes `npm`
- [Git](https://git-scm.com/downloads)

### Installation

```bash
git clone <repo-url>
cd premier
npm install
```

### Running Locally

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in the browser.

### Building for Production

```bash
npm run build
```

Outputs an optimized build to the `build/` folder.

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx        # Login screen
│   ├── SignUpPage.jsx        # New account registration
│   ├── SubjectDrive.jsx      # Subject selector and Drive links
│   └── UsersPage.jsx         # Admin user management
├── routes/
│   └── router.js             # React Router configuration
└── utils/
    ├── f_config.js           # Firebase config and Drive folder map
    ├── firebase_auth.js      # Auth helpers (sign in, sign out)
    └── firebase_store.js     # Firestore helpers
```

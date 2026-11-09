# UnityHub — Backend API

Backend application for **UnityHub**, a community management platform supporting community administration, member engagement, service management, and real-time messaging.

Built using **Node.js, Express.js, TypeScript, MongoDB, Mongoose, and Socket.IO**.

## 🚀 Key Features

### Authentication & Authorization
- User authentication using JSON Web Tokens (JWT).
- Password hashing using bcrypt.
- Authentication middleware for protected REST API routes.
- Separate API routes for administrators, community administrators, and users.
- User account status verification.

### Community Management
- Community creation and management.
- Community member management.
- Group management.
- Community administration functionality.

### Social Engagement
- Community posts and comments.
- Group posts and comments.
- Community interaction functionality.

### Real-Time Messaging
- One-to-one messaging using Socket.IO.
- Group messaging using Socket.IO.
- MongoDB-backed message storage.
- APIs for retrieving conversation history.

### Service Management
- Building service management.
- User service management.
- Service scheduling functionality.

### Additional Functionality
- Cloudinary integration for media management.
- Nodemailer integration for email functionality.
- Centralized error-handling middleware.
- Custom error classes.
- RESTful API architecture.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Real-Time Communication | Socket.IO |
| Media Management | Cloudinary |
| Email | Nodemailer |
| Development Tools | Git, GitHub, Nodemon, ts-node |

## 🏗️ Project Architecture

The backend follows a modular structure separating API routes, controllers, database models, middleware, configuration, and utility functions.

```text
src/
├── config/
│   ├── cloudinary.ts
│   ├── database.ts
│   └── nodemailer.ts
├── controllers/
├── errors/
├── middlewares/
├── models/
├── routes/
├── utils/
├── index.ts
└── socket.ts
```

### Main Components

**Routes:** Define API endpoints for authentication, administration, community management, and user functionality.

**Controllers:** Handle application requests and business logic.

**Models:** Define MongoDB document schemas using Mongoose.

**Middleware:** Handles authentication, account status checks, and errors.

**Socket.IO:** Handles real-time messaging events and communication between connected clients.

## 🔗 API Overview

The application includes the following API route groups:

| Route | Purpose |
|---|---|
| `/api/auth` | Authentication |
| `/api/admin` | Administrative functionality |
| `/api/commAdmin` | Community administration |
| `/api/user` | User functionality |
| `/api/landing-page` | Landing page data |
| `/api/landing-page/search` | Landing page search |
| `/api/contact` | Contact form submission |

These are route groups and selected endpoints, not a complete API reference.

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- MongoDB database
- Required service credentials for integrations used by the application

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/GopikaDeepak45/UnityHub-Node.git
```

**2. Navigate to the project**

```bash
cd UnityHub-Node
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the project root.

The database connection requires:

```env
MONGODB_CONNECTION_STRING=your_mongodb_connection_string
```

Additional environment variables are required for authentication, Cloudinary, and email functionality. Configure these according to the application's source code and your development environment.

Never commit actual credentials or secrets.

**5. Start the development server**

```bash
npm run dev
```

The application is currently configured to run on:

```text
http://localhost:3000
```

The configured frontend origin is:

```text
http://localhost:5173
```

These values are currently defined in the application source code.

## 💬 Real-Time Communication

UnityHub uses Socket.IO for personal and group messaging.

The implementation includes:
- Socket connections between clients and the backend.
- Conversation and group rooms.
- Message transmission.
- Message persistence using MongoDB.
- Conversation history retrieval through REST APIs.

**Development note:** The current Socket.IO implementation requires additional authentication, room authorization, and message validation before production deployment.

## 🔗 Frontend Repository

The frontend is developed separately using React, TypeScript, Redux Toolkit, RTK Query, and Tailwind CSS.

**Frontend:** [UnityHub-React](https://github.com/GopikaDeepak45/UnityHub-React)

## 📌 Project Status

Portfolio project demonstrating full-stack development, REST API design, MongoDB data modeling, authentication workflows, and real-time communication.

The application has not been presented as a production-deployed system.

## 👩‍💻 Developer

**Gopika Deepak**

Full Stack Developer | MERN Stack | React.js | Node.js | TypeScript

[GitHub Profile](https://github.com/GopikaDeepak45)

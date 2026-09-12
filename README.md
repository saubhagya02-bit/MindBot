<div align="center">

# 🤖 MindBot Chat

**A full-stack AI chatbot powered by Google Gemini AI**

Built with React · Node.js · Tailwind CSS · Express · MongoDB · Docker

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

---

![MindBot Screenshot](./screenshots/MindBot.png)

</div>

---

## ✨ Features

- 🔥 **Real-time streaming** — AI responses stream word by word via Server-Sent Events (SSE)
- 👤 **User accounts** — Register, login, logout with JWT authentication and bcrypt password hashing
- 🗄️ **MongoDB database** — All users and conversations stored securely in MongoDB Atlas
- 🆓 **Guest mode** — Try 1 free message before signing up
- 💬 **Chat history** — Conversations saved to MongoDB, grouped by Today / Yesterday / Last 7 days
- 🔍 **Search conversations** — Filter your chat history instantly
- ✏️ **Edit & copy messages** — Edit sent messages in place and get a fresh AI response
- 🎨 **6 themes** — Dark, Midnight, Light, Ocean, Rose, Forest + 6 accent colors
- 🔄 **Auto model fallback** — Tries multiple Gemini models automatically if one is rate-limited
- 🛡️ **Security** — JWT httpOnly cookies, bcrypt hashing, rate limiting, Helmet.js headers
- 🐳 **Docker ready** — One command to run everything in containers
- 📱 **Responsive** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS 3 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **AI** | Google Gemini API (gemini-2.5-flash) |
| **Auth** | JWT tokens in httpOnly cookies + bcrypt |
| **Streaming** | Server-Sent Events (SSE) |
| **Markdown** | react-markdown + remark-gfm |
| **Syntax Highlighting** | react-syntax-highlighter |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 🗂 Project Structure

```
MindBot/
├── 📄 docker-compose.yml
├── 📄 LICENSE
├── 📄 .env.example
│
├── 🖥️ server/
│   ├── index.js                   # Main server — Gemini, SSE, chat route
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                       # Your keys (not committed)
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User schema (bcrypt password)
│   │   └── Session.js             # Session + messages schema
│   ├── middleware/
│   │   └── auth.js                # JWT protect middleware
│   └── routes/
│       ├── auth.js                # Register, login, logout, profile
│       └── sessions.js            # CRUD session routes
│
└── 🌐 client/
    ├── nginx.conf
    ├── Dockerfile
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   ├── AuthContext.jsx    # Auth state + JWT API calls
        │   └── ChatContext.jsx    # Sessions, messages, streaming
        └── components/
            ├── Layout.jsx
            ├── Sidebar.jsx
            ├── ChatArea.jsx
            ├── ChatInput.jsx
            ├── MessageList.jsx
            ├── Message.jsx
            ├── WelcomeScreen.jsx
            ├── AuthPage.jsx
            ├── AuthPrompt.jsx
            └── AccountSettings.jsx
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org) installed
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A free [MongoDB Atlas](https://mongodb.com/atlas) cluster

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mindbot-chat.git
cd mindbot-chat
```

### 2. Get your free Gemini API key

1. Go to → **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API key"** → **"Create new project"**
4. Copy the key

### 3. Get your free MongoDB URI

1. Go to → **https://mongodb.com/atlas** → sign up free
2. Create a free **M0 cluster**
3. Create a database user (username + password)
4. Click **Connect** → copy the connection string

### 4. Configure environment

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in your values:

```env
GEMINI_API_KEY=AIzaSy_your_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindbot
JWT_SECRET=your_long_random_secret_key_here
JWT_EXPIRES_IN=30d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 5. Install all dependencies

From the **root** of the project:

```bash
npm run install:all
```

### 6. Run the app

```bash
npm run dev
```

Both server (`:5000`) and client (`:5173`) start together.

Open **http://localhost:5173** 🎉

---

## 🐳 Docker Deployment

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed

### 1. Create root `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=AIzaSy_your_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindbot
JWT_SECRET=your_long_random_secret_here
```

### 2. Build and start

```bash
docker-compose up --build
```

Open **http://localhost** 🎉

### Docker commands

```bash
docker-compose up -d          # Run in background
docker-compose down           # Stop everything
docker-compose logs -f server # View server logs
docker-compose restart        # Restart all containers
docker-compose down -v        # Remove containers + volumes
```

### Containers

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `mindbot-server` | node:20-alpine | 5000 | Express API + Gemini |
| `mindbot-client` | nginx:alpine | 80 | React app + proxy |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout (clears cookie) |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/profile` | Update name / email / theme |
| `PUT` | `/api/auth/password` | Change password |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List user's sessions |
| `POST` | `/api/sessions` | Create new session |
| `GET` | `/api/sessions/:id` | Get session with messages |
| `DELETE` | `/api/sessions/:id` | Delete a session |
| `PATCH` | `/api/sessions/:id/title` | Rename session |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/chat` | Send message (SSE streaming) |

### Chat request body

```json
{
  "message": "What is JavaScript?",
  "sessionId": "mongodb-object-id"
}
```

### SSE events streamed back

```
event: start  →  { sessionId, model }
event: chunk  →  { text }
event: done   →  { sessionId, title }
event: error  →  { message }
```

---

## 🎨 Themes

All configurable from **Account Settings → Appearance**.

| Theme | Background | Style |
|-------|-----------|-------|
| Dark | `#0b0d14` | Default dark |
| Midnight | `#050508` | Deep dark |
| Light | `#f0f4f8` | Light mode |
| Ocean | `#081419` | Teal dark |
| Rose | `#120608` | Warm dark |
| Forest | `#060e08` | Green dark |

---

## 🔑 Environment Variables

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `30d`) |
| `PORT` | No | Server port (default: `5000`) |
| `CLIENT_URL` | No | Frontend URL for CORS |
| `NODE_ENV` | No | `development` or `production` |

---

## ⚙️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client together |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run build` | Build client for production |
| `npm run install:all` | Install all dependencies |

---

## 🤖 Gemini Model Fallback

Automatically tries models in this order if one is unavailable:

```
gemini-2.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite →
gemini-2.5-pro → gemini-2.0-flash-001 → gemini-2.5-flash-lite
```

---

## 🙌 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ using Google Gemini AI + MongoDB

⭐ Star this repo if you found it helpful!

</div>

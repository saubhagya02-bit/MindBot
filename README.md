<div align="center">
  
# 🤖 MindBot Chat

**A full-stack AI chatbot powered by Google Gemini AI**

Built with React · Node.js · Tailwind CSS · Express · Docker

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

---

![MindBot Screenshot](./screenshots/mindbot.png)

</div>

---

## ✨ Features

- 🔥 **Real-time streaming** — AI responses stream word by word via Server-Sent Events (SSE)
- 👤 **User accounts** — Register, login, logout with per-user session isolation
- 🆓 **Guest mode** — Try 1 free message before signing up
- 💬 **Chat history** — Conversations saved to disk, grouped by Today / Yesterday / Last 7 days
- 🔍 **Search conversations** — Filter your chat history instantly
- ✏️ **Edit & copy messages** — Edit your sent messages or copy any response
- 🎨 **6 themes** — Dark, Midnight, Light, Ocean, Rose, Forest + 6 accent colors
- 🔄 **Auto model fallback** — Tries multiple Gemini models automatically if one is rate-limited
- 🛡️ **Rate limiting** — Built-in API abuse protection
- 🐳 **Docker ready** — One command to run everything in containers
- 📱 **Responsive** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS 3 |
| **Backend** | Node.js, Express.js |
| **AI** | Google Gemini API (gemini-2.5-flash) |
| **Streaming** | Server-Sent Events (SSE) |
| **Markdown** | react-markdown + remark-gfm |
| **Syntax Highlighting** | react-syntax-highlighter |
| **Containerization** | Docker, Docker Compose, Nginx |
| **Auth** | localStorage-based (client-side) |
| **Persistence** | File-based JSON session store |

---

## 🗂 Project Structure

```
MindBot/
├── 📄 docker-compose.yml          # Docker orchestration
├── 📄 LICENSE                     # MIT License
├── 📄 .env.example                # Environment template
│
├── 🖥️ server/                     # Node.js + Express backend
│   ├── index.js                   # Main server — API, Gemini, SSE, sessions
│   ├── Dockerfile                 # Server container
│   ├── .dockerignore
│   ├── package.json
│   └── .env                       # Your API key (not committed)
│
└── 🌐 client/                     # React frontend
    ├── nginx.conf                 # Nginx config for production
    ├── Dockerfile                 # Multi-stage build container
    ├── .dockerignore
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx                # Root — auth guard
        ├── main.jsx
        ├── index.css              # Tailwind + theme variables
        ├── context/
        │   ├── AuthContext.jsx    # Auth, theme, user accounts
        │   └── ChatContext.jsx    # Sessions, messages, streaming
        └── components/
            ├── Layout.jsx         # Sidebar + chat layout
            ├── Sidebar.jsx        # History, search, user footer
            ├── ChatArea.jsx       # Main chat wrapper + topbar
            ├── ChatInput.jsx      # Message input with guest lock
            ├── MessageList.jsx    # Message renderer
            ├── Message.jsx        # Bubbles + copy/edit actions
            ├── WelcomeScreen.jsx  # Welcome + suggestion cards
            ├── AuthPage.jsx       # Sign in / register page
            ├── AuthPrompt.jsx     # Guest upgrade overlay
            └── AccountSettings.jsx # Profile, security, themes
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org) installed
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mindbot-chat.git
cd mindbot-chat
```

### 2. Get your free Gemini API key

1. Go to → **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API key"** → select **"Create new project"**
4. Copy the key

### 3. Configure environment

```bash
cd server
cp .env.example .env
```

Open `server/.env` and add your key:

```env
GEMINI_API_KEY=AIzaSy_your_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 4. Install dependencies

From the **root** of the project:

```bash
npm run install:all
```

### 5. Run the app

```bash
npm run dev
```

This starts both server (`:5000`) and client (`:5173`) together.

Open **http://localhost:5173** 🎉

---

## 🐳 Docker Deployment

The easiest way to run MindBot in production.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed

### 1. Create root `.env` file

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=AIzaSy_your_key_here
```

### 2. Build and start

```bash
docker-compose up --build
```

Open **http://localhost** 🎉

### Docker commands

```bash
# Start in background
docker-compose up -d

# Stop everything
docker-compose down

# View server logs
docker-compose logs -f server

# Restart
docker-compose restart

# Remove containers + volumes (resets all data)
docker-compose down -v
```

### What runs in Docker

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `mindbot-server` | node:20-alpine | 5000 | Express API + Gemini |
| `mindbot-client` | nginx:alpine | 80 | React app + API proxy |

Session data is stored in a Docker **named volume** (`mindbot-data`) so it survives container restarts.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/models` | List available Gemini models |
| `GET` | `/api/sessions?userId=` | List user's sessions |
| `POST` | `/api/sessions` | Create new session |
| `GET` | `/api/sessions/:id?userId=` | Get session with messages |
| `DELETE` | `/api/sessions/:id?userId=` | Delete a session |
| `POST` | `/api/chat` | Send message (SSE streaming) |

### Chat request body

```json
{
  "message": "What is JavaScript?",
  "sessionId": "uuid-here",
  "userId": "user-id-here"
}
```

### SSE events streamed back

```
event: start   → { sessionId, model }
event: chunk   → { text }
event: done    → { sessionId, title }
event: error   → { message }
```

---

## 🎨 Themes

MindBot includes 6 built-in themes and 6 accent colors, all configurable from **Account Settings → Appearance**.

| Theme | Background | Best for |
|-------|-----------|---------|
| Dark | `#0b0d14` | Default — easy on eyes |
| Midnight | `#050508` | Deep dark for night use |
| Light | `#f0f4f8` | Daytime / bright environments |
| Ocean | `#081419` | Teal-toned dark |
| Rose | `#120608` | Warm dark |
| Forest | `#060e08` | Green-toned dark |

---

## ⚙️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client together |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run build` | Build frontend for production |
| `npm run install:all` | Install all dependencies |

---

## 🔑 Environment Variables

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `PORT` | No | Server port (default: `5000`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `NODE_ENV` | No | `development` or `production` |

---

## 🤖 Gemini Model Fallback

MindBot automatically tries these models in order if one is unavailable or rate-limited:

```
gemini-2.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite →
gemini-2.5-pro → gemini-2.0-flash-001 → gemini-2.5-flash-lite
```

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

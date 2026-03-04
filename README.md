# PromptRaft 🛶

Welcome to **PromptRaft**, an AI-powered platform designed to help you improve your skills in prompt engineering. Discover, collect, and refine the best AI prompts to elevate your interaction with large language models like ChatGPT, Claude, and Gemini.

---

## ✨ Features
- **Prompt Refinement Editor**: Experiment with and refine your day-to-day prompts.
- **Community Library**: Browse a rich collection of user-submitted prompts.
- **Interactive UI**: A sleek, minimalist, high-contrast monochrome design focused entirely on the content.
- **Custom Categories & Tags**: Easily sort and organize prompts by context (Research, Coding, Productivity, etc.).
- **Admin Dashboard**: Manage users and daily prompt challenges natively.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB (if running the backend locally)

### 1. Clone the repository
```bash
git clone https://github.com/Kuruin/PromptRaft.git
cd PromptRaft
```

### 2. Setup the Frontend
The frontend is a modern React application built with Vite and TailwindCSS.

```bash
cd frontend
npm install
npm run dev
```

### 3. Setup the Backend
The backend powers the authentication, user management, and prompt database.

```bash
cd backend
npm install
node index.js
```

*(Optional: Use `nodemon` to automatically reload the server when you make changes during development)*
```bash
npm install -g nodemon
nodemon index.js
```

---

## 🛠️ Built With
- **Frontend**: React, TypeScript, Vite, TailwindCSS, `shadcn/ui`, React Router.
- **Backend**: Node.js, Express, MongoDB.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.

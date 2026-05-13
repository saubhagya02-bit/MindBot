import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import Layout from "./components/Layout.jsx";
import AuthPage from "./components/AuthPage.jsx";
import AuthPrompt from "./components/AuthPrompt.jsx";

function AppInner() {
  const { user, loading, guestUserId, showAuthPrompt } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center animate-pulse">
          <span className="text-white text-xl">✦</span>
        </div>
      </div>
    );
  }

  // Logged-in user
  if (user) {
    return (
      <ChatProvider userId={user.id}>
        <Layout />
      </ChatProvider>
    );
  }

  // Guest mode — can try 1 message, then auth prompt appears
  return (
    <ChatProvider userId={guestUserId}>
      <Layout />
      {showAuthPrompt && <AuthPrompt />}
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

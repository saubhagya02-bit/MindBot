import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import Layout from "./components/Layout.jsx";
import AuthPage from "./components/AuthPage.jsx";
import AuthPrompt from "./components/AuthPrompt.jsx";
import AccountSettings from "./components/AccountSettings.jsx";

function AppInner() {
  const { user, loading, guestUserId, showAuthPrompt, showAccountSettings } =
    useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center animate-pulse">
          <span className="text-white text-xl">✦</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <ChatProvider userId={user.id}>
        <Layout />
        {showAccountSettings && <AccountSettings />}
      </ChatProvider>
    );
  }

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

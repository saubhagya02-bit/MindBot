import { ChatProvider } from "./context/ChatContext.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    <ChatProvider>
      <Layout />
    </ChatProvider>
  );
}

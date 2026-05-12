import Sidebar from "./Sidebar.jsx";
import ChatArea from "./ChatArea.jsx";
import { useChat } from "../context/ChatContext.jsx";

export default function Layout() {
  const { sidebarOpen } = useChat();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-950">
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? "w-64" : "w-0"
        }`}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main chat */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <ChatArea />
      </div>
    </div>
  );
}

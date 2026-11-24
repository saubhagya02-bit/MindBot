import Message from "./Message.jsx";

export default function MessageList({ messages, isStreaming, streamingText }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
      {messages.map((msg) => (
        // clientKey keeps a bubble from remounting when its temporary id is
        // swapped for the real database id after saving
        <Message key={msg.clientKey || msg.id} message={msg} />
      ))}

      {isStreaming && (
        <Message
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingText,
            timestamp: new Date().toISOString(),
          }}
          isStreaming={!streamingText}
          isStreamingContent={!!streamingText}
        />
      )}
    </div>
  );
}

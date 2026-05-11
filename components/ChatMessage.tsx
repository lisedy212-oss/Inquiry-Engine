"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, ContentBlock } from "@/types";

interface Props { message: Message; isStreaming?: boolean; }

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
    </div>
  );
}

function MessageContent({ content }: { content: string | ContentBlock[] }) {
  if (typeof content === "string") {
    return <div className="prose-inquiry"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>;
  }
  return (
    <div className="space-y-2">
      {content.map((block, i) => {
        if (block.type === "image") return <img key={i} src={`data:${block.source.media_type};base64,${block.source.data}`} alt="Uploaded" className="max-w-full rounded-lg max-h-48 object-contain" />;
        return <div key={i} className="prose-inquiry"><ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown></div>;
      })}
    </div>
  );
}

export default function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="msg-user-row">
        <div className="msg-user-label">You</div>
        <div className="msg-user-content">
          <MessageContent content={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="msg-ai-row">
      <div className="msg-ai-header">
        <div className="msg-ai-avatar">🔍</div>
        <span className="msg-ai-name">Inquiry Engine</span>
      </div>
      <div className="msg-ai-content">
        {isStreaming && message.content === "" ? <TypingIndicator /> : (
          <>
            <MessageContent content={message.content} />
            {isStreaming && <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: "var(--primary)" }} />}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Cpu, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function StrategistChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.response || data.error || "No response received.",
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠ Communication error. Check system connection.",
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bento-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
            <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div>
            <span className="text-[0.7rem] font-mono font-bold tracking-[0.15em] uppercase text-[#e8e8e8]">
              Strategist AI
            </span>
            <p className="text-[0.6rem] font-mono text-[#555] tracking-wider">
              RANGERGPT v2 • GEMINI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isLoading ? "#f59e0b" : "#10b981",
              boxShadow: isLoading
                ? "0 0 6px rgba(245,158,11,0.4)"
                : "0 0 6px rgba(16,185,129,0.4)",
            }}
          />
          <span className="text-[0.6rem] font-mono text-[#555]">
            {isLoading ? "PROCESSING" : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#10b981] opacity-50" />
            </div>
            <div>
              <p className="text-[0.75rem] font-mono text-[#555] mb-1">
                STRATEGIST AI ONLINE
              </p>
              <p className="text-[0.65rem] font-mono text-[#444] max-w-[200px]">
                Query park conditions, trail safety, or weather advisories
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`animate-slide-in ${
              msg.role === "user" ? "ml-6" : "mr-6"
            }`}
          >
            {/* Message Header */}
            <div
              className={`flex items-center gap-1.5 mb-1 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Cpu className="w-3 h-3 text-[#10b981]" />
              )}
              <span className="text-[0.6rem] font-mono text-[#555]">
                {msg.role === "user" ? "YOU" : "RANGER"} • {msg.timestamp}
              </span>
              {msg.role === "user" && (
                <User className="w-3 h-3 text-[#707070]" />
              )}
            </div>

            {/* Message Body */}
            <div
              className={
                msg.role === "user"
                  ? "chat-message-user"
                  : "chat-message-ai"
              }
            >
              <p className="px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-[#ddd] whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mr-6 animate-slide-in">
            <div className="flex items-center gap-1.5 mb-1">
              <Cpu className="w-3 h-3 text-[#10b981]" />
              <span className="text-[0.6rem] font-mono text-[#555]">
                RANGER • ANALYZING
              </span>
            </div>
            <div className="chat-message-ai">
              <div className="px-3.5 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[#10b981] animate-spin" />
                <span className="text-[0.7rem] font-mono text-[#555]">
                  Processing intel...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] focus-within:border-[rgba(16,185,129,0.3)] transition-colors">
          <span className="text-[#10b981] font-mono text-xs font-bold">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Query the strategist..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-[0.8rem] font-mono text-[#e8e8e8] placeholder:text-[#444] disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[#10b981] hover:bg-[rgba(16,185,129,0.2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[0.55rem] font-mono text-[#444] text-center">
          ENTER to transmit • Powered by Gemini
        </p>
      </div>
    </div>
  );
}

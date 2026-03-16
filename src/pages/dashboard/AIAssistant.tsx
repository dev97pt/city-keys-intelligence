import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const suggestedQuestions = [
  "Where should I live in Lisbon?",
  "What taxes apply to foreigners in Portugal?",
  "Best neighborhoods for investment?",
  "How much does it cost to buy property?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">AI Relocation Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask anything about relocating and investing in Portugal.</p>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-border bg-card p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Bot className="h-12 w-12 text-primary/40" />
            <p className="text-sm text-muted-foreground">Ask me anything about Portugal.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === "user" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-lg bg-secondary px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.15s]" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about relocation, property, taxes…"
          disabled={isLoading}
        />
        <Button onClick={() => send(input)} disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

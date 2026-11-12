import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Square, Copy, Check, RotateCcw, Calculator, MapPin } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const STORAGE_KEY = "kttc-ai-chat";

const suggestedQuestions = [
  "Where should I live in Lisbon?",
  "What taxes apply to foreigners in Portugal?",
  "Best neighborhoods for investment?",
  "How much does it cost to buy property?",
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      aria-label="Copy answer"
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {done ? "Copied" : "Copy"}
    </button>
  );
}

const md = {
  p: (p: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...p} />,
  ul: (p: any) => <ul className="mb-2 list-disc space-y-1 pl-5" {...p} />,
  ol: (p: any) => <ol className="mb-2 list-decimal space-y-1 pl-5" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-foreground" {...p} />,
  h1: (p: any) => <h3 className="mb-2 mt-3 font-serif text-base font-semibold" {...p} />,
  h2: (p: any) => <h3 className="mb-2 mt-3 font-serif text-base font-semibold" {...p} />,
  h3: (p: any) => <h4 className="mb-1 mt-3 font-semibold" {...p} />,
  a: (p: any) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...p} />,
  code: (p: any) => <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs" {...p} />,
  pre: (p: any) => <pre className="mb-2 overflow-x-auto rounded-md bg-background/60 p-3 text-xs" {...p} />,
  table: (p: any) => <div className="mb-2 overflow-x-auto"><table className="w-full border-collapse text-xs" {...p} /></div>,
  th: (p: any) => <th className="border border-border px-2 py-1 text-left font-semibold" {...p} />,
  td: (p: any) => <td className="border border-border px-2 py-1" {...p} />,
};

function ActionCards({ text }: { text: string }) {
  const t = text.toLowerCase();
  const cards = [];
  if (/€|price|yield|rent|mortgage|roi/.test(t)) cards.push({ to: "/dashboard/calculators", icon: Calculator, label: "Analyze in Deal Calculator" });
  if (/neighbou?rhood|district|area/.test(t)) cards.push({ to: "/dashboard/neighborhood-intel", icon: MapPin, label: "Explore neighborhoods" });
  if (!cards.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {cards.map((c) => (
        <Link key={c.to} to={c.to} className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10">
          <c.icon className="h-3.5 w-3.5" /> {c.label}
        </Link>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!isLoading) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, isLoading]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  const stop = () => abortRef.current?.abort();

  const send = async (text: string, history: Msg[] = messages) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...history.filter((m) => !m.error), userMsg];
    setMessages([...history, userMsg]);
    setInput("");
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantSoFar = "";

    const upsert = (content: string) =>
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.error) return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        return [...prev, { role: "assistant", content }];
      });

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages.map(({ role, content }) => ({ role, content })) }),
      });
      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "The assistant couldn't be reached.");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content as string | undefined;
            if (content) { assistantSoFar += content; upsert(assistantSoFar); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: err.message, error: true }]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const retry = () => {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) return;
    send(messages[lastUserIdx].content, messages.slice(0, lastUserIdx));
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const streamingIdx = isLoading && messages[messages.length - 1]?.role === "assistant" ? messages.length - 1 : -1;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">AI Relocation Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ask anything about relocating and investing in Portugal.</p>
        </div>
        {messages.length > 0 && !isLoading && (
          <Button variant="outline" size="sm" onClick={() => { setMessages([]); sessionStorage.removeItem(STORAGE_KEY); }}>
            New chat
          </Button>
        )}
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Bot className="h-12 w-12 text-primary/40" />
            <p className="text-sm text-muted-foreground">Ask me anything about Portugal.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
              m.role === "user" ? "bg-primary text-primary-foreground"
              : m.error ? "border border-destructive/40 bg-destructive/10 text-foreground"
              : "bg-secondary text-foreground"}`}>
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : m.error ? (
                <div>
                  <p className="font-medium">Something went wrong</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.content}</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Try again
                  </Button>
                </div>
              ) : (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{m.content}</ReactMarkdown>
                  {i === streamingIdx && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" aria-hidden />}
                  {i !== streamingIdx && (
                    <>
                      <ActionCards text={m.content} />
                      <div className="mt-2"><CopyButton text={m.content} /></div>
                    </>
                  )}
                </>
              )}
            </div>
            {m.role === "user" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && streamingIdx === -1 && (
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

      {!isLoading && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {suggestedQuestions.map((q) => (
            <button key={q} onClick={() => send(q)}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-end gap-2">
        <Textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about relocation, property, taxes…  (Shift+Enter for a new line)"
          className="min-h-[44px] resize-none"
        />
        {isLoading ? (
          <Button onClick={stop} variant="outline" aria-label="Stop generating" className="h-11">
            <Square className="mr-1.5 h-3.5 w-3.5 fill-current" /> Stop
          </Button>
        ) : (
          <Button onClick={() => send(input)} disabled={!input.trim()} aria-label="Send" className="h-11">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

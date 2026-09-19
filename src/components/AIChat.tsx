import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Bot } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { SuggestedPrompt } from "@/components/SuggestedPrompt";
import { ConversationList } from "@/components/ConversationList";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import { sendCoachMessage, SUGGESTED_QUESTIONS } from "@/services/aiCoachService";
import type { ChatMessageData, AiCoachResponse, ExplainRequest } from "@/services/aiCoachService";

interface DisplayMessage extends ChatMessageData {
  recommendedLesson?: AiCoachResponse["recommendedLesson"];
  recommendedTool?: AiCoachResponse["recommendedTool"];
  usedPersonalContext?: boolean;
}

interface AIChatProps {
  initialExplain?: ExplainRequest;
  initialPrompt?: string;
}

const MAX_MESSAGE_LENGTH = 1000;
/** How many recent turns are sent back to the backend for context — never the entire conversation. */
const MAX_HISTORY_SENT = 10;

export function AIChat({ initialExplain, initialPrompt }: AIChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const send = async (text: string, explain?: ExplainRequest) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      showToast(`Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`, "error");
      return;
    }

    const userMessage: DisplayMessage = { role: "user", content: trimmed };
    const historyToSend = messages.slice(-MAX_HISTORY_SENT).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendCoachMessage(trimmed, historyToSend, explain);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          recommendedLesson: response.recommendedLesson,
          recommendedTool: response.recommendedTool,
          usedPersonalContext: response.usedPersonalContext,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt, initialExplain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleClear = () => setMessages([]);

  return (
    <div className="flex h-[80vh] flex-col overflow-hidden rounded-2xl border border-base-border bg-base-surface/60 sm:h-[70vh]">
      <div className="flex items-center justify-between border-b border-base-border px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Bot className="h-4 w-4 text-accent-secondary" />
          <span className="hidden sm:inline">AI Security Coach</span>
          <span className="sm:hidden">AI Coach</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={handleClear}
          disabled={messages.length === 0}
        >
          <span className="hidden sm:inline">Clear conversation</span>
          <span className="sm:hidden">Clear</span>
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation with the AI Security Coach"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div>
              <p className="text-sm font-medium text-ink">Ask me anything about your security results.</p>
              <p className="mt-1 text-xs text-ink-faint">
                I'm an educational assistant, not a substitute for a professional cybersecurity consultation.
              </p>
            </div>
            <div className="w-full max-w-md">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Quick Actions</p>
              <ConversationList onSelect={(prompt) => send(prompt)} disabled={isSending} />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <SuggestedPrompt key={q} text={q} onClick={(t) => send(t)} disabled={isSending} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role}
                content={m.content}
                usedPersonalContext={m.usedPersonalContext}
                recommendedLesson={m.recommendedLesson}
                recommendedTool={m.recommendedTool}
              />
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-ink-faint" aria-label="AI Security Coach is typing">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-secondary [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-secondary [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-secondary" />
                </span>
                Thinking...
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-base-border p-3"
      >
        <label htmlFor="ai-coach-input" className="sr-only">
          Message the AI Security Coach
        </label>
        <input
          id="ai-coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your security results..."
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isSending}
          className="flex-1 rounded-xl border border-base-border bg-base-elevated/40 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-60"
        />
        <Button type="submit" size="md" isLoading={isSending} disabled={!input.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

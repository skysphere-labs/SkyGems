import { useCallback, useRef, useState } from "react";
import {
  Bot,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  FileText,
  Minimize2,
  Zap,
} from "lucide-react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@skygems/ui";

import { postCopilotMessage, type CopilotResponse } from "../contracts/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedAction?: CopilotResponse["suggestedAction"];
  intent?: CopilotResponse["intent"];
}

interface CopilotPanelProps {
  designId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefineRequest?: (instruction: string) => void;
  onSpecRequest?: () => void;
}

const QUICK_ACTIONS = [
  { label: "Explain Design", icon: MessageSquare, message: "Explain this design to me" },
  { label: "Suggest Improvements", icon: Lightbulb, message: "Suggest improvements for this design" },
  { label: "Generate Spec", icon: FileText, message: "Generate a specification for this design" },
  { label: "Simplify", icon: Minimize2, message: "Simplify this design while keeping its essence" },
] as const;

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `msg-${Date.now()}-${messageIdCounter}`;
}

export function CopilotPanel({
  designId,
  open,
  onOpenChange,
  onRefineRequest,
  onSpecRequest,
}: CopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;

      const userMessage: ChatMessage = {
        id: nextMessageId(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsSending(true);
      scrollToBottom();

      try {
        const response = await postCopilotMessage(designId, text.trim());

        const assistantMessage: ChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          content: response.response,
          suggestedAction: response.suggestedAction,
          intent: response.intent,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          content:
            "I wasn't able to process that request right now. Please try again in a moment.",
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
        scrollToBottom();
      }
    },
    [designId, isSending, scrollToBottom],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage],
  );

  const handleApplyAction = useCallback(
    (action: CopilotResponse["suggestedAction"]) => {
      if (!action) return;

      if (action.type === "refine" && action.instruction && onRefineRequest) {
        onRefineRequest(action.instruction);
      } else if (action.type === "spec" && onSpecRequest) {
        onSpecRequest();
      }
    },
    [onRefineRequest, onSpecRequest],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-white/6 bg-[var(--bg-secondary)] sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-[var(--accent-gold)]" />
            AI Design Assistant
          </SheetTitle>
          <SheetDescription>
            Ask questions about your design, request changes, or get
            improvement suggestions.
          </SheetDescription>
        </SheetHeader>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 px-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={isSending}
              onClick={() => sendMessage(action.message)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(212,175,55,0.08)] hover:text-[var(--accent-gold)] disabled:opacity-50"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "var(--text-secondary)",
              }}
            >
              <action.icon className="size-3" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-2"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Bot
                className="size-10"
                style={{ color: "rgba(212,175,55,0.3)" }}
              />
              <p className="text-sm text-[var(--text-secondary)]">
                Start a conversation about your design. Try the quick actions
                above or type your own message.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          backgroundColor: "rgba(212,175,55,0.12)",
                          borderColor: "rgba(212,175,55,0.2)",
                          border: "1px solid rgba(212,175,55,0.2)",
                          color: "var(--text-primary)",
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "var(--text-primary)",
                        }
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="space-y-2">
                      <div className="whitespace-pre-wrap">{formatResponse(msg.content)}</div>
                      {msg.suggestedAction ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-[rgba(212,175,55,0.3)] text-[var(--accent-gold)] hover:bg-[rgba(212,175,55,0.1)]"
                          onClick={() => handleApplyAction(msg.suggestedAction)}
                        >
                          <Zap className="size-3" />
                          Apply{" "}
                          {msg.suggestedAction.type === "refine"
                            ? "Refinement"
                            : msg.suggestedAction.type === "spec"
                              ? "Spec Generation"
                              : "Action"}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          {isSending ? (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent-gold)]" />
                  <span
                    className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent-gold)]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent-gold)]"
                    style={{ animationDelay: "300ms" }}
                  />
                  Thinking...
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/6 px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your design..."
              rows={2}
              disabled={isSending}
              className="flex-1 resize-none text-sm leading-relaxed"
            />
            <Button
              size="sm"
              disabled={isSending || !inputValue.trim()}
              onClick={() => sendMessage(inputValue)}
              className="shrink-0"
              style={{
                backgroundColor: inputValue.trim()
                  ? "var(--accent-gold)"
                  : undefined,
                color: inputValue.trim() ? "#000" : undefined,
              }}
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--text-secondary)] opacity-60">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Light markdown-like formatter for bold (**text**) and newlines. */
function formatResponse(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--accent-gold)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

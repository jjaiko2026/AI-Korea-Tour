"use client";

/**
 * PRD §6.4 챗봇 — 자연어로 파악한 조건을 updateTripDraft 도구 호출로 폼에 반영한다.
 * AI SDK v5+ UIMessage의 tool part는 `tool-<name>` 타입 판별자와 state('output-available'
 * 등)를 가진다.
 */
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import type { TripRequestDraft } from "./trip-request-form";

type UpdateTripDraftOutput = Partial<TripRequestDraft>;

export function ChatPanel({ onDraftUpdate }: { onDraftUpdate: (patch: UpdateTripDraftOutput) => void }) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const appliedToolCallIds = useRef(new Set<string>());

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts ?? []) {
        if (part.type !== "tool-updateTripDraft") continue;
        if (part.state !== "output-available") continue;
        const callId = "toolCallId" in part ? String(part.toolCallId) : undefined;
        if (!callId || appliedToolCallIds.current.has(callId)) continue;
        appliedToolCallIds.current.add(callId);
        onDraftUpdate(part.output as UpdateTripDraftOutput);
      }
    }
  }, [messages, onDraftUpdate]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            예: &ldquo;제주도로 부모님 모시고 3박4일, 자연이랑 맛집 위주로 가고 싶어요&rdquo;
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            <p
              className={
                message.role === "user"
                  ? "inline-block rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                  : "inline-block rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
              }
            >
              {message.parts?.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null,
              )}
            </p>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여행 조건을 자유롭게 말해보세요"
        />
        <Button type="submit" disabled={status === "streaming"}>
          전송
        </Button>
      </form>
    </div>
  );
}

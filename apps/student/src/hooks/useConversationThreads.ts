import { useMemo } from "react";
import type { Message } from "@/types";

export interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
}

export interface ConversationThread {
  participant: ConversationParticipant;
  messages: Message[];
  unreadCount: number;
}

/**
 * Groups messages by participant and sorts threads by the most recent activity.
 */
export function useConversationThreads(
  messages: Message[],
  userId?: string,
  activeConversationId?: string,
) {
  const threadsMap = useMemo(() => {
    const map = new Map<string, ConversationThread>();
    if (!userId) return map;

    for (const message of messages) {
      const isOutgoing = message.sender_id === userId;
      const participantId = isOutgoing
        ? message.receiver_id
        : message.sender_id;
      const profile = isOutgoing ? message.receiver : message.sender;

      if (!profile) continue;

      let thread = map.get(participantId);
      if (!thread) {
        thread = {
          participant: {
            id: participantId,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email ?? null,
          },
          messages: [],
          unreadCount: 0,
        };
        map.set(participantId, thread);
      }

      thread.messages.push(message);
      if (!isOutgoing && !message.is_read) {
        thread.unreadCount += 1;
      }
    }

    return map;
  }, [messages, userId]);

  const conversationThreads = useMemo(() => {
    return Array.from(threadsMap.values()).sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1]?.created_at || "";
      const lastB = b.messages[b.messages.length - 1]?.created_at || "";
      return lastB.localeCompare(lastA);
    });
  }, [threadsMap]);

  const currentConversationMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return threadsMap.get(activeConversationId)?.messages || [];
  }, [activeConversationId, threadsMap]);

  return {
    conversationThreads,
    currentConversationMessages,
    threadsMap,
  };
}

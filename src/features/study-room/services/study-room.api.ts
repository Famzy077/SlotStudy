import { apiClient } from '@/shared/services/api.client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  StudySession,
  StudyMessage,
  CreateStudySessionDTO,
  SendStudyMessageDTO,
} from '../types/study-room.types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://slotstudy.onrender.com/api/v1';

export const studyRoomApi = {
  createSession: (data: CreateStudySessionDTO) =>
    apiClient.post<StudySession>('/study-sessions', data),

  getSessions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{
      sessions: StudySession[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/study-sessions', { params }),

  getSession: (id: string) =>
    apiClient.get<StudySession>(`/study-sessions/${id}`),

  deleteSession: (id: string) =>
    apiClient.delete<{ id: string }>(`/study-sessions/${id}`),

  sendMessage: (sessionId: string, data: SendStudyMessageDTO) =>
    apiClient.post<{
      userMessage: StudyMessage;
      assistantMessage: StudyMessage;
    }>(`/study-sessions/${sessionId}/messages`, data),

  /**
   * Streams response chunks via SSE endpoint with graceful fallback to standard POST.
   */
  streamMessage: async (
    sessionId: string,
    data: SendStudyMessageDTO,
    callbacks: {
      onUserMessage?: (msg: StudyMessage) => void;
      onSources?: (sources: any[]) => void;
      onChunk?: (chunk: string) => void;
      onDone?: (msg: StudyMessage) => void;
      onError?: (err: Error) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = useAuthStore.getState().token;
    const url = `${BASE_URL}/study-sessions/${sessionId}/messages/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to non-streaming if body reader is unavailable
        const res = await studyRoomApi.sendMessage(sessionId, data);
        if (res.data?.userMessage) callbacks.onUserMessage?.(res.data.userMessage);
        if (res.data?.assistantMessage?.sources)
          callbacks.onSources?.(res.data.assistantMessage.sources);
        if (res.data?.assistantMessage)
          callbacks.onDone?.(res.data.assistantMessage);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          await reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payloadStr = trimmed.replace(/^data:\s*/, '').trim();
          if (!payloadStr) continue;

          try {
            const event = JSON.parse(payloadStr);
            if (event.type === 'user_message') {
              callbacks.onUserMessage?.(event.data);
            } else if (event.type === 'sources') {
              callbacks.onSources?.(event.data);
            } else if (event.type === 'chunk') {
              callbacks.onChunk?.(event.data);
            } else if (event.type === 'done') {
              callbacks.onDone?.(event.data);
            } else if (event.type === 'error') {
              callbacks.onError?.(new Error(event.data));
            }
          } catch {
            // Non-JSON line or heartbeat
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) return;
      // If streaming fetch fails, attempt standard non-streaming POST as fallback
      try {
        const fallbackRes = await studyRoomApi.sendMessage(sessionId, data);
        if (fallbackRes.data?.userMessage)
          callbacks.onUserMessage?.(fallbackRes.data.userMessage);
        if (fallbackRes.data?.assistantMessage?.sources)
          callbacks.onSources?.(fallbackRes.data.assistantMessage.sources);
        if (fallbackRes.data?.assistantMessage)
          callbacks.onDone?.(fallbackRes.data.assistantMessage);
      } catch (fallbackErr) {
        callbacks.onError?.(
          fallbackErr instanceof Error
            ? fallbackErr
            : new Error('Failed to send message'),
        );
      }
    }
  },
};

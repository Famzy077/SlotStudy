import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyRoomApi } from '../services/study-room.api';
import {
  CreateStudySessionDTO,
  SendStudyMessageDTO,
} from '../types/study-room.types';

export const useStudySessions = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['studySessions', params],
    queryFn: () => studyRoomApi.getSessions(params),
  });
};

export const useStudySession = (id: string) => {
  return useQuery({
    queryKey: ['studySession', id],
    queryFn: () => studyRoomApi.getSession(id),
    enabled: Boolean(id),
  });
};

export const useCreateStudySession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudySessionDTO) =>
      studyRoomApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    },
  });
};

export const useDeleteStudySession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studyRoomApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    },
  });
};

export const useSendStudyMessage = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendStudyMessageDTO) =>
      studyRoomApi.sendMessage(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    },
  });
};

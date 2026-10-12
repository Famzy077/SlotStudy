export interface SourceCitation {
  materialId: string;
  materialTitle: string;
  pageNumber?: number;
  chunkIndex: number;
  excerpt: string;
}

export type StudyMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type StudyMessageStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type StudyInputMode = 'TEXT' | 'VOICE';

export interface StudyMessage {
  id: string;
  sessionId: string;
  role: StudyMessageRole;
  content: string;
  sources?: SourceCitation[] | null;
  status: StudyMessageStatus;
  inputMode: StudyInputMode;
  createdAt: string;
}

export interface StudySessionMaterialItem {
  id?: string;
  sessionId?: string;
  materialId?: string;
  material: {
    id: string;
    fileName: string;
    fileType: string;
    status: string;
  };
}

export interface StudySession {
  id: string;
  title: string | null;
  userId: string;
  courseId: string | null;
  course?: {
    id: string;
    title: string;
    subject: string;
  } | null;
  materials: StudySessionMaterialItem[];
  messages?: StudyMessage[];
  _count?: {
    messages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudySessionDTO {
  title?: string;
  courseId?: string;
  materialIds: string[];
}

export interface SendStudyMessageDTO {
  content: string;
  inputMode?: StudyInputMode;
}

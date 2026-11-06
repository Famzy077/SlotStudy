export interface GoogleAuthRequest {
  idToken: string;
  termsAccepted?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    username?: string | null;
    avatarUrl: string | null;
    university: string | null;
    program: string | null;
    yearOfStudy: number | null;
    onboardingCompleted: boolean;
    academicSetupCompleted: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface AcademicSetupRequest {
  institutionId: string;
  programId: string;
  yearOfStudy: number;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
}

export interface Program {
  id: string;
  name: string;
  duration: number;
}

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
}

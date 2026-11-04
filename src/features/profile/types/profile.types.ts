export interface Profile {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  avatarUrl: string | null;
  university: string;
  program: string;
  yearOfStudy: number;
  joinedAt: string;
  stats: {
    totalCourses: number;
    totalQuizzes: number;
    currentStreak: number;
    totalXp: number;
    level: number;
    studyHours: number | string;
    studyHoursDecimal?: number;
    studyTimeSeconds?: number;
  };
  subscription: {
    plan: "free" | "pro";
    expiresAt: string | null;
  };
}

export interface UpdateProfileDTO {
  name?: string;
  username?: string | null;
  university?: string;
  program?: string;
  yearOfStudy?: number;
}

export interface ParentReportItem {
  studentName: string;
  language: string;
  courseName: string;
  level: string;
  enrollmentStatus: string;
  enrollmentDate: string;
  levelResult: string | null;
  totalAttendances: number;
  absences: number;
  absencePercentage: number;
  averageScore: number | null;
}

export interface ParentReport {
  status: 'OK' | 'NO_RECORDS' | 'NO_LINK' | string;
  message: string;
  items: ParentReportItem[];
}

export interface GroupSummary {
  status: 'OK' | 'INSUFFICIENT_DATA' | string;
  message: string;
  sectionId: number | null;
  groupCode: string | null;
  courseName: string | null;
  language: string | null;
  level: string | null;
  totalEnrollments: number;
  activeEnrollments: number;
  attendanceRate: number;
  averageScore: number | null;
  observations: string[];
}

export interface ChatResponse {
  message: string;
  data: unknown;
  action: string | null;
}

export interface ParentReportItem {
  studentName: string;
  language: string;
  courseName: string;
  level: string;
  enrollmentStatus: string;
  enrollmentDate: string;
  levelResult: string | null;
  totalAttendances: number;
  absences: number;
  absencePercentage: number;
  averageScore: number | null;
}

export interface ParentReport {
  status: 'OK' | 'NO_RECORDS' | 'NO_LINK' | string;
  message: string;
  items: ParentReportItem[];
}

export interface GroupSummary {
  status: 'OK' | 'INSUFFICIENT_DATA' | string;
  message: string;
  sectionId: number | null;
  groupCode: string | null;
  courseName: string | null;
  language: string | null;
  level: string | null;
  totalEnrollments: number;
  activeEnrollments: number;
  attendanceRate: number;
  averageScore: number | null;
  observations: string[];
}

// NUEVO: US26
export interface SectionSummary {
  id: number;
  groupCode: string;
  courseName: string;
  courseLevel: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  availableVacancies: number;
}

// NUEVO: US27
export interface CourseRecommendation {
  language: string;
  status: 'OK' | 'COMPLETED' | 'INSUFFICIENT_DATA' | string;
  currentLevel: string | null;
  nextCourseName: string | null;
  nextCourseLevel: string | null;
  message: string | null;
}

// NUEVO: US29
export interface EnrollResult {
  status: 'CONFIRMATION_REQUIRED' | 'ENROLLED' | 'REJECTED' | 'NOT_FOUND' | 'NO_VACANCIES' | string;
  message?: string;
  sectionId?: number;
  groupCode?: string;
  course?: string;
  level?: string;
  schedule?: string;
  vacancies?: number;
}

export interface ChatResponse {
  message: string;
  data: unknown;
  action: string | null;
}
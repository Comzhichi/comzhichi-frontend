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
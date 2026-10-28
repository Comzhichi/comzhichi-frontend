export interface Attendance {
  id: number;
  enrollmentId: number;
  studentFullName: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
  observation: string;
}

export interface Evaluation {
  id: number;
  enrollmentId: number;
  studentFullName: string;
  type: 'PARTIAL' | 'FINAL';
  date: string;
  score: number;
  feedback: string;
}

export interface AcademicObservation {
  id: number;
  enrollmentId: number;
  date: string;
  observation: string;
}

export interface LevelEvaluation {
  id: number;
  enrollmentId: number;
  studentFullName: string;
  courseName: string;
  language: string;
  date: string;
  result: 'APPROVED' | 'FAILED';
  comments: string;
}
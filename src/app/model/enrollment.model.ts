export interface Enrollment {
  id: number;
  studentId: number;
  studentFullName: string;
  studentEmail: string;
  sectionId: number;
  sectionGroupCode: string;
  courseName: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'APPROVED' | 'DROPPED' | 'FAILED';
}
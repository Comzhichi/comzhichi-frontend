export interface Section {
  id: number;
  groupCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  totalVacancies: number;
  availableVacancies: number;
  courseId: number;
  courseName: string;
  language?: string;
  courseDescription?: string;
  courseLevel?: string;
  teacherId: number;
  teacherName?: string;
  teacherSpecialty: string;
}

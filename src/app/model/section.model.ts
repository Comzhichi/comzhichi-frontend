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
  teacherId: number;
  teacherSpecialty: string;
}
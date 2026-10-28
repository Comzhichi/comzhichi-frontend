export interface Course {
  id: number;
  name: string;
  language: string;
  level: string;
  description: string;
  coordinatorId: number;
  coordinatorDepartment?: string;
  prerequisiteId: number | null;
  prerequisiteName: string | null;
}

export interface CourseRequest {
  name: string;
  language: string;
  level: string;
  description: string;
  coordinatorId: number;
  prerequisiteId: number | null;
}
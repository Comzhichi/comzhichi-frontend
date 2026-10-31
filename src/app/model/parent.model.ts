export interface Parent {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  phoneContact: string;
}

export interface StudentParentLink {
  id: number;
  studentId: number;
  studentFullName: string;
  studentEmail: string;
  parentId: number;
  parentFullName: string;
  parentEmail: string;
  parentPhoneContact: string;
  relationship: string;
  canEnroll: boolean;
}

export interface AppNotification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

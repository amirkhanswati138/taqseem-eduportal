// ==================== STUDENT ====================
export interface Student {
  username: string;
  password?: string;
  name: string;
  rollNo: string;
  className: string;
  course?: string;
  fatherName?: string;
  active: boolean;
}
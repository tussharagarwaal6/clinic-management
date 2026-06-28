export interface Me {
  username: string;
  is_staff: boolean;
  role: 'admin' | 'doctor' | 'unknown';
  doctor_id: number | null;
  doctor_name: string | null;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  username?: string;
  generated_password?: string | null;
}

export interface Patient {
  id: number;
  uhid: string;
  name: string;
  email: string;
  phone: string;
}

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: number;
  doctor: number;
  doctor_name: string;
  patient: string;
  patient_name: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  duration_minutes: number;
  created_at: string;
}

export interface DashboardStats {
  doctors: number;
  patients: number;
  appointments_total: number;
  appointments_scheduled: number;
  appointments_completed: number;
  appointments_cancelled: number;
}

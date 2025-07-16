import { User } from "../../user/models/user";

export interface MedicalRecord {
  id: number;
  medical_file_id: number;
  temperature: number;
  blood_pressure: number;
  oxygen_saturation: number;
  heart_rate: number;
  created_at: Date;
  updated_at: Date;
  // Puedes agregar riesgos aquí si lo necesitas
}

export interface MedicalFile {
  id: number;
  patient_id: number;
  doctor_id?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  patient?: User;
  doctor?: User;
  records: MedicalRecord[];
}
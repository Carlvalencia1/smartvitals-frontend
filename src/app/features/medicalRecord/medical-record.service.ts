import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { MedicalFile, MedicalRecord } from './models/record';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecordWithRisks } from './models/record-with-risks';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private apiUrl = environment.API_URL;

  constructor(private authService: AuthService, private http: HttpClient) { }

  // Obtener todos los expedientes de un paciente
  getPatientMedicalFiles(patient_id: number) {
    return this.http.get<MedicalFile[]>(`${this.apiUrl}/patients/${patient_id}/medicalFiles`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Obtener todos los expedientes de un doctor (si aplica)
  getDoctorMedicalFiles(doctor_id: number) {
    return this.http.get<MedicalFile[]>(`${this.apiUrl}/doctors/${doctor_id}/medicalFiles`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Obtener los registros de un expediente específico
  getMedicalFileRecords(file_id: number) {
    return this.http.get<MedicalFile>(`${this.apiUrl}/medicalFiles/${file_id}/records`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Crear un nuevo expediente
  createMedicalFile(data: Partial<MedicalFile>) {
    return this.http.post<MedicalFile>(`${this.apiUrl}/medicalFiles`, data, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Crear un nuevo registro médico en un expediente
  createMedicalRecord(data: Partial<MedicalRecord>) {
    return this.http.post<MedicalRecord>(`${this.apiUrl}/medicalRecords`, data, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Actualizar un expediente
  updateMedicalFile(file_id: number, data: Partial<MedicalFile>) {
    return this.http.put<MedicalFile>(`${this.apiUrl}/medicalFiles/${file_id}`, data, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Actualizar un registro médico
  updateMedicalRecord(record_id: number, data: Partial<MedicalRecord>) {
    return this.http.put<MedicalRecord>(`${this.apiUrl}/medicalRecords/${record_id}`, data, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Eliminar un registro médico
  deleteMedicalRecord(record_id: number) {
    return this.http.delete(`${this.apiUrl}/medicalRecords/${record_id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }
}

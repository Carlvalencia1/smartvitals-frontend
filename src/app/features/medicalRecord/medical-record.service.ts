import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Record } from './models/record';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RecordWithRisks } from './models/record-with-risks';
import { PatientStadistics } from './models/patient-stadistics';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private apiUrl = environment.API_URL;

  constructor(private authService: AuthService, private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 404) {
      return of([]);
    }
    return throwError(() => error);
  }

  getDoctorMedicalRecords(doctor_id: number): Observable<Record[]> {
    return this.http.get<Record[]>(`${this.apiUrl}/doctors/${doctor_id}/medicalRecords`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getPatientMedicalRecords(patient_id: number): Observable<Record[]> {
    return this.http.get<Record[]>(`${this.apiUrl}/patients/${patient_id}/medicalRecords`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getPatientMedicalRecordsByRange(patient_id: number, startDate: string, endDate: string): Observable<Record[]> {
    return this.http.get<Record[]>(`${this.apiUrl}/patients/${patient_id}/medicalRecords/range`, {
      params: {
        start_date: startDate,
        end_date: endDate
      },
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getDoctorMedicalRecordsByRange(doctor_id: number, startDate: string, endDate: string): Observable<Record[]> {
    return this.http.get<Record[]>(`${this.apiUrl}/doctors/${doctor_id}/medicalRecords/range`, {
      params: {
        startDate: startDate,
        endDate: endDate
      },
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getDoctorStatistics(doctor_id: number): Observable<PatientStadistics> {
    return this.http.get<PatientStadistics>(`${this.apiUrl}/stadistics/${doctor_id}/patients`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getPatientStatistics(patient_id: number): Observable<PatientStadistics> {
    return this.http.get<PatientStadistics>(`${this.apiUrl}/stadistics/${patient_id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getDoctorStatisticsByRange(doctor_id: number, startDate: string, endDate: string): Observable<PatientStadistics> {
    return this.http.get<PatientStadistics>(`${this.apiUrl}/stadistics/${doctor_id}/patients/range`, {
      params: {
        start_date: startDate,
        end_date: endDate
      },
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getPatientStatisticsByRange(patient_id: number, startDate: string, endDate: string): Observable<PatientStadistics> {
    return this.http.get<PatientStadistics>(`${this.apiUrl}/stadistics/${patient_id}/range`, {
      params: {
        start_date: startDate,
        end_date: endDate
      },
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getMedicalRecordWithRisks(id: number): Observable<RecordWithRisks> {
    return this.http.get<RecordWithRisks>(`${this.apiUrl}/medicalRecords/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  updateMedicalRecord(recordId: number, updateData: {
    patient_id: number;
    doctor_id: number | null;
    temperature: number;
    blood_pressure: number;
    oxygen_saturation: number;
    heart_rate: number;
    diagnosis: string;
    treatment: string;
    notes: string;
  }): Observable<Record> {
    return this.http.put<Record>(`${this.apiUrl}/medicalRecords/${recordId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

}

import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { User } from '../../../features/user/models/user';
import { AuthService } from '../../../auth/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MedicalFile } from '../../../features/medicalRecord/models/record';
import { MedicalRecordService } from '../../../features/medicalRecord/medical-record.service';
import { UserService } from '../../../features/user/user.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    InputTextModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    RouterModule
  ],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.css'
})
export class MedicalRecordsComponent implements OnInit {
  currentUser!: User;
  patients: User[] = [];
  files: MedicalFile[] = [];
  filteredFiles: MedicalFile[] = [];
  rangeDates: Date[] | undefined;
  selectedPatient: User | undefined;
  recordNumber: string = '';
  patientOptions: any[] = [];

  constructor(
    private authService: AuthService,
    private recordService: MedicalRecordService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    if (this.authService.getUser()) {
      this.currentUser = this.authService.getUser() as User;
    }
    this.getFiles();
    if (this.currentUser.role === 'doctor') {
      this.loadPatients();
    }
  }

  loadPatients(): void {
    if (!this.currentUser.id) {
      console.error('Doctor ID is not available');
      return;
    }
    this.userService.getPatients(this.currentUser.id).subscribe({
      next: (data) => {
        this.patients = data;
        this.patientOptions = data.map(patient => ({
          label: `${patient.name} ${patient.lastname}`,
          value: patient
        }));
      },
      error: (error) => {
        console.error('Error fetching patients:', error);
      }
    });
  }

  getFiles(): void {
    if (!this.currentUser.id) {
      console.error('User ID is not available');
      return;
    }
    if (this.currentUser.role === 'doctor') {
      this.recordService.getDoctorMedicalFiles(this.currentUser.id).subscribe({
        next: (data) => {
          this.files = data;
          this.filteredFiles = data;
        },
        error: (error) => {
          console.error('Error fetching doctor medical files:', error);
        }
      });
    } else if (this.currentUser.role === 'patient') {
      this.recordService.getPatientMedicalFiles(this.currentUser.id).subscribe({
        next: (data) => {
          this.files = data;
          this.filteredFiles = data;
        },
        error: (error) => {
          console.error('Error fetching patient medical files:', error);
        }
      });
    }
  }

  applyFilters(): void {
    let files = [...this.files];
    // Filtrar por paciente (solo para doctor)
    if (this.currentUser.role === 'doctor' && this.selectedPatient) {
      files = files.filter(file => file.patient_id === this.selectedPatient!.id);
    }
    // Filtrar por rango de fechas
    if (this.rangeDates && this.rangeDates.length > 0 && this.rangeDates[0]) {
      const start = this.rangeDates[0];
      const end = this.rangeDates[1] ? this.rangeDates[1] : this.rangeDates[0];
      files = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate >= start && fileDate <= end;
      });
    }
    // Filtrar por número de expediente
    if (this.recordNumber) {
      files = files.filter(file => file.id.toString().includes(this.recordNumber));
    }
    this.filteredFiles = files;
  }
}
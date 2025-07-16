import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardModule } from 'primeng/card';
import { MedicalRecordService } from '../../../features/medicalRecord/medical-record.service';
import { RecordWithRisks } from '../../../features/medicalRecord/models/record-with-risks';
import { MedicalFile } from '../../../features/medicalRecord/models/record';

@Component({
  selector: 'app-record',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CardModule],
  templateUrl: './record.component.html',
  styleUrl: './record.component.css'
})
export class RecordComponent implements OnInit {
  file?: MedicalFile;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private recordService: MedicalRecordService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de expediente no válido';
      this.loading = false;
      return;
    }
    this.recordService.getMedicalFileRecords(id).subscribe({
      next: (data: MedicalFile) => {
        this.file = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el expediente';
        this.loading = false;
      }
    });
  }
}

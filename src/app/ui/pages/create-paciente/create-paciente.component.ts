import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { User } from '../../../features/user/models/user';

@Component({
  selector: 'app-create-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './create-paciente.component.html',
  styleUrls: ['./create-paciente.component.css']
})
export class CreatePacienteComponent implements OnInit {
  usuarios: User[] = [];
  imagenPrevia: string = 'assets/avatar.png';
  archivoSeleccionado: File | null = null;

  nuevoPaciente: User = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    profile_picture: '',
    role: 'patient',
    age: 0
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerPacientesDesdeAPI();
  }

  obtenerPacientesDesdeAPI() {
    this.http.get<User[]>(`${environment.API_URL}/users`).subscribe({
      next: (data) => {
        this.usuarios = data.filter(u => u.role === 'patient');
      },
      error: (err) => {
        console.error('Error al obtener usuarios', err);
      }
    });
  }

  agregarPaciente() {
    const formData = new FormData();
    formData.append('name', this.nuevoPaciente.name);
    formData.append('lastname', this.nuevoPaciente.lastname);
    formData.append('email', this.nuevoPaciente.email);
    formData.append('password', this.nuevoPaciente.password);
    formData.append('role', this.nuevoPaciente.role);
    formData.append('age', this.nuevoPaciente.age.toString());

    if (this.archivoSeleccionado) {
      formData.append('profile_picture', this.archivoSeleccionado);
    }

    this.http.post<User>(`${environment.API_URL}/users`, formData).subscribe({
      next: () => {
        alert('Paciente creado correctamente');
        this.resetForm();
        this.obtenerPacientesDesdeAPI();
      },
      error: (err) => {
        console.error('Error al registrar paciente', err);
        alert('No se pudo registrar el paciente');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.archivoSeleccionado = file;

    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      if (preview.startsWith('data:image')) {
        this.imagenPrevia = preview;
      }
    };
    reader.readAsDataURL(file);
  }

  resetForm() {
    this.nuevoPaciente = {
      name: '',
      lastname: '',
      email: '',
      password: '',
      profile_picture: '',
      role: 'patient',
      age: 0
    };
    this.imagenPrevia = 'assets/avatar.png';
    this.archivoSeleccionado = null;
  }
}

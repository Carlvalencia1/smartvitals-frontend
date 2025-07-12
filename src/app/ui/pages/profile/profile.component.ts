import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { User } from '../../../features/user/models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    DropdownModule,
    AvatarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  profileImageUrl: string = '';
  
  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Paciente', value: 'patient' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  loadUserData() {
    // Simular carga de datos del usuario
    // En una aplicación real, esto vendría de un servicio
    this.currentUser = {
      id: 1,
      name: 'Juan',
      lastname: 'Pérez',
      email: 'juan.perez@example.com',
      password: '',
      profile_picture: '/assets/default-avatar.png',
      role: 'patient'
    };

    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        lastname: this.currentUser.lastname,
        email: this.currentUser.email,
        role: this.currentUser.role
      });
      this.profileImageUrl = this.currentUser.profile_picture;
    }
  }

  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Imagen seleccionada',
        detail: 'La imagen se ha cargado correctamente'
      });
    }
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const formData = this.profileForm.value;
      const updatedUser: User = {
        ...this.currentUser,
        ...formData,
        profile_picture: this.profileImageUrl
      };

      // Aquí iría la lógica para actualizar el usuario en el backend
      console.log('Usuario actualizado:', updatedUser);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Perfil actualizado',
        detail: 'Los datos se han guardado correctamente'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa todos los campos requeridos'
      });
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}
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
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { User } from '../../../features/user/models/user';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../features/user/user.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

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
    ToastModule,
    CheckboxModule,
    InputNumberModule,
    PasswordModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  profileImageUrl: string = '';
  selectedFile: File | null = null;
  isLoading: boolean = false;

  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Paciente', value: 'patient' }
  ];

  genderOptions = [
    { label: 'Masculino', value: 'male' },
    { label: 'Femenino', value: 'female' },
    { label: 'Otro', value: 'other' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      gender: [''],
      age: [null, [Validators.min(1), Validators.max(120)]],
      pregnant: [false],
      password: ['', [Validators.minLength(6)]]
    });

    // Escuchar cambios en el género para controlar el campo de embarazo
    this.profileForm.get('gender')?.valueChanges.subscribe(gender => {
      const pregnantControl = this.profileForm.get('pregnant');
      if (gender !== 'female') {
        pregnantControl?.setValue(false);
        pregnantControl?.disable();
      } else {
        pregnantControl?.enable();
      }
    });
  }

  loadUserData() {
    // Obtener datos del usuario actual desde el AuthService
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name || '',
        lastname: this.currentUser.lastname || '',
        email: this.currentUser.email || '',
        role: this.currentUser.role || '',
        gender: this.currentUser.gender || '',
        age: this.currentUser.age || null,
        pregnant: this.currentUser.pregnant || false
      });
      this.profileImageUrl = this.currentUser.profile_picture || '';
    } else {
      // Fallback: cargar datos básicos del AuthService
      const userData = this.authService.getUser();
      if (userData && userData.id) {
        this.userService.getUser(userData.id).subscribe({
          next: (data: User) => {
            this.currentUser = data;
            this.authService.updateUserData(data);
            this.profileForm.patchValue({
              name: data.name || '',
              lastname: data.lastname || '',
              email: data.email || '',
              role: data.role || '',
              gender: data.gender || '',
              age: data.age || null,
              pregnant: data.pregnant || false
            });
            this.profileImageUrl = data.profile_picture || '';
          },
          error: (err) => {
            console.error('Error al cargar datos del usuario:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar los datos del perfil'
            });
          }
        });
      }
    }
  }

  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Archivo inválido',
          detail: 'Solo se permiten archivos JPEG y PNG'
        });
        return;
      }

      // Validar tamaño (mínimo 10KB, máximo 5MB)
      const minSize = 10240; // 10KB
      const maxSize = 5242880; // 5MB

      if (file.size < minSize) {
        this.messageService.add({
          severity: 'error',
          summary: 'Archivo muy pequeño',
          detail: 'El archivo debe ser mayor a 10KB'
        });
        return;
      }

      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'error',
          summary: 'Archivo muy grande',
          detail: 'El archivo debe ser menor a 5MB'
        });
        return;
      }

      this.selectedFile = file;

      // Crear preview de la imagen
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
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;

      // Crear FormData para enviar al backend
      const formData = new FormData();
      const formValues = this.profileForm.value;

      // Agregar campos al FormData solo si tienen valor y han cambiado
      if (formValues.name && formValues.name !== this.currentUser.name) {
        formData.append('name', formValues.name);
      }
      if (formValues.lastname && formValues.lastname !== this.currentUser.lastname) {
        formData.append('lastname', formValues.lastname);
      }
      if (formValues.email && formValues.email !== this.currentUser.email) {
        formData.append('email', formValues.email);
      }
      if (formValues.password && formValues.password.trim() !== '') {
        formData.append('password', formValues.password);
      }
      if (formValues.gender && formValues.gender !== this.currentUser.gender) {
        formData.append('gender', formValues.gender);
      }
      if (this.hasValidChange(formValues.age, this.currentUser.age)) {
        formData.append('age', formValues.age.toString());
      }
      if (formValues.pregnant !== null && formValues.pregnant !== undefined && formValues.pregnant !== this.currentUser.pregnant) {
        formData.append('pregnant', formValues.pregnant.toString());
      }
      if (this.selectedFile) {
        formData.append('profile_picture', this.selectedFile);
      }

      // Debug: mostrar qué campos se están enviando
      console.log('FormData being sent:', formData);
      console.log('Form values:', formValues);

      // Llamar al servicio para actualizar el usuario
      this.userService.updateUserWithFormData(this.currentUser.id!, formData).subscribe({
        next: (updatedUser: User) => {
          this.isLoading = false;
          this.currentUser = updatedUser;

          // Actualizar el AuthService con los nuevos datos
          this.authService.updateUserData(updatedUser);

          // Limpiar archivo seleccionado
          this.selectedFile = null;

          // Limpiar campo de contraseña
          this.profileForm.get('password')?.setValue('');

          this.messageService.add({
            severity: 'success',
            summary: 'Perfil actualizado',
            detail: 'Los datos se han guardado correctamente'
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating user:', error);

          // Extraer mensaje de error del backend
          let errorMessage = 'Error al actualizar el perfil';
          if (error.error && error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
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
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          name: 'Nombre',
          lastname: 'Apellido',
          email: 'Email',
          role: 'Rol',
          gender: 'Género',
          age: 'Edad',
          password: 'Contraseña'
        };
        return `${fieldLabels[fieldName] || fieldName} es requerido`;
      }
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors['max']) return `El valor máximo es ${field.errors['max'].max}`;
    }
    return '';
  }

  // Método auxiliar para verificar si el campo de embarazo debe estar visible
  get isPregnancyFieldVisible(): boolean {
    return this.profileForm.get('gender')?.value === 'female';
  }

  resetForm(): void {
    // Limpiar archivo seleccionado
    this.selectedFile = null;

    // Recargar datos originales
    this.loadUserData();

    // Limpiar campo de contraseña específicamente
    this.profileForm.get('password')?.setValue('');

    this.messageService.add({
      severity: 'info',
      summary: 'Formulario restablecido',
      detail: 'Se han restaurado los datos originales'
    });
  }

  // Método para obtener las iniciales del usuario
  getUserInitials(): string {
    if (this.currentUser) {
      const firstName = this.currentUser.name?.charAt(0) || '';
      const lastName = this.currentUser.lastname?.charAt(0) || '';
      return (firstName + lastName).toUpperCase();
    }
    return 'U';
  }

  // Método auxiliar para verificar si un valor ha cambiado y es válido
  private hasValidChange(newValue: any, currentValue: any): boolean {
    return newValue !== null &&
      newValue !== undefined &&
      newValue !== '' &&
      newValue !== currentValue;
  }

  get hasChanges(): boolean {
    if (!this.currentUser) return false;

    const formValues = this.profileForm.value;

    // Verificar si hay una nueva imagen seleccionada
    if (this.selectedFile) return true;

    // Verificar si la contraseña tiene valor (significa que se quiere cambiar)
    if (formValues.password && formValues.password.trim() !== '') return true;

    // Helpers para normalizar valores
    const normalizeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);
    const normalizeBool = (val: any) => !!val;
    const normalizeNum = (val: any) => (val === null || val === undefined || val === '') ? null : Number(val);

    // Verificar cambios en campos editables
    if (normalizeStr(formValues.name) !== normalizeStr(this.currentUser.name)) return true;
    if (normalizeStr(formValues.lastname) !== normalizeStr(this.currentUser.lastname)) return true;
    if (normalizeStr(formValues.email) !== normalizeStr(this.currentUser.email)) return true;
    if (normalizeNum(formValues.age) !== normalizeNum(this.currentUser.age)) return true;

    // Verificar gender y pregnant
    if (normalizeStr(formValues.gender) !== normalizeStr(this.currentUser.gender)) return true;
    if (normalizeBool(formValues.pregnant) !== normalizeBool(this.currentUser.pregnant)) return true;

    return false;
  }
}
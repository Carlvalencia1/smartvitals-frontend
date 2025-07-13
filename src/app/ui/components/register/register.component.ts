import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../features/user/models/user';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterModalComponent {
  @Output() close = new EventEmitter<void>();

 registerData: User = {
  name: '',
  lastname: '',
  email: '',
  password: '',
  role: 'patient',
  profile_picture: '',
  age: 18
};


  constructor(private authService: AuthService) {}

  register() {
    this.authService.register(this.registerData).subscribe({
      next: () => {
        alert('Usuario registrado correctamente');
        this.close.emit(); // Cierra la modal
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar usuario');
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}

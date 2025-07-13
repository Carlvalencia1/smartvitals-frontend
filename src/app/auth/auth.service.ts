import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../features/user/models/user';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.API_URL;
  private user !: User
  private isLoggedIn = false;
  private options = {
    headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  }
  };

  constructor(private http: HttpClient) { }

  register(data: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data);
  }

  login(data: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/login`, data);
  }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.setLoggedIn(true);
    this.setToken(user.access_token ?? '');
    this.user = user;
  }

  getUser(): User {
    if (this.user) {
      return this.user;
    }
    const user = localStorage.getItem('user');
    if (user) {
      this.user = JSON.parse(user);
      return this.user;
    }

    return {} as User; // Return an empty User object if no user is found
  }

  isLogged(): boolean {
    return this.isLoggedIn;
  }

  setLoggedIn(status: boolean): void {
    this.isLoggedIn = status;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.setLoggedIn(false);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.options.headers['Authorization'] = `Bearer ${token}`;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

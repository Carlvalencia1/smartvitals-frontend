export interface User {
  id?: number;
  access_token?: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  profile_picture: string; 
  role: 'admin' | 'doctor' | 'patient';
  age: number;
}

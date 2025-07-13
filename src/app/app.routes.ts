import { Routes } from '@angular/router';
import { LoginComponent } from './ui/pages/login/login.component';
import { HomeComponent } from './ui/pages/home/home.component';
import { PanelComponent } from './ui/pages/panel/panel.component';
import { MedicalRecordsComponent } from './ui/pages/medical-records/medical-records.component';
import { PatientHistoryComponent } from './ui/pages/patient-history/patient-history.component';
import { ProfileComponent } from './ui/pages/profile/profile.component';
import {CreatePacienteComponent} from './ui/pages/create-paciente/create-paciente.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'panel', component: PanelComponent },
  { path: 'records', component: MedicalRecordsComponent },
  { path: 'history', component: PatientHistoryComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'createPaciente', component: CreatePacienteComponent},
];

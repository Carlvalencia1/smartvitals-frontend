import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { SensorData } from './models/sensorData';
import { AlertData } from './models/alert-data';
import { WebSocketMessage } from './models/websocket-message';
import { MedicalRecordCreated } from './models/medical-record-created';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isMonitoring = false;

  // Observables para datos y alertas
  private sensorDataSubject = new BehaviorSubject<SensorData | null>(null);
  private alertSubject = new Subject<AlertData>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private sensorStatusSubject = new BehaviorSubject<any>(null);
  private monitoringStatusSubject = new BehaviorSubject<boolean>(false);
  private medicalRecordCreatedSubject = new Subject<MedicalRecordCreated>();

  constructor(private authService: AuthService) { }

  // Observables públicos
  public sensorData$ = this.sensorDataSubject.asObservable();
  public alerts$ = this.alertSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public sensorStatus$ = this.sensorStatusSubject.asObservable();
  public monitoringStatus$ = this.monitoringStatusSubject.asObservable();
  public medicalRecordCreated$ = this.medicalRecordCreatedSubject.asObservable();

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // Ya está conectado
    }

    const user = this.authService.getUser();
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    // Construir la URL del WebSocket
    const wsUrl = environment.WEBSOCKET_URL.replace('http', 'ws') + '/ws/sensores';

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionStatusSubject.next(true);
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        // Manejar notificaciones de expedientes médicos creados (sin necesidad de monitoreo activo)
        if (message.type === 'medical_record_created') {
          const medicalRecordData: MedicalRecordCreated = {
            type: 'medical_record_created',
            patient_id: message.patient_id!,
            doctor_id: message.doctor_id!,
            record_id: message.record_id!,
            timestamp: message.timestamp!,
            data: message.data,
            message: message.message!
          };
          this.medicalRecordCreatedSubject.next(medicalRecordData);
          return; // Procesar este mensaje independientemente del estado de monitoreo
        }

        // Solo procesar datos de sensores si el monitoreo está activo
        if (this.isMonitoring) {
          // Soporte para estado de sensores
          if (message.topic === 'sensor') {
            this.sensorStatusSubject.next(message.data);
          }
          if (message.type === 'alerta') {
            // Es una alerta
            const alertData: AlertData = {
              type: 'alerta',
              patient_id: message.patient_id!,
              doctor_id: message.doctor_id,
              alertas: message.alertas || []
            };
            this.alertSubject.next(alertData);
          } else if (message.topic && message.data && message.topic !== 'sensor') {
            // Es dato de sensor (pero no el status general)
            const sensorData: SensorData = {
              topic: message.topic,
              data: message.data
            };
            this.sensorDataSubject.next(sensorData);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket desconectado');
      this.isConnected = false;
      this.isMonitoring = false;
      this.connectionStatusSubject.next(false);

      // Intentar reconectar
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connect();
        }, 2000);
      }
    };

    this.socket.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    };
  }

  private sendIdentification(userId: number, role: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        user_id: userId,
        rol: role
      };
      this.socket.send(JSON.stringify(message));
      console.log('Identificación enviada al servidor');
    }
  }

  public sendDoctorConfiguration(doctorId: number, patientId: number): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        action: 'doctor_config',
        doctor_id: doctorId,
        patient_id: patientId
      };
      this.socket.send(JSON.stringify(message));
      console.log('Configuración de doctor enviada:', { doctorId, patientId });
    }
  }

  startMeasurement(patientId: number): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const user = this.authService.getUser();
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      // Determinar el rol del usuario
      const role = user.role === 'doctor' ? 'doctor' : 'paciente';

      // Enviar identificación del usuario
      this.sendIdentification(user.id!, role);

      // Si es doctor, enviar configuración adicional
      if (role === 'doctor') {
        this.sendDoctorConfiguration(user.id!, patientId);
      }

      // Enviar comando de inicio de medición
      const message = {
        action: 'start',
        patient_id: patientId
      };
      this.socket.send(JSON.stringify(message));

      this.isMonitoring = true;
      this.monitoringStatusSubject.next(true);
      console.log('Medición iniciada para paciente:', patientId);
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  stopMeasurement(patientId: number): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        action: 'stop',
        patient_id: patientId
      };
      this.socket.send(JSON.stringify(message));

      this.isMonitoring = false;
      this.monitoringStatusSubject.next(false);
      console.log('Medición detenida para paciente:', patientId);
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isMonitoring = false;
      this.connectionStatusSubject.next(false);
      this.monitoringStatusSubject.next(false);
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  isMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
}

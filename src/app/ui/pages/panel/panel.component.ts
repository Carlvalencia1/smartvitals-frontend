import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardsComponent } from '../../components/cards/cards.component';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../../features/sensor/websocket.service';
import { SensorData } from '../../../features/sensor/models/sensorData';
import { AlertData } from '../../../features/sensor/models/alert-data';
import { WebSocketMessage } from '../../../features/sensor/models/websocket-message';
import { User } from '../../../features/user/models/user';
import { UserService } from '../../../features/user/user.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';


@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CardsComponent, ChartModule, SelectModule, FormsModule],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  currentUser = {} as User
  isConnected = false;
  isMonitoring = false;
  currentUserId: number = 0;
  alerts: AlertData[] = [];
  sensorStatus: any = null;
  patients: User[] = [];
  patientOptions: any[] = [];
  selectedPatient: User | undefined;

  // Datos en tiempo real (inicialmente vacíos)
  realTimeData = {
    heartRate: null as number | null,
    spo2: null as number | null,
    temperature: null as number | null,
    bloodPressure: { systolic: null as number | null, diastolic: null as number | null }
  };

  heartRateData = {
    labels: [] as string[],
    datasets: [
      {
        label: 'ppm',
        data: [] as number[],
        borderColor: '#EC407A',
        fill: false,
        tension: 0.4
      }
    ]
  };

  spo2Data = {
    labels: [] as string[],
    datasets: [
      {
        label: 'SpO2 %',
        backgroundColor: '#42A5F5',
        data: [] as number[]
      }
    ]
  };

  temperatureData = {
    labels: [] as string[],
    datasets: [
      {
        label: '°C',
        data: [] as number[],
        borderColor: '#FFA726',
        fill: false,
        tension: 0.4
      }
    ]
  };

  bloodPressureData = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Sistólica',
        borderColor: '#66BB6A',
        data: [] as number[],
        fill: false
      },
      {
        label: 'Diastólica',
        borderColor: '#FF7043',
        data: [] as number[],
        fill: false
      }
    ]
  };

  eegData = {
    labels: ['1s', '2s', '3s', '4s', '5s'] as string[],
    datasets: [
      {
        label: 'Voltaje',
        borderColor: '#AB47BC',
        data: [0, 0, 0, 0, 0] as number[],
        fill: false,
        tension: 0.4
      }
    ]
  };

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { min: 0, max: 100 },
      x: { display: false }
    },
    animation: {
      duration: 0 // Desactivar animaciones para mejor rendimiento
    },
    elements: {
      point: {
        radius: 0 // Ocultar puntos para mejor rendimiento
      },
      line: {
        tension: 0.4
      }
    }
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
      x: { display: false }
    },
    animation: {
      duration: 0
    }
  };

  multiAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 60,
        max: 140
      },
      x: { display: false }
    },
    animation: {
      duration: 0
    },
    elements: {
      point: {
        radius: 0
      },
      line: {
        tension: 0.4
      }
    }
  };

  constructor(
    private websocketService: WebsocketService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.currentUserId = this.authService.getUser()?.id || 0;
    if (!this.currentUserId) {
      console.error('No se pudo obtener el ID del paciente actual');
      return;
    }
    
    this.currentUser = this.authService.getUser() || {} as User;

    // Obtener pacientes si el usuario es doctor
    if (this.currentUser.role === 'doctor' && this.currentUser.id !== undefined) {
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
    // Conectar al WebSocket
    this.websocketService.connect();

    // Suscribirse al estado de conexión
    this.subscriptions.push(
      this.websocketService.connectionStatus$.subscribe(
        status => {
          this.isConnected = status;
          console.log('Estado de conexión WebSocket:', status);
        }
      )
    );

    // Suscribirse a datos de sensores
    this.subscriptions.push(
      this.websocketService.sensorData$.subscribe(
        (sensorData: SensorData | null) => {
          if (sensorData) {
            this.updateRealTimeData(sensorData);
          }
        }
      )
    );

    // Suscribirse a alertas
    this.subscriptions.push(
      this.websocketService.alerts$.subscribe(
        (alert: AlertData) => {
          this.alerts.push(alert);
          console.log('Nueva alerta recibida:', alert);
          // Aquí puedes mostrar una notificación o toast
        }
      )
    );

    this.subscriptions.push(
      this.websocketService.sensorStatus$.subscribe(status => {
        if (status) {
          this.sensorStatus = status;
        }
      })
    );

    // Suscribirse al estado de monitoreo
    this.subscriptions.push(
      this.websocketService.monitoringStatus$.subscribe(status => {
        this.isMonitoring = status;
        console.log('Estado de monitoreo actualizado:', status);
      })
    );

    // Sincronizar estado de monitoreo con el servicio
    this.isMonitoring = this.websocketService.isMonitoringStatus();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Desconectar WebSocket
    this.websocketService.disconnect();
  }

  startMonitoring() {
    if (this.isConnected) {
      this.websocketService.startMeasurement(this.currentUserId);
      console.log('Monitoreo iniciado');
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  stopMonitoring() {
    if (this.isConnected) {
      this.websocketService.stopMeasurement(this.currentUserId);
      console.log('Monitoreo detenido');
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  private updateRealTimeData(sensorData: SensorData) {
    const data = sensorData.data;

    switch (sensorData.topic) {
      case 'temperatura':
        if (data.temperature) {
          this.realTimeData.temperature = data.temperature;
          this.updateTemperatureChart(data.temperature);
        }
        break;
      case 'oxigeno':
        if (data.oxygen_saturation) {
          this.realTimeData.spo2 = data.oxygen_saturation;
          this.updateSpo2Chart(data.oxygen_saturation);
        }
        break;
      case 'presion':
        if (data.blood_pressure) {
          // Asumiendo que blood_pressure viene como "120/80"
          const [systolic, diastolic] = data.blood_pressure.toString().split('/').map(Number);
          this.realTimeData.bloodPressure = { systolic, diastolic };
          this.updateBloodPressureChart(systolic, diastolic);
        }
        break;
      case 'ritmo_cardiaco':
        if (data.heart_rate) {
          this.realTimeData.heartRate = data.heart_rate;
          this.updateHeartRateChart(data.heart_rate);
        }
        break;
    }
  }

  private updateHeartRateChart(value: number) {
    const maxDataPoints = 20; // Mantener solo los últimos 20 puntos

    if (this.heartRateData.labels.length >= maxDataPoints) {
      this.heartRateData.labels.shift();
      this.heartRateData.datasets[0].data.shift();
    }

    const nextLabel = `${this.heartRateData.labels.length + 1}s`;
    this.heartRateData.labels.push(nextLabel);
    this.heartRateData.datasets[0].data.push(value);

    // Crear una nueva referencia para trigger de detección de cambios
    this.heartRateData = {
      labels: [...this.heartRateData.labels],
      datasets: [{
        ...this.heartRateData.datasets[0],
        data: [...this.heartRateData.datasets[0].data]
      }]
    };
  }

  private updateSpo2Chart(value: number) {
    const maxDataPoints = 20;

    if (this.spo2Data.labels.length >= maxDataPoints) {
      this.spo2Data.labels.shift();
      this.spo2Data.datasets[0].data.shift();
    }

    const nextLabel = `${this.spo2Data.labels.length + 1}s`;
    this.spo2Data.labels.push(nextLabel);
    this.spo2Data.datasets[0].data.push(value);

    this.spo2Data = {
      labels: [...this.spo2Data.labels],
      datasets: [{
        ...this.spo2Data.datasets[0],
        data: [...this.spo2Data.datasets[0].data]
      }]
    };
  }

  private updateTemperatureChart(value: number) {
    const maxDataPoints = 20;

    if (this.temperatureData.labels.length >= maxDataPoints) {
      this.temperatureData.labels.shift();
      this.temperatureData.datasets[0].data.shift();
    }

    const nextLabel = `${this.temperatureData.labels.length + 1}s`;
    this.temperatureData.labels.push(nextLabel);
    this.temperatureData.datasets[0].data.push(value);

    this.temperatureData = {
      labels: [...this.temperatureData.labels],
      datasets: [{
        ...this.temperatureData.datasets[0],
        data: [...this.temperatureData.datasets[0].data]
      }]
    };
  }

  private updateBloodPressureChart(systolic: number, diastolic: number) {
    const maxDataPoints = 20;

    if (this.bloodPressureData.labels.length >= maxDataPoints) {
      this.bloodPressureData.labels.shift();
      this.bloodPressureData.datasets[0].data.shift();
      this.bloodPressureData.datasets[1].data.shift();
    }

    const nextLabel = `${this.bloodPressureData.labels.length + 1}s`;
    this.bloodPressureData.labels.push(nextLabel);
    this.bloodPressureData.datasets[0].data.push(systolic);
    this.bloodPressureData.datasets[1].data.push(diastolic);

    this.bloodPressureData = {
      labels: [...this.bloodPressureData.labels],
      datasets: [
        {
          ...this.bloodPressureData.datasets[0],
          data: [...this.bloodPressureData.datasets[0].data]
        },
        {
          ...this.bloodPressureData.datasets[1],
          data: [...this.bloodPressureData.datasets[1].data]
        }
      ]
    };
  }

  clearAlerts() {
    this.alerts = [];
  }
}



import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../../features/sensor/websocket.service';
import { SensorData } from '../../../features/sensor/models/sensorData';
import { AlertData } from '../../../features/sensor/models/alert-data';
import { MedicalRecordCreated } from '../../../features/sensor/models/medical-record-created';
import { WebSocketMessage } from '../../../features/sensor/models/websocket-message';
import { User } from '../../../features/user/models/user';
import { UserService } from '../../../features/user/user.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { CardModule } from 'primeng/card';

Chart.register(...registerables);


@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgChartsModule, SelectModule, MultiSelectModule, ButtonModule, FormsModule, ToastModule, CardModule],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css'],
  providers: [MessageService]
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
  selectedPatient: any; // Changed to any to accommodate primeng select options

  // Variables para controlar la navegación durante el monitoreo
  monitoringStartTime: Date | null = null;
  private oneMinuteTimer: any = null;
  private isOneMinutePassed = false;
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;

  // Propiedad para controlar si el botón de monitoreo está habilitado
  get canStartMonitoring(): boolean {
    if (this.currentUser.role === 'doctor') {
      return this.isConnected && !this.isMonitoring && !!this.selectedPatient;
    }
    return this.isConnected && !this.isMonitoring;
  }

  // Configuración de visibilidad de gráficos
  chartVisibility = {
    heartRate: true,
    spo2: true,
    temperature: true,
    bloodPressure: true,
    ecg: true
  };

  // Opciones para el selector de gráficos
  chartOptions = [
    { label: 'Ritmo Cardíaco', value: 'heartRate', icon: 'pi-heart' },
    { label: 'Saturación de Oxígeno', value: 'spo2', icon: 'pi-circle' },
    { label: 'Temperatura Corporal', value: 'temperature', icon: 'pi-sun' },
    { label: 'Presión Arterial', value: 'bloodPressure', icon: 'pi-chart-line' },
    { label: 'Electrocardiograma', value: 'ecg', icon: 'pi-wave-pulse' }
  ];

  selectedCharts: string[] = ['heartRate', 'spo2', 'temperature', 'bloodPressure', 'ecg'];

  // Datos en tiempo real (inicialmente vacíos)
  realTimeData = {
    heartRate: null as number | null,
    spo2: null as number | null,
    temperature: null as number | null,
    bloodPressure: { systolic: null as number | null, diastolic: null as number | null }
  };

  // Configuraciones de Chart.js
  public lineChartType: ChartType = 'line';
  public barChartType: ChartType = 'bar';

  // Datos para ritmo cardíaco con tiempo real
  public heartRateChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Ritmo Cardíaco (ppm)',
      data: [],
      borderColor: '#EC407A',
      backgroundColor: 'rgba(236, 64, 122, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    }]
  };

  // Datos para SpO2
  public spo2ChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Saturación de Oxígeno (%)',
      data: [],
      backgroundColor: '#42A5F5',
      borderColor: '#1976D2',
      borderWidth: 1
    }]
  };

  // Datos para temperatura
  public temperatureChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Temperatura (°C)',
      data: [],
      backgroundColor: '#FFA726',
      borderColor: '#FB8C00',
      borderWidth: 1
    }]
  };

  // Datos para ECG
  public ecgChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Señal ECG (mV)',
      data: [],
      borderColor: '#AB47BC',
      backgroundColor: 'rgba(171, 71, 188, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5
    }]
  };



  // Opciones para Chart.js
  public heartRateChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tiempo'
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Ritmo Cardíaco (ppm)'
        },
        min: 0,
        max: 220,
        ticks: {
          stepSize: 20
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 300
    }
  };

  public spo2ChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tiempo'
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'SpO2 (%)'
        },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10
        }
      }
    },
    animation: {
      duration: 300
    }
  };

  public temperatureChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tiempo'
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Temperatura (°C)'
        },
        min: 20,
        max: 45,
        ticks: {
          stepSize: 2
        }
      }
    },
    animation: {
      duration: 300
    }
  };

  public ecgChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tiempo'
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Señal ECG (mV)'
        },
        min: 1400,
        max: 2500,
        ticks: {
          stepSize: 40
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 300
    }
  };



  constructor(
    private websocketService: WebsocketService,
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  // Métodos para gestionar la prevención de navegación durante el monitoreo
  private setupNavigationWarning(): void {
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (this.isMonitoring && !this.isOneMinutePassed) {
        const message = 'Si sales ahora, perderás el registro de monitoreo en curso. ¿Estás seguro de que quieres salir?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private removeNavigationWarning(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  private startOneMinuteTimer(): void {
    this.monitoringStartTime = new Date();
    this.isOneMinutePassed = false;

    this.oneMinuteTimer = setTimeout(() => {
      this.isOneMinutePassed = true;
      this.removeNavigationWarning();
      console.log('Un minuto ha pasado, navegación libre permitida');
    }, 60000); // 60 segundos
  }

  private clearOneMinuteTimer(): void {
    if (this.oneMinuteTimer) {
      clearTimeout(this.oneMinuteTimer);
      this.oneMinuteTimer = null;
    }
    this.isOneMinutePassed = false;
    this.monitoringStartTime = null;
  }

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
          console.log('Pacientes recibidos del backend:', data);
          this.patients = data;
          this.patientOptions = data.map(patient => {
            console.log('Procesando paciente:', patient);
            return {
              label: `${patient.name} ${patient.lastname}`,
              value: patient
            };
          });
          console.log('patientOptions creado:', this.patientOptions);
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
        data => {
          if (data) {
            this.updateRealTimeData(data);
          }
        }
      )
    );

    // Suscribirse a alertas (solo agregar a la lista, sin toast)
    this.subscriptions.push(
      this.websocketService.alerts$.subscribe(
        alert => {
          this.alerts.push(alert);
          console.log('Nueva alerta recibida:', alert);
        }
      )
    );

    // Suscribirse al estado de sensores
    this.subscriptions.push(
      this.websocketService.sensorStatus$.subscribe(
        status => {
          if (status) {
            this.sensorStatus = status;
          }
        }
      )
    );

    // Suscribirse al estado de monitoreo (CRÍTICO para el funcionamiento)
    this.subscriptions.push(
      this.websocketService.monitoringStatus$.subscribe(
        status => {
          this.isMonitoring = status;
          console.log('Estado de monitoreo actualizado:', status);
        }
      )
    );

    // Suscribirse a notificaciones de expedientes médicos creados
    this.subscriptions.push(
      this.websocketService.medicalRecordCreated$.subscribe(
        medicalRecord => {
          // Formatear la fecha del timestamp
          const date = new Date(medicalRecord.timestamp * 1000);
          const formattedDate = date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          // Mostrar toast con información del expediente médico
          this.messageService.add({
            severity: 'success',
            summary: 'Expediente Médico Creado',
            detail: `${medicalRecord.message} - ${formattedDate}`,
            life: 6000
          });

          // Log adicional para debugging
          console.log('Nuevo expediente médico creado:', {
            recordId: medicalRecord.record_id,
            patientId: medicalRecord.patient_id,
            doctorId: medicalRecord.doctor_id,
            data: medicalRecord.data,
            timestamp: formattedDate
          });
        }
      )
    );

    // Sincronizar estado de monitoreo con el servicio
    this.isMonitoring = this.websocketService.isMonitoringStatus();

    // Inicializar visibilidad de gráficos
    this.updateChartVisibility();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Limpiar timer y warnings de navegación
    this.clearOneMinuteTimer();
    this.removeNavigationWarning();
    // Desconectar del WebSocket
    this.websocketService.disconnect();
  }

  startMonitoring() {
    if (this.isConnected) {
      // Mostrar toast notification
      this.messageService.add({
        severity: 'info',
        summary: 'Monitoreo iniciado',
        detail: 'Por favor, espere 1 minuto antes de cambiar de pantalla o detener la medicion',
        life: 10000
      });

      // Configurar prevención de navegación y timer
      this.setupNavigationWarning();
      this.startOneMinuteTimer();

      let patientIdToMonitor = this.currentUserId;

      // Si es doctor y tiene un paciente seleccionado, usar el ID del paciente
      if (this.currentUser.role === 'doctor') {
        if (!this.selectedPatient) {
          console.error('Error: El doctor debe seleccionar un paciente antes de iniciar el monitoreo');
          alert('Por favor, selecciona un paciente antes de iniciar el monitoreo');
          return;
        }

        console.log('selectedPatient completo:', this.selectedPatient);

        // El selectedPatient contiene el objeto option completo, necesitamos acceder al value
        const patient = this.selectedPatient.value || this.selectedPatient;
        console.log('Paciente extraído:', patient);
        console.log('Paciente ID:', patient.id);
        console.log('Paciente name:', patient.name);

        if (patient && patient.id) {
          patientIdToMonitor = patient.id;
          console.log('Monitoreando paciente:', patient.name, 'ID:', patientIdToMonitor);
        } else {
          console.error('Error: El paciente seleccionado no tiene ID definido');
          alert('Error: El paciente seleccionado no tiene ID válido');
          return;
        }
      }

      this.websocketService.startMeasurement(patientIdToMonitor);
      console.log('Monitoreo iniciado para paciente ID:', patientIdToMonitor);
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  stopMonitoring() {
    if (this.isConnected) {
      let patientIdToStop = this.currentUserId;

      // Si es doctor y tiene un paciente seleccionado, usar el ID del paciente
      if (this.currentUser.role === 'doctor' && this.selectedPatient) {
        const patient = this.selectedPatient.value || this.selectedPatient;
        if (patient && patient.id) {
          patientIdToStop = patient.id;
        }
      }

      this.websocketService.stopMeasurement(patientIdToStop);
      console.log('Monitoreo detenido para paciente ID:', patientIdToStop);

      // Limpiar prevención de navegación y timer
      this.clearOneMinuteTimer();
      this.removeNavigationWarning();
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  private updateRealTimeData(sensorData: SensorData) {
    const data = sensorData.data;

    // Obtener el ID del usuario actual
    const currentUserId = this.currentUser.id;

    // Determinar el ID del paciente que debe recibir los datos
    let targetPatientId = currentUserId;

    // Si es doctor y tiene un paciente seleccionado, usar el ID del paciente seleccionado
    if (this.currentUser.role === 'doctor' && this.selectedPatient) {
      const patient = this.selectedPatient.value || this.selectedPatient;
      if (patient && patient.id) {
        targetPatientId = patient.id;
      }
    }

    // Verificar si los datos corresponden al usuario actual o al paciente que está monitoreando
    const dataPatientId = data.patient_id;
    const dataDoctorId = data.doctor_id;

    // Solo procesar si los datos corresponden al usuario actual o al paciente monitoreado
    if (dataPatientId !== targetPatientId && dataDoctorId !== currentUserId) {
      console.log(`Datos ignorados - No corresponden al usuario actual (${currentUserId}) o paciente monitoreado (${targetPatientId})`);
      console.log(`Datos recibidos: patient_id=${dataPatientId}, doctor_id=${dataDoctorId}`);
      return;
    }

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
          console.log(`Presión arterial actualizada: ${systolic}/${diastolic} mmHg`);
        }
        break;
      case 'ritmo_cardiaco':
        if (data.heart_rate) {
          this.realTimeData.heartRate = data.heart_rate;
          this.updateHeartRateChart(data.heart_rate);
        }
        break;
      case 'ecg':
        if (data.ecg_values || data.ecg) {
          const ecgData = data.ecg_values || data.ecg;
          if (Array.isArray(ecgData) && ecgData.length > 0) {
            this.updateEcgChart(ecgData[0]); // Tomar el primer valor del array
          }
        }
        break;
    }
  }

  private updateHeartRateChart(value: number) {
    const maxDataPoints = 20; // Mantener solo los últimos 20 puntos
    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (this.heartRateChartData.labels && this.heartRateChartData.labels.length >= maxDataPoints) {
      this.heartRateChartData.labels.shift();
      if (this.heartRateChartData.datasets[0]?.data) {
        this.heartRateChartData.datasets[0].data.shift();
      }
    }

    if (this.heartRateChartData.labels) {
      this.heartRateChartData.labels.push(currentTime);
    }
    if (this.heartRateChartData.datasets[0]?.data) {
      this.heartRateChartData.datasets[0].data.push(value);
    }

    // Crear una nueva referencia para trigger de detección de cambios
    this.heartRateChartData = {
      labels: this.heartRateChartData.labels ? [...this.heartRateChartData.labels] : [],
      datasets: [{
        ...this.heartRateChartData.datasets[0],
        data: this.heartRateChartData.datasets[0]?.data ? [...this.heartRateChartData.datasets[0].data] : []
      }]
    };
  }

  private updateSpo2Chart(value: number) {
    const maxDataPoints = 20;
    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (this.spo2ChartData.labels && this.spo2ChartData.labels.length >= maxDataPoints) {
      this.spo2ChartData.labels.shift();
      if (this.spo2ChartData.datasets[0]?.data) {
        this.spo2ChartData.datasets[0].data.shift();
      }
    }

    if (this.spo2ChartData.labels) {
      this.spo2ChartData.labels.push(currentTime);
    }
    if (this.spo2ChartData.datasets[0]?.data) {
      this.spo2ChartData.datasets[0].data.push(value);
    }

    this.spo2ChartData = {
      labels: this.spo2ChartData.labels ? [...this.spo2ChartData.labels] : [],
      datasets: [{
        ...this.spo2ChartData.datasets[0],
        data: this.spo2ChartData.datasets[0]?.data ? [...this.spo2ChartData.datasets[0].data] : []
      }]
    };
  }

  private updateTemperatureChart(value: number) {
    const maxDataPoints = 20;
    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (this.temperatureChartData.labels && this.temperatureChartData.labels.length >= maxDataPoints) {
      this.temperatureChartData.labels.shift();
      if (this.temperatureChartData.datasets[0]?.data) {
        this.temperatureChartData.datasets[0].data.shift();
      }
    }

    if (this.temperatureChartData.labels) {
      this.temperatureChartData.labels.push(currentTime);
    }
    if (this.temperatureChartData.datasets[0]?.data) {
      this.temperatureChartData.datasets[0].data.push(value);
    }

    this.temperatureChartData = {
      labels: this.temperatureChartData.labels ? [...this.temperatureChartData.labels] : [],
      datasets: [{
        ...this.temperatureChartData.datasets[0],
        data: this.temperatureChartData.datasets[0]?.data ? [...this.temperatureChartData.datasets[0].data] : []
      }]
    };
  }

  private updateEcgChart(value: number) {
    const maxDataPoints = 20;
    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (this.ecgChartData.labels && this.ecgChartData.labels.length >= maxDataPoints) {
      this.ecgChartData.labels.shift();
      if (this.ecgChartData.datasets[0]?.data) {
        this.ecgChartData.datasets[0].data.shift();
      }
    }

    if (this.ecgChartData.labels) {
      this.ecgChartData.labels.push(currentTime);
    }
    if (this.ecgChartData.datasets[0]?.data) {
      this.ecgChartData.datasets[0].data.push(value);
    }

    this.ecgChartData = {
      labels: this.ecgChartData.labels ? [...this.ecgChartData.labels] : [],
      datasets: [{
        ...this.ecgChartData.datasets[0],
        data: this.ecgChartData.datasets[0]?.data ? [...this.ecgChartData.datasets[0].data] : []
      }]
    };
  }

  clearAlerts() {
    this.alerts = [];
  }

  onPatientSelectionChange() {
    if (this.selectedPatient && this.currentUser.role === 'doctor') {
      console.log('Paciente seleccionado:', this.selectedPatient);
      const patient = this.selectedPatient.value || this.selectedPatient;
      console.log('ID del paciente seleccionado:', patient.id);

      // Limpiar todos los datos al cambiar de paciente
      this.clearAllData();

      // La configuración se enviará cuando se inicie el monitoreo
    }
  }

  clearAllData() {
    console.log('Limpiando todos los datos...');

    // Limpiar datos en tiempo real
    this.realTimeData = {
      heartRate: null,
      spo2: null,
      temperature: null,
      bloodPressure: { systolic: null, diastolic: null }
    };

    // Limpiar datos de gráficos Chart.js
    this.heartRateChartData = {
      labels: [],
      datasets: [{
        label: 'Ritmo Cardíaco (ppm)',
        data: [],
        borderColor: '#EC407A',
        backgroundColor: 'rgba(236, 64, 122, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    };

    this.spo2ChartData = {
      labels: [],
      datasets: [{
        label: 'Saturación de Oxígeno (%)',
        data: [],
        backgroundColor: '#42A5F5',
        borderColor: '#1976D2',
        borderWidth: 1
      }]
    };

    this.temperatureChartData = {
      labels: [],
      datasets: [{
        label: 'Temperatura (°C)',
        data: [],
        backgroundColor: '#FFA726',
        borderColor: '#FB8C00',
        borderWidth: 1
      }]
    };

    this.ecgChartData = {
      labels: [],
      datasets: [{
        label: 'Señal ECG (mV)',
        data: [],
        borderColor: '#AB47BC',
        backgroundColor: 'rgba(171, 71, 188, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    };

    // Limpiar alertas
    this.alerts = [];

    console.log('Datos limpiados correctamente');
  }

  updateChartVisibility(): void {
    // Resetear todas las visibilidades
    this.chartVisibility = {
      heartRate: false,
      spo2: false,
      temperature: false,
      bloodPressure: false,
      ecg: false
    };

    // Activar solo los gráficos seleccionados
    this.selectedCharts.forEach(chart => {
      if (chart in this.chartVisibility) {
        (this.chartVisibility as any)[chart] = true;
      }
    });

    console.log('Visibilidad de gráficos actualizada:', this.chartVisibility);
  }

  toggleChart(chartType: string): void {
    const index = this.selectedCharts.indexOf(chartType);
    if (index > -1) {
      this.selectedCharts.splice(index, 1);
    } else {
      this.selectedCharts.push(chartType);
    }
    this.updateChartVisibility();
  }

  isChartVisible(chartType: string): boolean {
    return this.selectedCharts.includes(chartType);
  }

  selectAllCharts(): void {
    this.selectedCharts = [...this.chartOptions.map(chart => chart.value)];
    this.updateChartVisibility();
  }

  deselectAllCharts(): void {
    this.selectedCharts = [];
    this.updateChartVisibility();
  }

  get allChartsSelected(): boolean {
    return this.selectedCharts.length === this.chartOptions.length;
  }

  get noChartsSelected(): boolean {
    return this.selectedCharts.length === 0;
  }
}



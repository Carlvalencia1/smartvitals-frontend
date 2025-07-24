import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { MedicalRecordService } from '../../../features/medicalRecord/medical-record.service';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../features/user/user.service';
import { PatientStadistics } from '../../../features/medicalRecord/models/patient-stadistics';
import { Record } from '../../../features/medicalRecord/models/record';
import { User } from '../../../features/user/models/user';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

Chart.register(...registerables);

@Component({
  selector: 'app-stadistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    NavbarComponent,
    SelectModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    ProgressBarModule,
    ToastModule
  ],
  templateUrl: './stadistics.component.html',
  styleUrl: './stadistics.component.css',
  providers: [MessageService]
})
export class StadisticsComponent implements OnInit {
  currentUser!: User;
  patients: User[] = [];
  selectedPatient: User | undefined;
  patientOptions: any[] = [];
  statistics!: PatientStadistics;
  medicalRecords: Record[] = [];
  rangeDates: Date[] | undefined;

  // Estados de error y carga
  errorMessage: string = '';
  hasError: boolean = false;
  isLoading: boolean = false;

  // Configuración de visibilidad de gráficos
  chartVisibility = {
    statsBar: true,
    riskRadar: true,
    rangeComparison: true,
    temperatureEvolution: true,
    heartRateEvolution: true,
    oxygenSaturationEvolution: true
  };

  // Opciones para el selector de gráficos
  chartOptions = [
    { label: 'Estadísticas de Signos Vitales', value: 'statsBar', icon: 'pi-chart-bar' },
    { label: 'Probabilidades de Riesgo', value: 'riskRadar', icon: 'pi-chart-pie' },
    { label: 'Comparación con Rangos', value: 'rangeComparison', icon: 'pi-chart-line' },
    { label: 'Evolución de Temperatura', value: 'temperatureEvolution', icon: 'pi-sun' },
    { label: 'Evolución de Frecuencia Cardíaca', value: 'heartRateEvolution', icon: 'pi-heart' },
    { label: 'Evolución de Saturación O2', value: 'oxygenSaturationEvolution', icon: 'pi-circle' }
  ];

  selectedCharts: string[] = ['statsBar', 'riskRadar', 'rangeComparison', 'temperatureEvolution', 'heartRateEvolution', 'oxygenSaturationEvolution'];

  // Configuraciones de gráficos
  public barChartType: ChartType = 'bar';
  public lineChartType: ChartType = 'line';
  public doughnutChartType: ChartType = 'doughnut';

  // Datos para gráfico de barras (estadísticas)
  public statsBarChartData: ChartData<'bar'> = {
    labels: ['Temperatura', 'Frecuencia Cardíaca', 'Saturación O2'],
    datasets: []
  };

  public statsBarChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        // text: 'Estadísticas de Signos Vitales'
      }
    }
  };

  // Datos para gráfico de riesgos (doughnut)
  public riskDoughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };

  public riskDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        // text: 'Probabilidades de Riesgo (%)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toFixed(1)}% (${percentage}% del total)`;
          }
        }
      }
    },
    cutout: '60%', // Esto hace que sea un anillo en lugar de un círculo completo
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff'
      }
    }
  };

  // Datos para gráfico de rangos (line)
  public rangeLineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public rangeLineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        // text: 'Comparación con Rangos de Riesgo'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Datos para gráfico de evolución de temperatura
  public temperatureEvolutionChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public temperatureEvolutionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        // text: 'Evolución de Temperatura con Análisis Estadístico'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperatura (°C)'
        },
        beginAtZero: false
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Datos para gráfico de evolución de frecuencia cardíaca
  public heartRateEvolutionChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public heartRateEvolutionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        // text: 'Evolución de Frecuencia Cardíaca con Análisis Estadístico'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Frecuencia Cardíaca (bpm)'
        },
        beginAtZero: false
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Datos para gráfico de evolución de saturación de oxígeno
  public oxygenSaturationEvolutionChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public oxygenSaturationEvolutionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        // text: 'Evolución de Saturación de Oxígeno con Análisis Estadístico'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Saturación O2 (%)'
        },
        beginAtZero: false,
        min: 85,
        max: 100
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  constructor(
    private authService: AuthService,
    private recordService: MedicalRecordService,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (this.authService.getUser()) {
      this.currentUser = this.authService.getUser() as User;
    }

    // Inicializar visibilidad de gráficos
    this.updateChartVisibility();

    if (this.currentUser.role === 'doctor') {
      this.loadPatients();
      this.loadPatientsStadistics();
    } else if (this.currentUser.role === 'patient') {
      this.loadPatientStatistics(this.currentUser.id!);
    }
  }

  loadPatients(): void {
    if (!this.currentUser.id) {
      console.error('Doctor ID is not available');
      return;
    }
    this.userService.getPatients(this.currentUser.id).subscribe({
      next: (data) => {
        this.patients = data;

        this.patientOptions = [
          {
            label: '-- No seleccionado --',
            value: null
          },
          ...data.map(patient => ({
            label: `${patient.name} ${patient.lastname}`,
            value: patient
          }))
        ];
      },
      error: (error) => {
        console.error('Error fetching patients:', error);

        // Extraer el mensaje de error del backend
        let errorMessage = '';
        if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = 'Error al cargar la lista de pacientes';
        }

        // Mostrar toast con el error
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  onPatientChange(): void {
    console.log('Patient changed:', this.selectedPatient);

    if (this.selectedPatient === null) {
      // Se seleccionó "Ningún paciente"
      this.clearPatientData();
    } else if (this.selectedPatient?.id) {
      // Se seleccionó un paciente válido
      // Limpiar fechas cuando se cambia de paciente
      this.rangeDates = undefined;
      // Cargar estadísticas del paciente seleccionado
      this.loadPatientStatistics(this.selectedPatient.id);
    }
  }

  clearPatientData(): void {
    // Limpiar datos relacionados con paciente específico
    this.rangeDates = undefined;
    this.statistics = undefined as any;
    this.medicalRecords = [];
    this.hasError = false;
    this.errorMessage = '';

    // Cargar estadísticas generales del doctor
    this.loadPatientsStadistics();

    this.messageService.add({
      severity: 'info',
      summary: 'Vista general',
      detail: 'Mostrando estadísticas generales de todos los pacientes',
      life: 2000
    });
  }

  loadPatientsStadistics(): void {
    if (this.currentUser.id) {
      this.isLoading = true;
      this.hasError = false;
      this.errorMessage = '';

      this.recordService.getDoctorStatistics(this.currentUser.id).subscribe({
        next: (data: any) => {
          console.log(data);
          this.statistics = data;
          this.medicalRecords = data.records;
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching doctor statistics:', error);
          this.isLoading = false;
          this.hasError = true;

          // Extraer el mensaje de error del backend
          if (error.error && error.error.detail) {
            this.errorMessage = error.error.detail;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Error al cargar las estadísticas del doctor';
          }

          // Mostrar toast con el error
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: this.errorMessage,
            life: 5000
          });
        }
      });
    } else if (this.currentUser.role === 'patient') {
      this.loadPatientStatistics(this.currentUser.id!);
    }
  }

  loadPatientStatistics(patientId: number): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    console.log('Loading patient statistics for patient:', patientId);
    console.log('Date range:', this.rangeDates);

    if (this.rangeDates && this.rangeDates.length > 0 && this.rangeDates[0]) {
      const startDate = this.rangeDates[0].toISOString().split('T')[0];
      const endDate = (this.rangeDates[1] ? this.rangeDates[1] : this.rangeDates[0]).toISOString().split('T')[0];

      console.log('Using date range:', startDate, 'to', endDate);

      // Obtener estadísticas que ya incluyen los registros
      this.recordService.getPatientStatisticsByRange(patientId, startDate, endDate).subscribe({
        next: (data: PatientStadistics) => {
          console.log('Patient statistics by range received:', data);
          this.statistics = data;
          this.medicalRecords = data.records || [];
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching patient data by range:', error);
          this.isLoading = false;
          this.hasError = true;

          // Extraer el mensaje de error del backend
          if (error.error && error.error.detail) {
            this.errorMessage = error.error.detail;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Error al cargar las estadísticas del paciente para el rango de fechas';
          }

          // Mostrar toast con el error
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: this.errorMessage,
            life: 5000
          });
        }
      });
    } else {
      console.log('Loading all patient statistics');

      // Obtener estadísticas que ya incluyen los registros
      this.recordService.getPatientStatistics(patientId).subscribe({
        next: (data: PatientStadistics) => {
          console.log('Patient statistics received:', data);
          this.statistics = data;
          this.medicalRecords = data.records || [];
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching patient data:', error);
          this.isLoading = false;
          this.hasError = true;

          // Extraer el mensaje de error del backend
          if (error.error && error.error.detail) {
            this.errorMessage = error.error.detail;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Error al cargar las estadísticas del paciente';
          }

          // Mostrar toast con el error
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: this.errorMessage,
            life: 5000
          });
        }
      });
    }
  }

  applyDateFilter(): void {
    console.log('Applying date filter:', this.rangeDates);

    if (this.currentUser.role === 'patient') {
      this.loadPatientStatistics(this.currentUser.id!);
    } else if (this.currentUser.role === 'doctor' && this.selectedPatient?.id) {
      this.loadPatientStatistics(this.selectedPatient.id);
    } else if (this.currentUser.role === 'doctor' && (!this.selectedPatient || this.selectedPatient === null)) {
      // Cargar estadísticas del doctor con filtro de fechas cuando no hay paciente seleccionado
      this.loadPatientsStadistics();
    } else {
      // Mostrar mensaje si no hay paciente seleccionado
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un paciente antes de aplicar filtros',
        life: 3000
      });
    }
  }

  clearFilters(): void {
    this.rangeDates = undefined;

    // Recargar datos sin filtros
    if (this.currentUser.role === 'patient') {
      this.loadPatientStatistics(this.currentUser.id!);
    } else if (this.currentUser.role === 'doctor' && this.selectedPatient?.id) {
      this.loadPatientStatistics(this.selectedPatient.id);
    } else if (this.currentUser.role === 'doctor' && (!this.selectedPatient || this.selectedPatient === null)) {
      // Cargar estadísticas generales del doctor cuando no hay paciente seleccionado
      this.loadPatientsStadistics();
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Filtros limpiados',
      detail: 'Se han eliminado los filtros de fecha',
      life: 2000
    });
  }

  retryLoad(): void {
    // Limpiar estados de error
    this.hasError = false;
    this.errorMessage = '';

    // Intentar cargar datos nuevamente según el contexto
    if (this.currentUser.role === 'doctor') {
      if (this.selectedPatient?.id) {
        this.loadPatientStatistics(this.selectedPatient.id);
      } else {
        this.loadPatientsStadistics();
      }
    } else if (this.currentUser.role === 'patient') {
      this.loadPatientStatistics(this.currentUser.id!);
    }
  }

  updateCharts(): void {
    if (!this.statistics) return;

    this.updateStatsBarChart();
    this.updateRiskDoughnutChart();
    this.updateRangeLineChart();
    this.updateTemperatureEvolutionChart();
    this.updateHeartRateEvolutionChart();
    this.updateOxygenSaturationEvolutionChart();
  }

  updateStatsBarChart(): void {
    const stats = this.statistics.data.estadisticas;

    this.statsBarChartData = {
      labels: ['Temperatura (°C)', 'Frecuencia Cardíaca (bpm)', 'Saturación O2 (%)'],
      datasets: [
        {
          label: 'Mínimo',
          data: [stats.temperatura.minimo, stats.frecuencia_cardiaca.minimo, stats.saturacion_oxigeno.minimo],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Media',
          data: [stats.temperatura.media, stats.frecuencia_cardiaca.media, stats.saturacion_oxigeno.media],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Máximo',
          data: [stats.temperatura.maximo, stats.frecuencia_cardiaca.maximo, stats.saturacion_oxigeno.maximo],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  updateRiskDoughnutChart(): void {
    const risks = this.statistics.data.probabilidades_riesgo;

    if (!risks) return;

    // Filtrar solo los riesgos que tienen valores mayores a 0 para una mejor visualización
    const riskEntries = [
      { label: 'Taquicardia', value: risks.riesgo_taquicardia, color: '#FF6384' },
      { label: 'Bradicardia', value: risks.riesgo_bradicardia, color: '#36A2EB' },
      { label: 'Taquipnea', value: risks.riesgo_taquipnea, color: '#FFCE56' },
      { label: 'Bradipnea', value: risks.riesgo_bradipnea, color: '#4BC0C0' },
      { label: 'Fiebre', value: risks.riesgo_fiebre, color: '#9966FF' },
      { label: 'Hipotermia', value: risks.riesgo_hipotermia, color: '#FF9F40' },
      { label: 'Hipertensión', value: risks.riesgo_hipertension, color: '#FF6B6B' },
      { label: 'Hipotensión', value: risks.riesgo_hipotension, color: '#4ECDC4' },
      { label: 'Baja Saturación', value: risks.riesgo_baja_saturacion, color: '#45B7D1' }
    ].filter(risk => risk.value > 0); // Solo mostrar riesgos con valores mayores a 0

    // Si no hay riesgos, mostrar un mensaje en el centro
    if (riskEntries.length === 0) {
      this.riskDoughnutChartData = {
        labels: ['Sin riesgos detectados'],
        datasets: [{
          data: [100],
          backgroundColor: ['#28a745'],
          borderColor: ['#fff'],
          borderWidth: 2
        }]
      };
    } else {
      this.riskDoughnutChartData = {
        labels: riskEntries.map(risk => risk.label),
        datasets: [{
          data: riskEntries.map(risk => risk.value),
          backgroundColor: riskEntries.map(risk => risk.color),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      };
    }
  }

  updateRangeLineChart(): void {
    const stats = this.statistics.data.estadisticas;
    const params = this.statistics.data.parametros;

    this.rangeLineChartData = {
      labels: ['Temperatura', 'Frecuencia Cardíaca', 'Saturación O2'],
      datasets: [
        {
          label: 'Valor Actual (Media)',
          data: [stats.temperatura.media, stats.frecuencia_cardiaca.media, stats.saturacion_oxigeno.media],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          tension: 0.1
        },
        {
          label: 'Límite Inferior Riesgo',
          data: [params.rango_hipotermia, params.rango_bradicardia, params.rango_baja_saturacion],
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1
        },
        {
          label: 'Límite Superior Riesgo',
          data: [params.rango_fiebre, params.rango_taquicardia, 100],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1
        }
      ]
    };
  }

  getHighestRisk(): string {
    if (!this.statistics) return '';

    const risks = this.statistics.data.probabilidades_riesgo;
    if (!risks) return '';

    const riskNames: { [key: string]: string } = {
      'riesgo_taquicardia': 'Taquicardia',
      'riesgo_bradicardia': 'Bradicardia',
      'riesgo_taquipnea': 'Taquipnea',
      'riesgo_bradipnea': 'Bradipnea',
      'riesgo_fiebre': 'Fiebre',
      'riesgo_hipotermia': 'Hipotermia',
      'riesgo_hipertension': 'Hipertensión',
      'riesgo_hipotension': 'Hipotensión',
      'riesgo_baja_saturacion': 'Baja Saturación'
    };

    let maxRisk = 0;
    let maxRiskName = '';

    Object.entries(risks).forEach(([key, value]) => {
      const riskValue = value as number;
      if (riskValue > maxRisk) {
        maxRisk = riskValue;
        maxRiskName = riskNames[key];
      }
    });

    return maxRisk > 0 ? `${maxRiskName} (${maxRisk}%)` : 'Sin riesgos detectados';
  }

  getRiskLevel(risk: number): string {
    if (risk >= 70) return 'Alto';
    if (risk >= 40) return 'Medio';
    if (risk > 0) return 'Bajo';
    return 'Sin riesgo';
  }

  getRiskColor(risk: number): string {
    if (risk >= 70) return '#dc3545';
    if (risk >= 40) return '#ffc107';
    if (risk > 0) return '#28a745';
    return '#6c757d';
  }

  get riskData(): any {
    return this.statistics?.data?.probabilidades_riesgo || {};
  }

  getVariance(): number {
    if (!this.statistics) return 0;
    const deviation = this.statistics.data.estadisticas.temperatura.desviacion_estandar;
    return deviation * deviation;
  }

  updateTemperatureEvolutionChart(): void {
    if (!this.medicalRecords || this.medicalRecords.length === 0) return;

    // Ordenar registros por fecha
    const sortedRecords = [...this.medicalRecords].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Extraer datos de temperatura y fechas
    const temperatureData = sortedRecords.map(record => record.temperature);
    const labels = sortedRecords.map(record =>
      new Date(record.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    // Obtener estadísticas de temperatura
    const tempStats = this.statistics.data.estadisticas.temperatura;
    const tempParams = this.statistics.data.parametros;

    // Crear líneas de referencia constantes
    const meanLine = new Array(temperatureData.length).fill(tempStats.media);
    const medianLine = new Array(temperatureData.length).fill(tempStats.mediana);
    const stdUpperLine = new Array(temperatureData.length).fill(tempStats.media + tempStats.desviacion_estandar);
    const stdLowerLine = new Array(temperatureData.length).fill(tempStats.media - tempStats.desviacion_estandar);
    const feverLine = new Array(temperatureData.length).fill(tempParams.rango_fiebre);
    const hypothermiaLine = new Array(temperatureData.length).fill(tempParams.rango_hipotermia);

    this.temperatureEvolutionChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Temperatura Registrada',
          data: temperatureData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.1,
          fill: false
        },
        {
          label: `Media (${tempStats.media.toFixed(2)}°C)`,
          data: meanLine,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Mediana (${tempStats.mediana.toFixed(2)}°C)`,
          data: medianLine,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderDash: [10, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `+1σ (${(tempStats.media + tempStats.desviacion_estandar).toFixed(2)}°C)`,
          data: stdUpperLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: '+1'
        },
        {
          label: `-1σ (${(tempStats.media - tempStats.desviacion_estandar).toFixed(2)}°C)`,
          data: stdLowerLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Límite Fiebre (${tempParams.rango_fiebre}°C)`,
          data: feverLine,
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Límite Hipotermia (${tempParams.rango_hipotermia}°C)`,
          data: hypothermiaLine,
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    };
  }

  updateHeartRateEvolutionChart(): void {
    if (!this.medicalRecords || this.medicalRecords.length === 0) return;

    // Ordenar registros por fecha
    const sortedRecords = [...this.medicalRecords].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Extraer datos de frecuencia cardíaca y fechas
    const heartRateData = sortedRecords.map(record => record.heart_rate);
    const labels = sortedRecords.map(record =>
      new Date(record.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    // Obtener estadísticas de frecuencia cardíaca
    const hrStats = this.statistics.data.estadisticas.frecuencia_cardiaca;
    const hrParams = this.statistics.data.parametros;

    // Crear líneas de referencia constantes
    const meanLine = new Array(heartRateData.length).fill(hrStats.media);
    const medianLine = new Array(heartRateData.length).fill(hrStats.mediana);
    const stdUpperLine = new Array(heartRateData.length).fill(hrStats.media + hrStats.desviacion_estandar);
    const stdLowerLine = new Array(heartRateData.length).fill(hrStats.media - hrStats.desviacion_estandar);
    const tachycardiaLine = new Array(heartRateData.length).fill(hrParams.rango_taquicardia);
    const bradycardiaLine = new Array(heartRateData.length).fill(hrParams.rango_bradicardia);

    this.heartRateEvolutionChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Frecuencia Cardíaca Registrada',
          data: heartRateData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.1,
          fill: false
        },
        {
          label: `Media (${hrStats.media.toFixed(1)} bpm)`,
          data: meanLine,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Mediana (${hrStats.mediana.toFixed(1)} bpm)`,
          data: medianLine,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderDash: [10, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `+1σ (${(hrStats.media + hrStats.desviacion_estandar).toFixed(1)} bpm)`,
          data: stdUpperLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: '+1'
        },
        {
          label: `-1σ (${(hrStats.media - hrStats.desviacion_estandar).toFixed(1)} bpm)`,
          data: stdLowerLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Límite Taquicardia (${hrParams.rango_taquicardia} bpm)`,
          data: tachycardiaLine,
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Límite Bradicardia (${hrParams.rango_bradicardia} bpm)`,
          data: bradycardiaLine,
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    };
  }

  updateOxygenSaturationEvolutionChart(): void {
    if (!this.medicalRecords || this.medicalRecords.length === 0) return;

    // Ordenar registros por fecha
    const sortedRecords = [...this.medicalRecords].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Extraer datos de saturación de oxígeno y fechas
    const oxygenSaturationData = sortedRecords.map(record => record.oxygen_saturation);
    const labels = sortedRecords.map(record =>
      new Date(record.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    // Obtener estadísticas de saturación de oxígeno
    const o2Stats = this.statistics.data.estadisticas.saturacion_oxigeno;
    const o2Params = this.statistics.data.parametros;

    // Crear líneas de referencia constantes
    const meanLine = new Array(oxygenSaturationData.length).fill(o2Stats.media);
    const medianLine = new Array(oxygenSaturationData.length).fill(o2Stats.mediana);
    const stdUpperLine = new Array(oxygenSaturationData.length).fill(o2Stats.media + o2Stats.desviacion_estandar);
    const stdLowerLine = new Array(oxygenSaturationData.length).fill(o2Stats.media - o2Stats.desviacion_estandar);
    const lowSaturationLine = new Array(oxygenSaturationData.length).fill(o2Params.rango_baja_saturacion);
    const normalLine = new Array(oxygenSaturationData.length).fill(95); // Línea de saturación normal

    this.oxygenSaturationEvolutionChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Saturación O2 Registrada',
          data: oxygenSaturationData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.1,
          fill: false
        },
        {
          label: `Media (${o2Stats.media.toFixed(1)}%)`,
          data: meanLine,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Mediana (${o2Stats.mediana.toFixed(1)}%)`,
          data: medianLine,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2,
          borderDash: [10, 5],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `+1σ (${(o2Stats.media + o2Stats.desviacion_estandar).toFixed(1)}%)`,
          data: stdUpperLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: '+1'
        },
        {
          label: `-1σ (${(o2Stats.media - o2Stats.desviacion_estandar).toFixed(1)}%)`,
          data: stdLowerLine,
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: 'Saturación Normal (95%)',
          data: normalLine,
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: `Límite Baja Saturación (${o2Params.rango_baja_saturacion}%)`,
          data: lowSaturationLine,
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          borderDash: [15, 10],
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    };
  }

  updateChartVisibility(): void {
    // Resetear todas las visibilidades
    this.chartVisibility = {
      statsBar: false,
      riskRadar: false,
      rangeComparison: false,
      temperatureEvolution: false,
      heartRateEvolution: false,
      oxygenSaturationEvolution: false
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

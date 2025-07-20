export interface SensorData {
    topic: string;
    data: {
      patient_id: number;
      doctor_id?: number;
      temperature?: number;
      blood_pressure?: number;
      oxygen_saturation?: number;
      heart_rate?: number;
      ecg_values?: number[];
      ecg?: number[];
    };
}
export interface MedicalRecordCreated {
    type: 'medical_record_created';
    patient_id: number;
    doctor_id: number;
    record_id: number;
    timestamp: number;
    data: {
        temperature: number;
        blood_pressure: number;
        oxygen_saturation: number;
        heart_rate: number;
    };
    message: string;
}

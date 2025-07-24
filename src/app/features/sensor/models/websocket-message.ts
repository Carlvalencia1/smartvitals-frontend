export interface WebSocketMessage {
    topic?: string;
    data?: any;
    type?: string;
    patient_id?: number;
    doctor_id?: number;
    record_id?: number;
    timestamp?: number;
    message?: string;
    alertas?: string[];
}

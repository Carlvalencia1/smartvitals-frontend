import { Record } from "./record"

export interface PatientStadistics {
  "data": {
    "estadisticas": {
      "temperatura": {
        "media": number,
        "mediana": number,
        "moda": number,
        "desviacion_estandar": number,
        "minimo": number,
        "maximo": number,
        "rango": number
      },
      "presion_arterial": {
        "media": number,
        "mediana": number,
        "moda": number,
        "desviacion_estandar": number,
        "minimo": number,
        "maximo": number,
        "rango": number
      },
      "saturacion_oxigeno": {
        "media": number,
        "mediana": number,
        "moda": number,
        "desviacion_estandar": number,
        "minimo": number,
        "maximo": number,
        "rango": number
      },
      "frecuencia_cardiaca": {
        "media": number,
        "mediana": number,
        "moda": number,
        "desviacion_estandar": number,
        "minimo": number,
        "maximo": number,
        "rango": number
      },
      "resumen": {
        "total_registros": number,
        "periodo_analisis": {
          "fecha_inicio": string,
          "fecha_fin": string
        }
      }
    },
    "probabilidades_riesgo": {
      "riesgo_taquicardia": number,
      "riesgo_bradicardia": number,
      "riesgo_taquipnea": number,
      "riesgo_bradipnea": number,
      "riesgo_fiebre": number,
      "riesgo_hipotermia": number,
      "riesgo_hipertension": number,
      "riesgo_hipotension": number,
      "riesgo_baja_saturacion": number
    },
    "parametros": {
      "rango_bradicardia": number,
      "rango_taquicardia": number,
      "rango_bradiapnea": number,
      "rango_taquipnea": number,
      "rango_hipotermia": number,
      "rango_fiebre": number,
      "rango_hipertension": number,
      "rango_hipotension": number,
      "rango_baja_saturacion": number
    },
    "combinaciones_clinicas"?: {
      probabilidad_agitacion?: number,
      probabilidad_shock?: number
      // Puedes agregar más combinaciones clínicas aquí si tu backend las devuelve
    }
  },
  "records": Record[];
}
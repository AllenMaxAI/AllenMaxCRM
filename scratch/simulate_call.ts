
import axios from 'axios';

const url = "https://bonded-wasabi-quintuple.ngrok-free.dev/api/webhook/retell?clinic_id=OkfqLr3tVyRgAEBGAqlgBbatOGU2&api_key=amx_live_OkfqLr3t_BbatOGU2";

const mockPayload = {
  event: "call_analyzed",
  call: {
    call_id: "call_simulated_" + Date.now(),
    from_number: "+34600000000",
    to_number: "+34910000000",
    duration_ms: 125000,
    transcript: "Hola, llamo para pedir una cita para una limpieza dental el martes por la mañana. Me llamo Juan Pérez.",
    recording_url: "https://example.com/recording.mp3",
    start_timestamp: Date.now(),
    call_analysis: {
      call_summary: "El paciente Juan Pérez solicita una cita para limpieza dental el martes por la mañana. Se le ha confirmado la disponibilidad.",
      user_sentiment: "Positive",
      custom_analysis_data: {
        intent: "Cita",
        patient_name: "Juan Pérez"
      }
    }
  }
};

async function test() {
  console.log("Enviando llamada simulada a:", url);
  try {
    const response = await axios.post(url, mockPayload);
    console.log("Respuesta del servidor:", response.status, response.data);
  } catch (error: any) {
    console.error("Error en la simulación:", error.response?.status, error.response?.data || error.message);
  }
}

test();

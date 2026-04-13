import axios from 'axios';

// IP local del PC en la red WiFi.
// Cámbiala si cambias de red o de PC.
// Para encontrarla: ejecuta `ipconfig` y busca "Dirección IPv4" bajo el adaptador WiFi.
const BACKEND_URL = 'https://psychogenic-palmar-darcel.ngrok-free.dev';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

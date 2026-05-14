import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { register } from '../../../data/repositories/AuthRepository';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!email || !username || !password || !confirmPassword) {
      setError('Rellena todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await register(email, username, password);
      Alert.alert(
        'Cuenta creada',
        `Bienvenido, ${user.username}. Ya puedes iniciar sesión.`,
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 409) {
        setError(detail ?? 'El email o nombre de usuario ya existe');
      } else if (status === 422) {
        setError('Datos inválidos. Revisa el email y la contraseña.');
      } else {
        setError(getApiErrorMessage(err, 'Error de conexión al crear la cuenta.'));
      }
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.replace('/login');
  }

  return {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    handleRegister,
    goToLogin,
  };
}

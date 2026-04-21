import { Button, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useResetPasswordViewModel } from './ResetPasswordViewModel';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const {
    token,
    setToken,
    password,
    setPassword,
    loading,
    error,
    message,
    handleSubmit,
    goToLogin,
  } = useResetPasswordViewModel(params.token);

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Nueva contrasena
      </Text>

      <Text style={{ marginBottom: 16 }}>
        Abre esta pantalla desde el enlace del correo o pega aqui el token si hace falta.
      </Text>

      <Text>Token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        placeholder="token de recuperacion"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      <Text>Nueva contrasena</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="********"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text> : null}
      {message ? <Text style={{ color: 'green', marginBottom: 16 }}>{message}</Text> : null}

      <Button
        title={loading ? 'Actualizando...' : 'Cambiar contrasena'}
        onPress={handleSubmit}
        disabled={loading}
      />

      <View style={{ marginTop: 16 }}>
        <Button title="Volver a iniciar sesion" onPress={goToLogin} />
      </View>
    </View>
  );
}

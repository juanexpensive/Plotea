import { Button, Text, TextInput, View } from 'react-native';
import { useForgotPasswordViewModel } from './ForgotPasswordViewModel';

export default function ForgotPasswordScreen() {
  const { email, setEmail, loading, error, message, handleSubmit, goToLogin } =
    useForgotPasswordViewModel();

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Recuperar contrasena
      </Text>

      <Text style={{ marginBottom: 16 }}>
        Introduce tu email y te enviaremos un enlace para restablecer la contrasena.
      </Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text> : null}
      {message ? <Text style={{ color: 'green', marginBottom: 16 }}>{message}</Text> : null}

      <Button
        title={loading ? 'Enviando...' : 'Enviar enlace'}
        onPress={handleSubmit}
        disabled={loading}
      />

      <View style={{ marginTop: 16 }}>
        <Button title="Volver a iniciar sesion" onPress={goToLogin} />
      </View>
    </View>
  );
}

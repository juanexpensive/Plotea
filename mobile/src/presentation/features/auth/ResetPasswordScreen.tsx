import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { AuthFormLayout } from './AuthFormLayout';
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
    <AuthFormLayout
      eyebrow="Nueva contrasena"
      title="Define una contrasena nueva y vuelve a entrar."
      subtitle="Abre esta pantalla desde el enlace del correo o pega aqui el token si hace falta."
    >
      <Text style={styles.label}>Token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        placeholder="token de recuperacion"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      <Text style={styles.label}>Nueva contrasena</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="********"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed ? styles.pressed : null,
          loading ? styles.disabled : null,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>{loading ? 'Actualizando...' : 'Cambiar contrasena'}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Cuando termines</Text>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
          onPress={goToLogin}
        >
          <Text style={styles.secondaryButtonText}>Volver al login</Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  label: sharedStyles.label,
  input: sharedStyles.input,
  errorText: sharedStyles.errorText,
  successText: sharedStyles.successText,
  primaryButton: sharedStyles.primaryButton,
  primaryButtonText: sharedStyles.primaryButtonText,
  secondaryButton: sharedStyles.secondaryButton,
  secondaryButtonText: sharedStyles.secondaryButtonText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
    flexWrap: 'wrap',
    marginTop: darkDesign.spacing.xs,
  },
  footerText: sharedStyles.captionMuted,
});

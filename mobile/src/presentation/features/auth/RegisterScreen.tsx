import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { AuthFormLayout } from './AuthFormLayout';
import { useRegisterViewModel } from './RegisterViewModel';

export default function RegisterScreen() {
  const {
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
  } = useRegisterViewModel();

  return (
    <AuthFormLayout
      eyebrow="Crear cuenta"
      title="Empieza a guardar lo que ves y lo que no quieres perder de vista."
      subtitle="Crea tu perfil para llevar tus listas y reseñas."
    >
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="usuario123"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="********"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      <Text style={styles.label}>Repite la contraseña</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="********"
        placeholderTextColor={darkDesign.colors.textFaint}
        style={styles.input}
        selectionColor={darkDesign.colors.accent}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed ? styles.pressed : null,
          loading ? styles.disabled : null,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>{loading ? 'Registrando...' : 'Crear cuenta'}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Ya tienes cuenta</Text>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
          onPress={goToLogin}
        >
          <Text style={styles.secondaryButtonText}>Iniciar sesion</Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  label: sharedStyles.label,
  input: sharedStyles.input,
  errorText: sharedStyles.errorText,
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

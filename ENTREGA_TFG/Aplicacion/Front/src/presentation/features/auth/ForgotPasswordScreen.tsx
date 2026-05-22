import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { AuthFormLayout } from './AuthFormLayout';
import { useForgotPasswordViewModel } from './ForgotPasswordViewModel';

export default function ForgotPasswordScreen() {
  const { email, setEmail, loading, error, message, handleSubmit, goToLogin } =
    useForgotPasswordViewModel();

  return (
    <AuthFormLayout
      eyebrow="Recuperacion"
      title="Recupera el acceso a tu cuenta."
      subtitle="Introduce tu email y te enviaremos un enlace para restablecer la contraseña."
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
        <Text style={styles.primaryButtonText}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Ya tienes tu acceso</Text>
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

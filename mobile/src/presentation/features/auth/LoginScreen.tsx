import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLoginViewModel } from './LoginViewModel';
import { darkDesign } from '../../theme/darkDesign';

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
    goToRegister,
    goToForgotPassword,
  } = useLoginViewModel();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesion</Text>

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

          <Text style={styles.label}>Contrasena</Text>
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

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.buttonPressed : null,
              loading ? styles.buttonDisabled : null,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Entrando...' : 'Entrar en PlotSkip'}</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.linkRow, pressed ? styles.linkPressed : null]} onPress={goToForgotPassword}>
            <Text style={styles.linkText}>He olvidado mi contrasena</Text>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Aun no tienes cuenta</Text>
            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]} onPress={goToRegister}>
              <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.xl,
    paddingVertical: darkDesign.spacing.huge,
    gap: darkDesign.spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    padding: darkDesign.spacing.xl,
    gap: darkDesign.spacing.md,
    ...darkDesign.shadows.card,
  },
  cardTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  label: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.canvasInset,
    color: darkDesign.colors.text,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.sm,
    ...darkDesign.typography.body,
  },
  errorText: {
    color: darkDesign.colors.danger,
    ...darkDesign.typography.caption,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.lg,
    marginTop: darkDesign.spacing.xs,
  },
  primaryButtonText: {
    color: darkDesign.colors.onAccent,
    ...darkDesign.typography.button,
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.lg,
  },
  secondaryButtonText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.button,
  },
  linkRow: {
    alignSelf: 'flex-start',
    paddingVertical: darkDesign.spacing.sm,
  },
  linkPressed: {
    opacity: 0.72,
  },
  linkText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: darkDesign.colors.border,
    marginVertical: darkDesign.spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
    flexWrap: 'wrap',
  },
  footerText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
});

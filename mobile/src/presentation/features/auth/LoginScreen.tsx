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
        <View style={styles.hero}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker}>PlotSkip</Text>
          </View>
          <Text style={styles.title}>Guarda peliculas, sigue a tu gente y vuelve justo a lo importante.</Text>
          <Text style={styles.subtitle}>
            Lleva tu historial, descubre nuevas recomendaciones y comparte lo que vas viendo.
          </Text>
          <View style={styles.highlights}>
            <InfoChip label="Diario" value="Visionados y notas" />
            <InfoChip label="Descubre" value="Peliculas y series" />
            <InfoChip label="Comunidad" value="Resenas y listas" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesion</Text>
          <Text style={styles.cardBody}>Accede a tu espacio y recupera lo que dejaste pendiente.</Text>

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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value}</Text>
    </View>
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
    gap: darkDesign.spacing.xxl,
  },
  hero: {
    gap: darkDesign.spacing.lg,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
  },
  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: darkDesign.radii.pill,
    backgroundColor: darkDesign.colors.accent,
  },
  kicker: {
    color: darkDesign.colors.accentSoft,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.hero,
  },
  subtitle: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    maxWidth: 480,
  },
  highlights: {
    gap: darkDesign.spacing.sm,
  },
  infoChip: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingVertical: darkDesign.spacing.md,
    ...darkDesign.shadows.soft,
  },
  infoChipLabel: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoChipValue: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    fontWeight: '600',
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
  cardBody: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    marginBottom: darkDesign.spacing.sm,
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

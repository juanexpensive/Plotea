import { PropsWithChildren } from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

type AuthFormLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
}>;

export function AuthFormLayout({ eyebrow, title, subtitle, children }: AuthFormLayoutProps) {
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
            <Text style={styles.kicker}>{eyebrow}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.xl,
    paddingVertical: darkDesign.spacing.huge,
    gap: darkDesign.spacing.xl,
  },
  hero: {
    gap: darkDesign.spacing.md,
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
    ...darkDesign.typography.micro,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: sharedStyles.heroTitle,
  subtitle: sharedStyles.muted,
  card: {
    ...sharedStyles.panel,
    ...darkDesign.shadows.card,
  },
});

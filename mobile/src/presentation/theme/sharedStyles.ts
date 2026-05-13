import { darkDesign } from './darkDesign';

export const sharedStyles = {
  screen: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: darkDesign.spacing.xl,
    paddingTop: 56,
    paddingBottom: 32,
    gap: darkDesign.spacing.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: darkDesign.spacing.xl,
  },
  panel: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.md,
    ...darkDesign.shadows.soft,
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
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top' as const,
  },
  label: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600' as const,
  },
  title: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  heroTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.hero,
  },
  body: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
  },
  muted: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
  },
  captionMuted: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: darkDesign.spacing.lg,
  },
  primaryButtonText: {
    color: darkDesign.colors.onAccent,
    ...darkDesign.typography.button,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: darkDesign.spacing.lg,
  },
  secondaryButtonText: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.button,
  },
  dangerButton: {
    minHeight: 42,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: '#7a3030',
    backgroundColor: '#2a1515',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: darkDesign.spacing.lg,
  },
  dangerButtonText: {
    color: '#ffb0b0',
    ...darkDesign.typography.button,
  },
  linkText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600' as const,
  },
  errorText: {
    color: darkDesign.colors.danger,
    ...darkDesign.typography.caption,
  },
  successText: {
    color: darkDesign.colors.success,
    ...darkDesign.typography.caption,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.58,
  },
} as const;

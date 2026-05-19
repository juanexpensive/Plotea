import { Pressable, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../theme/darkDesign';

export function ProfileTopTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
      <View style={[styles.indicator, active ? styles.indicatorActive : null]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
    paddingTop: darkDesign.spacing.sm,
    paddingBottom: darkDesign.spacing.md,
  },
  label: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelActive: {
    color: darkDesign.colors.text,
  },
  indicator: {
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: darkDesign.colors.accent,
  },
});

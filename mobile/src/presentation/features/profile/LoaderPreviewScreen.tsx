import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

export default function LoaderPreviewScreen() {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Preview</Text>
        <Text style={styles.title}>Animacion de carga de Plotea</Text>
        <Text style={styles.body}>
          La estrella gira en bucle constante, sin aparecer ni desaparecer entre ciclos.
        </Text>
      </View>

      <View style={styles.stageCard}>
        <Text style={styles.stageTitle}>Vista principal</Text>
        <View style={styles.stage}>
          <PlotStarLoader size="large" label="Cargando perfil..." />
        </View>
      </View>

      <View style={styles.inlineRow}>
        <View style={styles.inlineCard}>
          <Text style={styles.inlineTitle}>Tamano pequeno</Text>
          <PlotStarLoader size="small" />
        </View>
        <View style={styles.inlineCard}>
          <Text style={styles.inlineTitle}>Tamano medio</Text>
          <PlotStarLoader size={48} />
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Pensado para sustituir el spinner</Text>
        <Text style={styles.noteBody}>
          Lo he preparado para usarlo tanto en pantallas completas como en bloques pequenos de carga dentro de listas,
          perfil y detalles.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    ...sharedStyles.scrollContent,
    paddingTop: darkDesign.spacing.xxl,
  },
  heroCard: {
    ...sharedStyles.panel,
    gap: darkDesign.spacing.sm,
  },
  eyebrow: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    ...sharedStyles.title,
  },
  body: {
    ...sharedStyles.body,
  },
  stageCard: {
    ...sharedStyles.panel,
  },
  stageTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  stage: {
    minHeight: 280,
    borderRadius: darkDesign.radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1012',
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: darkDesign.spacing.md,
  },
  inlineCard: {
    ...sharedStyles.panel,
    flex: 1,
    alignItems: 'center',
  },
  inlineTitle: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noteCard: {
    ...sharedStyles.panel,
  },
  noteTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  noteBody: {
    ...sharedStyles.body,
  },
});

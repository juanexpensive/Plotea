import { StyleSheet, Text, View } from 'react-native';
import { PublicUserStats } from '../../../domain/entities/social';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

export function UserStatsSection({
  stats,
  loading,
  error,
  title = 'Estadisticas',
}: {
  stats: PublicUserStats | null;
  loading: boolean;
  error: string | null;
  title?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {loading ? <Text style={styles.meta}>Cargando estadisticas...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {stats ? (
        <>
          <View style={styles.grid}>
            <StatCard label="Visionados" value={String(stats.watched_count)} />
            <StatCard label="Horas estimadas" value={stats.estimated_hours.toFixed(1)} />
            <StatCard
              label="Media"
              value={stats.average_rating === null ? 'Sin nota' : stats.average_rating.toFixed(1)}
            />
          </View>
          <View style={styles.genreBlock}>
            <Text style={styles.genreTitle}>Generos mas vistos</Text>
            {stats.top_genres.length === 0 ? (
              <Text style={styles.meta}>Todavia no hay datos suficientes.</Text>
            ) : (
              <View style={styles.genreList}>
                {stats.top_genres.map((genre) => (
                  <View key={genre.name} style={styles.genreChip}>
                    <Text style={styles.genreText}>{`${genre.name} - ${genre.count}`}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: darkDesign.spacing.md,
  },
  title: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.md,
  },
  card: {
    width: '47%',
    ...sharedStyles.panel,
    paddingVertical: darkDesign.spacing.lg,
    alignItems: 'center',
  },
  value: {
    color: darkDesign.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
    textAlign: 'center',
  },
  genreBlock: {
    ...sharedStyles.panel,
  },
  genreTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.sm,
  },
  genreChip: {
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasInset,
    paddingVertical: darkDesign.spacing.sm,
    paddingHorizontal: darkDesign.spacing.md,
  },
  genreText: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.micro,
    fontWeight: '600',
  },
  meta: sharedStyles.captionMuted,
  error: sharedStyles.errorText,
});

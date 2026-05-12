import { StyleSheet, Text, View } from 'react-native';
import { PublicUserStats } from '../../../domain/entities/social';

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
                    <Text style={styles.genreText}>
                      {genre.name} · {genre.count}
                    </Text>
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
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  genreBlock: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    padding: 14,
    gap: 10,
  },
  genreTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3b3b3b',
    backgroundColor: '#121212',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  genreText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    color: '#888',
    fontSize: 13,
  },
  error: {
    color: '#fca5a5',
    fontSize: 13,
  },
});

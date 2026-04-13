import { useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { getHomeFeed } from '../../../data/repositories/MediaRepository';
import { HomeFeed, MediaItem } from '../../../domain/entities/media';

function MediaRow({ title, data }: { title: string; data: MediaItem[] }) {
  return (
    <View>
      <Text>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => `${item.media_type}-${item.tmdb_id}`}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHomeFeed()
      .then(setFeed)
      .catch(() => setError('Error al cargar el contenido'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (error || !feed) {
    return (
      <View>
        <Text>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <Text>PlotSkip</Text>
      <MediaRow title="Trending esta semana" data={feed.trending} />
      <MediaRow title="Películas populares" data={feed.popular_movies} />
      <MediaRow title="Series populares" data={feed.popular_tv} />
    </ScrollView>
  );
}

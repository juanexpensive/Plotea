import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useMyListsViewModel } from './MyListsViewModel';

export default function MyListsScreen() {
  const { lists, loading, saving, error, form, updateForm, submit, openList } = useMyListsViewModel();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mis listas</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nueva lista</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(value) => updateForm({ name: value })}
          placeholder="Nombre de la lista"
          placeholderTextColor="#777"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description ?? ''}
          onChangeText={(value) => updateForm({ description: value })}
          placeholder="Descripcion breve"
          placeholderTextColor="#777"
          multiline
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lista publica</Text>
          <Switch
            value={form.is_public}
            onValueChange={(value) => updateForm({ is_public: value })}
            trackColor={{ false: '#333', true: '#2563eb' }}
            thumbColor="#fff"
          />
        </View>
        <Pressable style={styles.primaryButton} onPress={submit} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Creando...' : 'Crear lista'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.list}>
        {lists.map((list) => (
          <Pressable key={list.id} style={styles.row} onPress={() => openList(list.id)}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{list.name}</Text>
              <Text style={styles.rowMeta}>
                {list.items_count} {list.items_count === 1 ? 'obra' : 'obras'} · {list.is_public ? 'Publica' : 'Privada'}
              </Text>
            </View>
            <Text style={styles.rowAction}>Abrir</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    backgroundColor: '#181818',
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#121212',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#ddd',
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  centered: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
  list: {
    gap: 12,
    paddingBottom: 28,
  },
  row: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#999',
    fontSize: 12,
  },
  rowAction: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
});

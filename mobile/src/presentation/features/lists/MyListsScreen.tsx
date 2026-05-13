import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
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
          placeholderTextColor={darkDesign.colors.textFaint}
          selectionColor={darkDesign.colors.accent}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description ?? ''}
          onChangeText={(value) => updateForm({ description: value })}
          placeholder="Descripcion breve"
          placeholderTextColor={darkDesign.colors.textFaint}
          multiline
          selectionColor={darkDesign.colors.accent}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lista publica</Text>
          <Switch
            value={form.is_public}
            onValueChange={(value) => updateForm({ is_public: value })}
            trackColor={{ false: darkDesign.colors.borderStrong, true: darkDesign.colors.accentDeep }}
            thumbColor="#fff"
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
            saving ? styles.disabled : null,
          ]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Creando...' : 'Crear lista'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={darkDesign.colors.accent} />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.list}>
        {lists.map((list) => (
          <Pressable key={list.id} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]} onPress={() => openList(list.id)}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{list.name}</Text>
              <Text style={styles.rowMeta}>
                {`${list.items_count} ${list.items_count === 1 ? 'obra' : 'obras'} - ${list.is_public ? 'Publica' : 'Privada'}`}
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
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  title: sharedStyles.title,
  card: sharedStyles.panel,
  cardTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  input: sharedStyles.input,
  textArea: sharedStyles.textArea,
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: sharedStyles.body,
  primaryButton: sharedStyles.primaryButton,
  primaryButtonText: sharedStyles.primaryButtonText,
  centered: {
    paddingVertical: darkDesign.spacing.lg,
    alignItems: 'center',
  },
  errorText: sharedStyles.errorText,
  list: {
    gap: darkDesign.spacing.md,
    paddingBottom: darkDesign.spacing.lg,
  },
  row: {
    ...sharedStyles.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: sharedStyles.captionMuted,
  rowAction: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});

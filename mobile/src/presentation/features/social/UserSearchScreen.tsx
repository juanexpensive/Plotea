import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useUserSearchViewModel } from './UserSearchViewModel';
import { UserSearchResults } from './UserSearchResults';

export default function UserSearchScreen() {
  const { query, results, loading, error, isSearching, setQuery, openProfile } = useUserSearchViewModel();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Buscar usuarios</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Busca por username"
        placeholderTextColor={darkDesign.colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={darkDesign.colors.accent}
      />
      <UserSearchResults
        results={results}
        loading={loading}
        error={error}
        isSearching={isSearching}
        onOpenProfile={openProfile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  title: sharedStyles.title,
  searchInput: sharedStyles.input,
});

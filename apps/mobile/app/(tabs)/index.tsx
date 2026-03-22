import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';

// Category types: 'concert' | 'festival' | 'party' | 'activity' | 'sport'
const CATEGORIES = ['All', 'Concert', 'Festival', 'Party', 'Activity', 'Sport'];

const CATEGORY_UI: Record<string, { icon: any, color: string }> = {
  'concert': { icon: 'music.note', color: '#FF6B6B' },
  'festival': { icon: 'sparkles', color: '#4ECDC4' },
  'party': { icon: 'wineglass.fill', color: '#F7D794' },
  'activity': { icon: 'figure.walk', color: '#45B7D1' },
  'sport': { icon: 'sportscourt.fill', color: '#98D8C8' },
};

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(false);
      let url = `/api/events?limit=20&page=1`;
      if (selectedCategory !== 'All') url += `&category=${selectedCategory.toLowerCase()}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      
      const response: any = await api.get(url);
      setEvents(response.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const cat = item.category?.toLowerCase() || 'activity';
    const config = CATEGORY_UI[cat] || CATEGORY_UI['activity'];

    return (
      <Link href={`/events/${item.id}`} asChild>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.imageContainer}>
            {item.coverImage ? (
              <Image source={{ uri: item.coverImage }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: config.color + '15' }]}>
                <IconSymbol name={config.icon} size={48} color={config.color} />
                <Text style={[styles.placeholderText, { color: config.color }]}>{item.category?.toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.cardBadge, { backgroundColor: theme.surface + 'CC' }]}>
               <Text style={[styles.cardBadgeText, { color: theme.text }]}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>{item.name.split('—')[0]}</Text>
            <View style={styles.metaRow}>
              <View style={styles.infoRow}>
                <IconSymbol name="calendar" size={14} color={theme.muted} />
                <Text style={[styles.infoText, { color: theme.muted2 }]} numberOfLines={1}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.findingBuddies}>
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.buddiesText, { color: theme.accent }]}>{item.lookingCount || 0} searching</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol name="mappin" size={14} color={theme.muted} />
              <Text style={[styles.infoText, { color: theme.muted2 }]} numberOfLines={1}>{item.venue}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Discover <Text style={styles.italic}>events</Text></Text>
        
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <IconSymbol name="map" size={18} color={theme.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search events..."
            placeholderTextColor={theme.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchEvents(search)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchEvents(''); }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={16} color={theme.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill, 
                { backgroundColor: selectedCategory === cat ? theme.accent : theme.surface, borderColor: theme.border }
              ]}
            >
              <Text style={[
                styles.categoryText, 
                { color: selectedCategory === cat ? theme.accent_text : theme.text }
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.muted} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Couldn't load events</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.accent }]} onPress={() => fetchEvents()}>
            <Text style={[styles.retryText, { color: theme.accent_text }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchEvents(search)}
          refreshing={loading && events.length > 0}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="calendar" size={48} color={theme.bg3} />
              <Text style={[styles.emptyText, { color: theme.muted2 }]}>No events found for this criteria.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  headerTitle: { fontSize: 36, fontWeight: 'normal', letterSpacing: -1, fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif', marginBottom: 20 },
  italic: { fontStyle: 'italic' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 25, borderWidth: 1, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  categoriesContainer: { paddingRight: 20, paddingBottom: 10, gap: 10 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  listContent: { padding: 20, paddingTop: 10 },
  card: { borderRadius: 24, borderWidth: 1, marginBottom: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  imageContainer: { height: 200, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { fontSize: 10, fontWeight: '900', letterSpacing: 3, marginTop: 4 },
  cardBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  cardBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardContent: { padding: 20 },
  eventTitle: { fontSize: 24, fontWeight: '600', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  findingBuddies: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  buddiesText: { fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, fontWeight: '500' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, paddingTop: 100, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 24, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif', marginTop: 16, marginBottom: 8 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontSize: 16, fontWeight: '700' },
});

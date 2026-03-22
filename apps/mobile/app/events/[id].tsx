import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/api/events/${id}`);
      setEvent(response);
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindSquad = () => {
    router.push({ pathname: '/(tabs)/matches', params: { eventId: id } });
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        title: '', 
        headerTransparent: true, 
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFF" />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event?.coverImage }} style={styles.image} contentFit="cover" />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <Text style={[styles.badgeText, { color: theme.muted }]}>{event?.category?.toUpperCase()}</Text>
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>{event?.name}</Text>
          
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.bg2 }]}>
              <IconSymbol name="calendar" size={20} color={theme.accent_text} />
            </View>
            <View>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>DATE & TIME</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {new Date(event?.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.bg2 }]}>
              <IconSymbol name="mappin.and.ellipse" size={20} color={theme.accent_text} />
            </View>
            <View>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>VENUE</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{event?.venue}</Text>
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About <Text style={styles.italic}>event</Text></Text>
            <Text style={[styles.description, { color: theme.muted2 }]}>
              Experience {event?.name} like never before. Connect with a like-minded squad and share the energy of this incredible {event?.category} event. 
            </Text>
          </View>

          {/* Looking for buddies */}
          <View style={[styles.lookingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.lookingHeader}>
              <Text style={[styles.lookingTitle, { color: theme.text }]}>Looking for buddies</Text>
              <Text style={[styles.lookingCount, { color: theme.accent }]}>{event?.lookingCount || 0}</Text>
            </View>
            <Text style={[styles.lookingDesc, { color: theme.muted2 }]}>
              Join the squad for this event and meet like-minded people who want to enjoy it together!
            </Text>
            <TouchableOpacity style={[styles.inlineCta, { backgroundColor: theme.accent }]} onPress={handleFindSquad}>
              <Text style={[styles.inlineCtaText, { color: theme.accent_text }]}>Find My Squad</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View>
          <Text style={[styles.pricePrefix, { color: theme.muted }]}>starting from</Text>
          <Text style={[styles.priceValue, { color: theme.text }]}>Free</Text>
        </View>
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.accent }]} onPress={handleFindSquad}>
          <Text style={[styles.ctaText, { color: theme.accent_text }]}>Find My Squad</Text>
          <IconSymbol name="person.2.fill" size={18} color={theme.accent_text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 10,
  },
  imageContainer: {
    height: 350,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    backgroundColor: '#FFF', // Forced white for premium contrast
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  descriptionBox: {
    marginTop: 16,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginBottom: 12,
  },
  italic: {
    fontStyle: 'italic',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  lookingBox: {
    marginTop: 32,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 40,
  },
  lookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lookingTitle: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    fontWeight: '500',
  },
  lookingCount: {
    fontSize: 24,
    fontWeight: '800',
  },
  lookingDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inlineCta: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  pricePrefix: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#B8F040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

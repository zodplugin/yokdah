import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Platform, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link, useLocalSearchParams, useRouter, Stack } from 'expo-router';

export default function MatchesScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [event, setEvent] = useState<any>(null);

  // Form states
  const [groupSize, setGroupSize] = useState('1+1');
  const [genderPreference, setGenderPreference] = useState('any');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(30);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response: any = await api.get(`/api/events/${eventId}`);
      setEvent(response);
    } catch (err) {
      console.error("Failed to fetch event for form:", err);
    }
  };

  const handleSubmit = async () => {
    if (!eventId) return;
    
    setErrorMessage("");
    setSubmitting(true);
    
    try {
      await api.post('/api/matches/request', {
        eventId,
        groupSize,
        genderPreference,
        ageMin,
        ageMax,
        vibeTags
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        router.setParams({ eventId: undefined });
        fetchMatches();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.error || err?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(false);
      const response: any = await api.get('/api/matches/requests?status=pending,matched,confirmed');
      setRequests(response.requests || []);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await api.delete(`/api/matches/requests/${requestId}`);
      fetchMatches(); // Refresh
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  const activeSquads = requests.filter(r => r.status === 'matched' || r.status === 'confirmed');
  const pendingRequests = requests.filter(r => r.status === 'pending');

  const renderActiveSquad = (squad: any) => (
    <Link key={squad.id || squad._id} href={`/matches/${squad.matchId || squad.id}`} asChild>
      <TouchableOpacity style={[styles.squadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.squadTitle, { color: theme.text }]} numberOfLines={1}>{squad.eventId?.name || 'Squad'}</Text>
            <Text style={[styles.squadDate, { color: theme.muted2 }]}>
              {new Date(squad.eventId?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.memberCount, { backgroundColor: theme.accent_dim, borderColor: theme.accent }]}>
            <Text style={[styles.memberCountText, { color: theme.accent_text }]}>{squad.members?.length || 0}</Text>
          </View>
        </View>
        
        <View style={styles.membersRow}>
          <View style={styles.avatarStack}>
            {(squad.members || []).slice(0, 4).map((member: any, idx: number) => (
              <Image 
                key={member.id || idx} 
                source={{ uri: member.photo }} 
                style={[
                  styles.avatar, 
                  { 
                    left: idx * 38, 
                    zIndex: 10 - idx, 
                    borderColor: theme.surface 
                  }
                ]} 
              />
            ))}
            {squad.members?.length > 4 && (
              <View style={[styles.avatarMore, { left: 120, backgroundColor: theme.bg3, borderColor: theme.surface }]}>
                <Text style={[styles.avatarMoreText, { color: theme.muted2 }]}>+{squad.members.length - 4}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.statusRow}>
            <IconSymbol name="person.2.fill" size={16} color={theme.accent} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {squad.status === 'confirmed' ? 'Confirmed' : 'Matched'}
            </Text>
          </View>
          <View style={styles.openChat}>
            <Text style={[styles.openChatText, { color: theme.accent }]}>Open chat</Text>
            <IconSymbol name="chevron.right" size={14} color={theme.accent} />
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  const renderPendingRequest = (request: any) => (
    <View key={request._id} style={[styles.pendingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.pendingHeader}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.pendingTitle, { color: theme.text }]} numberOfLines={1}>{request.eventId?.name}</Text>
          <View style={[styles.badge, { backgroundColor: theme.bg3, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: theme.muted }]}>SQUAD OF {request.groupSize}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => cancelRequest(request._id)}
          style={[styles.cancelBtn, { backgroundColor: 'transparent', borderColor: theme.border2 }]}
        >
          <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.pendingFooter, { borderTopColor: theme.border }]}>
        <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
        <Text style={[styles.pendingStatus, { color: theme.muted2 }]}>Searching for your squad...</Text>
      </View>
    </View>
  );

  if (eventId && event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Find Squad', headerShown: true }} />
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            onPress={() => router.setParams({ eventId: undefined })}
            style={styles.backLink}
          >
            <IconSymbol name="chevron.left" size={18} color={theme.muted} />
            <Text style={[styles.backText, { color: theme.muted }]}>Back to event</Text>
          </TouchableOpacity>

          <View style={styles.formHeader}>
            <View style={[styles.miniBadge, { backgroundColor: theme.bg3 }]}>
              <Text style={[styles.miniBadgeText, { color: theme.muted }]}>{event.category?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.formTitle, { color: theme.text }]}>Find your <Text style={styles.italic}>squad</Text></Text>
            <Text style={[styles.formSubtitle, { color: theme.muted2 }]}>
              Join {event.name} · {new Date(event.date).toLocaleDateString()}
            </Text>
          </View>

          {/* Group Size */}
          <View style={[styles.formSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderSmall}>
              <IconSymbol name="person.2.fill" size={20} color={theme.accent} />
              <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>Group Size</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.muted2 }]}>How many people in your squad?</Text>
            <View style={styles.pillContainer}>
              {['1+1', '1+2', '1+3', '1+4', 'flexible'].map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setGroupSize(size)}
                  style={[
                    styles.pill,
                    { backgroundColor: groupSize === size ? theme.accent : theme.bg2, borderColor: theme.border }
                  ]}
                >
                  <Text style={[styles.pillText, { color: groupSize === size ? theme.accent_text : theme.text }]}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gender */}
          <View style={[styles.formSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderSmall}>
              <IconSymbol name="person.fill" size={20} color={theme.accent} />
              <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>Gender Preference</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.muted2 }]}>Who do you want to match with?</Text>
            <View style={styles.pillContainer}>
              {['any', 'female', 'male'].map((pref) => (
                <TouchableOpacity
                  key={pref}
                  onPress={() => setGenderPreference(pref)}
                  style={[
                    styles.pill,
                    { backgroundColor: genderPreference === pref ? theme.accent : theme.bg2, borderColor: theme.border }
                  ]}
                >
                  <Text style={[styles.pillText, { color: genderPreference === pref ? theme.accent_text : theme.text }]}>
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Age Range */}
          <View style={[styles.formSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderSmall}>
              <IconSymbol name="calendar" size={20} color={theme.accent} />
              <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>Age Range</Text>
            </View>
            <View style={styles.ageInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>MIN AGE</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(ageMin)}
                  onChangeText={(v) => setAgeMin(parseInt(v) || 18)}
                  style={[styles.ageInput, { color: theme.text, backgroundColor: theme.bg2, borderColor: theme.border }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>MAX AGE</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(ageMax)}
                  onChangeText={(v) => setAgeMax(parseInt(v) || 99)}
                  style={[styles.ageInput, { color: theme.text, backgroundColor: theme.bg2, borderColor: theme.border }]}
                />
              </View>
            </View>
          </View>

          {errorMessage ? (
            <View style={[styles.messageBox, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <Text style={styles.errorMsgText}>{errorMessage}</Text>
            </View>
          ) : null}

          {submitSuccess ? (
            <View style={[styles.messageBox, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
              <Text style={styles.successMsgText}>Request submitted! Finding squad...</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || submitSuccess}
            style={[styles.submitBtn, { backgroundColor: theme.accent }]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.accent_text} />
            ) : (
              <>
                <Text style={[styles.submitBtnText, { color: theme.accent_text }]}>Find My Squad</Text>
                <IconSymbol name="sparkles" size={18} color={theme.accent_text} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Your <Text style={styles.italic}>squads</Text></Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted2 }]}>Active groups and pending matching requests.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 50 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.muted} />
            <Text style={[styles.errorTitle, { color: theme.text }]}>Couldn't load squads</Text>
            <Text style={[styles.errorSubtitle, { color: theme.muted2 }]}>Check your connection or the server status.</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.accent }]} 
              onPress={fetchMatches}
            >
              <Text style={[styles.retryText, { color: theme.accent_text }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeSquads.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <IconSymbol name="person.2.fill" size={16} color={theme.muted} />
                  <Text style={[styles.sectionTitle, { color: theme.muted }]}>ACTIVE SQUADS</Text>
                </View>
                {activeSquads.map(renderActiveSquad)}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol name="clock.fill" size={16} color={theme.muted} />
                <Text style={[styles.sectionTitle, { color: theme.muted }]}>PENDING REQUESTS</Text>
              </View>
              {pendingRequests.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No pending requests</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.muted2 }]}>Find an event to start matching!</Text>
                </View>
              ) : (
                pendingRequests.map(renderPendingRequest)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  header: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    letterSpacing: -1,
  },
  italic: {
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  squadCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  squadTitle: {
    fontSize: 26,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    lineHeight: 30,
  },
  squadDate: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberCount: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  membersRow: {
    height: 56,
    marginBottom: 32,
  },
  avatarStack: {
    flexDirection: 'row',
    position: 'relative',
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    position: 'absolute',
  },
  avatarMore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  avatarMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openChatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pendingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pendingStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  formContent: {
    padding: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  formHeader: {
    marginBottom: 32,
  },
  miniBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  formSection: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ageInputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  ageInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  messageBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorMsgText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '500',
  },
  successMsgText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 40,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { signOut, user: authUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(false);
      const response: any = await api.get('/api/users/profile');
      setProfile(response);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    router.replace('/(auth)/login'); 
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.muted} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>Couldn't load profile</Text>
        <Text style={[styles.errorSubtitle, { color: theme.muted2 }]}>Check your connection or the server status.</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.accent }]} 
          onPress={fetchProfile}
        >
          <Text style={[styles.retryText, { color: theme.accent_text }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Your <Text style={styles.italic}>profile</Text></Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg3 }]}>
                <Text style={[styles.avatarText, { color: theme.muted }]}>
                  {profile?.displayName?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.displayName, { color: theme.text }]}>{profile?.displayName}</Text>
          <Text style={[styles.bio, { color: theme.muted2 }]}>Passionate event-goer looking for the best squads.</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{profile?.reliabilityScore || 100}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>RELIABILITY</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{profile?.squadsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>SQUADS</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <IconSymbol name="gearshape.fill" size={20} color={theme.muted} />
            <Text style={[styles.menuText, { color: theme.text }]}>Account Settings</Text>
            <IconSymbol name="chevron.right" size={16} color={theme.border2} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <IconSymbol name="bell.fill" size={20} color={theme.muted} />
            <Text style={[styles.menuText, { color: theme.text }]}>Notifications</Text>
            <IconSymbol name="chevron.right" size={16} color={theme.border2} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  header: {
    marginBottom: 32,
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
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 30,
  },
  menuSection: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
});

import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

const VIBE_TAGS = [
  'chill', 'hype', 'introvert-friendly', 'first-timer',
  'regular', 'early bird', 'night owl', 'social butterfly',
  'quiet vibes', 'adventurous', 'spontaneous', 'planner'
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, updateUser, token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    age: '',
    gender: '',
    photo: '', // In a real app, use expo-image-picker
    vibeTags: [] as string[],
    genderPreference: 'any',
    ageMin: 18,
    ageMax: 35,
    defaultGroupSize: 'flexible'
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.displayName || !formData.age || !formData.gender) {
        alert("Please fill all fields");
        return;
      }
    }
    if (step === 3 && formData.vibeTags.length === 0) {
      alert("Please select at least 1 vibe tag");
      return;
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleTag = (tag: string) => {
    setFormData(prev => {
      if (prev.vibeTags.includes(tag)) {
        return { ...prev, vibeTags: prev.vibeTags.filter(t => t !== tag) };
      } else if (prev.vibeTags.length < 3) {
        return { ...prev, vibeTags: [...prev.vibeTags, tag] };
      }
      return prev;
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/api/auth/complete-onboarding', {
        ...formData,
        age: parseInt(formData.age),
      });
      updateUser(res.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.error || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.navbar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={step > 1 ? prevStep : undefined} style={styles.navBtn}>
          {step > 1 && <IconSymbol name="arrow.left" size={24} color={theme.text} />}
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.progressBar, { backgroundColor: i <= step ? theme.accent : theme.border }]} />
          ))}
        </View>
        <View style={styles.navBtn} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.labelCaps, { color: theme.accent }]}>--- IDENTITY</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Tell us about <Text style={styles.italic}>yourself</Text></Text>
              
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>Display Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="What should we call you?"
                    placeholderTextColor={theme.muted}
                    value={formData.displayName}
                    onChangeText={t => setFormData(p => ({ ...p, displayName: t }))}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>Age</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                      placeholder="22"
                      placeholderTextColor={theme.muted}
                      value={formData.age}
                      onChangeText={t => setFormData(p => ({ ...p, age: t }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>Gender</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                      placeholder="e.g. Male"
                      placeholderTextColor={theme.muted}
                      value={formData.gender}
                      onChangeText={t => setFormData(p => ({ ...p, gender: t }))}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.labelCaps, { color: theme.accent }]}>--- APPEARANCE</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Put a face to the <Text style={styles.italic}>name</Text></Text>
              <Text style={[styles.stepSubtitle, { color: theme.muted2 }]}>Upload a clear photo. (Simulated for now)</Text>
              
              <TouchableOpacity style={[styles.photoPlaceholder, { backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed' }]}>
                <IconSymbol name="camera.fill" size={40} color={theme.muted} />
                <Text style={[styles.photoText, { color: theme.muted }]}>Tap to upload photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.labelCaps, { color: theme.accent }]}>--- ENERGY</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>What's your <Text style={styles.italic}>vibe</Text>?</Text>
              <Text style={[styles.stepSubtitle, { color: theme.muted2 }]}>Pick up to 3 tags that describe your energy.</Text>
              
              <View style={styles.tagGrid}>
                {VIBE_TAGS.map(tag => {
                  const isSelected = formData.vibeTags.includes(tag);
                  return (
                    <TouchableOpacity 
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tag, 
                        { borderColor: isSelected ? theme.accent : theme.border, 
                          backgroundColor: isSelected ? theme.accent : theme.surface }
                      ]}
                    >
                      <Text style={[styles.tagText, { color: isSelected ? theme.accent_text : theme.text }]}>{tag}</Text>
                      {isSelected && <IconSymbol name="checkmark" size={14} color={theme.accent_text} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.labelCaps, { color: theme.accent }]}>--- PREFERENCES</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Who do you want to <Text style={styles.italic}>meet</Text>?</Text>
              
              <View style={styles.form}>
                 <Text style={[styles.label, { color: theme.text }]}>Buddy Gender</Text>
                 <View style={styles.row}>
                    {['any', 'female', 'male'].map(g => (
                      <TouchableOpacity 
                        key={g}
                        onPress={() => setFormData(p => ({ ...p, genderPreference: g }))}
                        style={[styles.prefBtn, { 
                          backgroundColor: formData.genderPreference === g ? theme.accent : theme.surface,
                          borderColor: formData.genderPreference === g ? theme.accent : theme.border
                        }]}
                      >
                        <Text style={[styles.prefText, { color: formData.genderPreference === g ? theme.accent_text : theme.text }]}>{g.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                 </View>

                 <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Age Range</Text>
                 <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.helpText, { color: theme.muted }]}>Min: {formData.ageMin}</Text>
                      <TextInput 
                        keyboardType="numeric" 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={formData.ageMin.toString()}
                        onChangeText={t => setFormData(p => ({ ...p, ageMin: parseInt(t) || 18 }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.helpText, { color: theme.muted }]}>Max: {formData.ageMax}</Text>
                      <TextInput 
                        keyboardType="numeric" 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={formData.ageMax.toString()}
                        onChangeText={t => setFormData(p => ({ ...p, ageMax: parseInt(t) || 35 }))}
                      />
                    </View>
                 </View>
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
           {step < 4 ? (
             <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={nextStep}>
               <Text style={[styles.buttonText, { color: theme.accent_text }]}>Continue</Text>
               <IconSymbol name="arrow.right" size={18} color={theme.accent_text} />
             </TouchableOpacity>
           ) : (
             <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.text }]} 
              onPress={handleComplete}
              disabled={loading}
             >
               {loading ? <ActivityIndicator color="#fff" /> : (
                 <>
                   <Text style={[styles.buttonText, { color: theme.background }]}>Complete Setup</Text>
                   <IconSymbol name="checkmark" size={18} color={theme.background} />
                 </>
               )}
             </TouchableOpacity>
           )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  navbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    width: 30,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  labelCaps: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 42,
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    lineHeight: 46,
    marginBottom: 16,
  },
  italic: {
    fontStyle: 'italic',
  },
  stepSubtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  form: {
    gap: 20,
    marginTop: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  photoPlaceholder: {
    height: 300,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  photoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  prefBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefText: {
    fontSize: 12,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 11,
    marginBottom: 4,
  }
});

import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterScreen() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Number, 2: OTP
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleRequestOtp = async () => {
    if (!whatsappNumber) return;
    setLoading(true);
    try {
      await api.post('/api/auth/otp/request', { whatsappNumber });
      setStep(2);
    } catch (error: any) {
      alert(error.error || "Failed to send OTP. Please check your number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const res: any = await api.post('/api/auth/otp/verify', { whatsappNumber, otp });
      signIn(res.token, res.user);
      
      // Since it's Register, we always expect it to go to onboarding if new
      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      alert(error.error || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.left" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {step === 1 ? <>Join the <Text style={styles.italic}>squad</Text></> : <>Verify <Text style={styles.italic}>OTP</Text></>}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted2 }]}>
              {step === 1 
                ? "Create an account with your WhatsApp number to find your perfect event buddies."
                : `Enter the code we sent to ${whatsappNumber}`
              }
            </Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.muted }]}>WhatsApp Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="081234567890"
                  placeholderTextColor={theme.muted}
                  value={whatsappNumber}
                  onChangeText={setWhatsappNumber}
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.muted }]}>Verification Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                  placeholder="------"
                  placeholderTextColor={theme.muted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.accent }]} 
              onPress={step === 1 ? handleRequestOtp : handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.accent_text} />
              ) : (
                <>
                  <Text style={[styles.buttonText, { color: theme.accent_text }]}>
                    {step === 1 ? "Send OTP" : "Verify & Continue"}
                  </Text>
                  <IconSymbol name="arrow.right" size={18} color={theme.accent_text} />
                </>
              )}
            </TouchableOpacity>

            {step === 1 && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.muted2 }]}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.link, { color: theme.text }]}>Log In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </View>
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
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif',
    lineHeight: 46,
    marginBottom: 12,
  },
  italic: {
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    gap: 20,
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
  button: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
});

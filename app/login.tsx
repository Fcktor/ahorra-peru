import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useIsDesktop } from '@/hooks/useIsDesktop';

// Paleta de la tarjeta oscura del login de escritorio — mismo tono que components/DesktopSidebar.tsx
const dark = {
  card: '#12211B',
  input: '#1C3128',
  inputBorder: '#2A4536',
  iconMuted: '#5B7365',
  label: '#8FA79A',
  text: '#DCE7E0',
  bright: '#F6F4EC',
  accent: '#5BC98A',
  error: '#FCA5A5',
};

export default function LoginScreen() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handle = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSuccess('Revisa tu correo para confirmar tu cuenta y luego inicia sesión.');
    } else {
      router.replace('/');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (isDesktop) {
    return (
      <View style={d.screen}>
        <TouchableOpacity style={d.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={d.scrollContent}>
        <View style={d.card}>
          <View style={d.formSide}>
            <Text style={d.logo}>Ahorra<Text style={{ color: dark.accent }}>Perú</Text></Text>

            <View style={d.middle}>
              <Text style={d.title}>{mode === 'login' ? 'Bienvenido\nde vuelta' : 'Crea tu\ncuenta'}</Text>
              <Text style={d.subtitle}>
                {mode === 'login'
                  ? 'Inicia sesión y sigue haciendo crecer tu dinero donde lo dejaste.'
                  : 'Empieza gratis, sin tarjeta de crédito.'}
              </Text>

              <Text style={d.label}>Correo electrónico</Text>
              <View style={d.inputRow}>
                <Ionicons name="mail-outline" size={16} color={dark.iconMuted} />
                <TextInput
                  style={d.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.com"
                  placeholderTextColor={dark.iconMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={[d.label, { marginTop: 16 }]}>Contraseña</Text>
              <View style={d.inputRow}>
                <Ionicons name="lock-closed-outline" size={16} color={dark.iconMuted} />
                <TextInput
                  style={[d.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={dark.iconMuted}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((s) => !s)}>
                  <Text style={d.showToggle}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                </Pressable>
              </View>

              {mode === 'login' && (
                <View style={d.rememberRow}>
                  <Pressable style={d.rememberOption} onPress={() => setRemember((r) => !r)}>
                    <View style={[d.checkbox, remember && d.checkboxChecked]}>
                      {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={d.rememberText}>Recuérdame</Text>
                  </Pressable>
                  <Text style={d.forgotText}>¿Olvidaste tu contraseña?</Text>
                </View>
              )}

              {error ? <Text style={d.error}>{error}</Text> : null}
              {success ? <Text style={d.success}>{success}</Text> : null}

              <TouchableOpacity style={d.submit} onPress={handle} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={d.submitText}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <View style={d.dividerRow}>
                <View style={d.dividerLine} />
                <Text style={d.dividerText}>o</Text>
                <View style={d.dividerLine} />
              </View>

              <TouchableOpacity
                style={d.googleBtn}
                onPress={() => Alert.alert('Próximamente', 'El acceso con Google todavía no está disponible.')}
              >
                <View style={d.googleG}><Text style={d.googleGText}>G</Text></View>
                <Text style={d.googleText}>Continuar con Google</Text>
              </TouchableOpacity>

              <Pressable onPress={toggleMode}>
                <Text style={d.toggle}>
                  {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                  <Text style={{ fontFamily: 'Figtree_700Bold', color: dark.accent }}>
                    {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={d.illustration}>
            <View style={d.sky} />
            <View style={d.sun} />
            <View style={d.hillLeft} />
            <View style={d.hillRight} />
            <View style={d.cloud} />
            <View style={[d.cloud, { top: 92, left: 150, width: 54 }]} />
            <View style={d.meadow} />
            <View style={d.path} />
            <View style={d.tree}>
              <View style={d.trunk} />
              <View style={d.canopy} />
            </View>
          </View>
        </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>AhorraPeru</Text>
        <Text style={styles.title}>
          {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Inicia sesión para acceder a todas las funciones'
            : 'Empieza gratis, sin tarjeta de crédito'}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handle} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.btnText}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.toggle}>
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 24 },
  closeText: { fontSize: 20, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
  logo: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 24 },
  title: { fontSize: 26, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 32 },
  form: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginTop: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Figtree_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.danger, marginTop: 4 },
  successText: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.accent, marginTop: 4 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.background },
  toggle: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.primary, textAlign: 'center', marginTop: 16 },
});

const d = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 32,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 880,
    borderRadius: 28,
    backgroundColor: dark.card,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#12211B',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
  },
  formSide: {
    flex: 1,
    paddingVertical: 28,
    paddingHorizontal: 40,
  },
  logo: { fontFamily: 'Archivo_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: dark.bright },
  middle: { marginTop: 'auto', marginBottom: 'auto', paddingVertical: 16 },
  title: { fontFamily: 'Archivo_800ExtraBold', fontSize: 27, letterSpacing: -0.5, color: dark.bright, lineHeight: 31 },
  subtitle: { fontSize: 13.5, color: dark.label, marginTop: 8, maxWidth: 300, lineHeight: 19 },
  label: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: dark.label, letterSpacing: 0.2, marginTop: 16 },
  inputRow: {
    marginTop: 6,
    backgroundColor: dark.input,
    borderWidth: 1,
    borderColor: dark.inputBorder,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: dark.text,
    paddingVertical: 12,
  },
  showToggle: { fontSize: 12.5, fontFamily: 'Figtree_600SemiBold', color: dark.accent },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  rememberOption: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: dark.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rememberText: { fontSize: 13.5, color: dark.text },
  forgotText: { fontSize: 13.5, fontFamily: 'Figtree_600SemiBold', color: dark.accent },
  error: { fontSize: 13, color: dark.error, marginTop: 10 },
  success: { fontSize: 13, color: dark.accent, marginTop: 10, fontFamily: 'Figtree_600SemiBold' },
  submit: {
    marginTop: 16,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: { fontFamily: 'Archivo_800ExtraBold', fontSize: 15, color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: dark.inputBorder },
  dividerText: { fontSize: 12.5, color: dark.iconMuted },
  googleBtn: {
    borderWidth: 1,
    borderColor: dark.inputBorder,
    borderRadius: 13,
    backgroundColor: dark.input,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleG: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: { fontFamily: 'Archivo_800ExtraBold', fontSize: 13, color: '#4285F4' },
  googleText: { fontSize: 14.5, fontFamily: 'Figtree_600SemiBold', color: dark.text },
  toggle: { fontSize: 13.5, color: dark.label, textAlign: 'center', marginTop: 14 },

  illustration: {
    width: 300,
    minHeight: 420,
    flexShrink: 0,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#8FD3F4',
  },
  sky: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#B8E4F0',
  },
  sun: {
    position: 'absolute',
    top: 38,
    right: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F6C445',
    shadowColor: '#F6C445',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  hillLeft: {
    position: 'absolute',
    top: '34%',
    left: '-10%',
    width: '65%',
    height: 130,
    borderRadius: 999,
    backgroundColor: '#6FB6D8',
  },
  hillRight: {
    position: 'absolute',
    top: '31%',
    right: '-12%',
    width: '68%',
    height: 150,
    borderRadius: 999,
    backgroundColor: '#82C2DE',
  },
  cloud: {
    position: 'absolute',
    top: 56,
    left: 32,
    width: 70,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
  },
  meadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '56%',
    backgroundColor: '#7BC456',
  },
  path: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    marginLeft: -75,
    width: 150,
    height: 220,
    backgroundColor: '#E7D26A',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  tree: {
    position: 'absolute',
    bottom: 130,
    left: 34,
    alignItems: 'center',
  },
  trunk: { width: 8, height: 30, backgroundColor: '#8A5A2B', borderRadius: 3 },
  canopy: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0B62F',
    marginTop: -46,
  },
});

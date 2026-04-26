/**
 * HandstandHub – Movemate-style redesign · Single-file Expo Snack
 * Paste as App.js at snack.expo.dev
 *
 * Required packages (Snack dependency panel):
 *   @react-navigation/native
 *   @react-navigation/bottom-tabs
 *   @react-navigation/native-stack
 *   react-native-safe-area-context
 *   react-native-screens
 *   expo-linear-gradient
 *   @react-native-async-storage/async-storage
 *   react-native-webview
 *   expo-camera
 *   expo-av
 *   expo-notifications
 *   @react-native-community/netinfo
 *   @supabase/supabase-js
 *   expo-secure-store
 */

import React, {
  useState, useEffect, useRef, useCallback, useContext,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Platform, Share, Linking, Modal,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Vibration, Alert,
  Image, ImageBackground,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { NavigationContainer, DefaultTheme, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { createClient } from '@supabase/supabase-js';
// import Voice from '@react-native-voice/voice'; // disabled for Expo Go
import { LineChart as GiftedLineChart, BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import ViewShot from 'react-native-view-shot';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICON COMPONENTS — replaces all emoji usage in visual contexts
// ─────────────────────────────────────────────────────────────────────────────

const HANDSTAND_LOGO = require('./assets/handstand-logo.png');
const LOGO_RATIO = 433 / 1240; // natural width:height of the asset
const HandstandFigure = ({ size = 120 }) => {
  const h = size;
  const w = Math.round(h * LOGO_RATIO);
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={HANDSTAND_LOGO} style={{ width: w, height: h }} resizeMode="contain" fadeDuration={0} />
    </View>
  );
};

const FlameIcon = ({ size = 24, active = true }) => {
  const outer = active ? '#FF6B35' : '#30363D';
  const inner = active ? '#FFD700' : '#1C1D21';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2 C9.5 5.5 7 8.5 8.5 12.5 C9.5 15 7.5 16.5 7.5 18.5 C7.5 21 9.5 22.5 12 22.5 C14.5 22.5 16.5 21 16.5 18.5 C16.5 16.5 14.5 15 15.5 12.5 C17 8.5 14.5 5.5 12 2Z" fill={outer} />
      <Path d="M12 13 C10.5 15 11 17 12 17.5 C13 17 13.5 15 12 13Z" fill={inner} />
    </Svg>
  );
};

const IceFlakeIcon = ({ size = 24, color = '#60A5FA' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3.8" y1="7.5" x2="20.2" y2="16.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="20.2" y1="7.5" x2="3.8" y2="16.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M10 5 L12 3 L14 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M10 19 L12 21 L14 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M5.3 9.5 L3.8 7.5 L6.2 7.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M18.7 9.5 L20.2 7.5 L17.8 7.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="12" cy="12" r="2.5" fill={color} />
  </Svg>
);

const DiceIcon = ({ size = 20, color = '#D7FF3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Rect x="1.5" y="1.5" width="17" height="17" rx="3.5" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
    <Circle cx="6" cy="6" r="1.6" fill={color} />
    <Circle cx="14" cy="6" r="1.6" fill={color} />
    <Circle cx="10" cy="10" r="1.6" fill={color} />
    <Circle cx="6" cy="14" r="1.6" fill={color} />
    <Circle cx="14" cy="14" r="1.6" fill={color} />
  </Svg>
);

const SparkleIcon = ({ size = 20, color = '#D7FF3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M10 2 L11.2 8.8 L18 10 L11.2 11.2 L10 18 L8.8 11.2 L2 10 L8.8 8.8 Z" fill={color} />
    <Path d="M16 3 L16.6 5.4 L19 6 L16.6 6.6 L16 9 L15.4 6.6 L13 6 L15.4 5.4 Z" fill={color} opacity="0.6" />
  </Svg>
);

const SimpleAvatar = ({ size = 44, bg = '#1C2128', fg = '#D7FF3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 44 44">
    <Circle cx="22" cy="22" r="22" fill={bg} />
    <Circle cx="22" cy="18" r="6" fill={fg} />
    <Path d="M10 40 C10 30 16 26 22 26 C28 26 34 30 34 40 Z" fill={fg} />
  </Svg>
);
const Avatar1 = (props) => <SimpleAvatar {...props} bg="#1C2128" fg="#D7FF3D" />;
const Avatar2 = (props) => <SimpleAvatar {...props} bg="#1C2128" fg="#8B95A7" />;
const Avatar3 = (props) => <SimpleAvatar {...props} bg="#1C2128" fg="#E8EEF7" />;

const WhatsAppIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M11 2 C6.03 2 2 6.03 2 11 C2 12.7 2.46 14.3 3.27 15.7 L2 20 L6.43 18.76 C7.79 19.55 9.35 20 11 20 C15.97 20 20 15.97 20 11 C20 6.03 15.97 2 11 2Z" fill="#25D366" />
    <Path d="M8.1 7C7.9 7 7.6 7.1 7.4 7.3 C7.1 7.6 6.5 8.2 6.5 9.4 C6.5 10.6 7.4 11.8 7.6 12.1 C7.8 12.4 9.4 14.9 11.8 15.8 C13.7 16.5 14.2 16.3 14.7 16.2 C15.3 16 16.2 15.4 16.4 14.8 C16.6 14.2 16.6 13.7 16.5 13.6 C16.4 13.5 16.2 13.4 15.9 13.3 L14.5 12.6 C14.2 12.5 14 12.4 13.8 12.7 L13.3 13.3 C13.1 13.6 13 13.6 12.7 13.5 C12.4 13.3 11.5 13 10.4 12 C9.6 11.3 9.1 10.4 8.9 10.1 C8.7 9.8 8.9 9.6 9.1 9.4 L9.5 8.9 C9.7 8.7 9.7 8.5 9.8 8.3 L9.9 6.9 C9.9 6.6 9.7 6.4 9.4 6.4 L8.4 6.4 C8.3 6.4 8.2 6.5 8.1 7Z" fill="white" />
  </Svg>
);

const InstagramIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Rect x="2" y="2" width="18" height="18" rx="5" fill="none" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="11" cy="11" r="4.5" fill="none" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="16.5" cy="5.5" r="1.3" fill="#E1306C" />
  </Svg>
);

const ShareIcon = ({ size = 22, color = '#D7FF3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Circle cx="17" cy="5" r="2.5" fill={color} />
    <Circle cx="17" cy="17" r="2.5" fill={color} />
    <Circle cx="5" cy="11" r="2.5" fill={color} />
    <Line x1="7.2" y1="10.1" x2="14.8" y2="6.1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="7.2" y1="11.9" x2="14.8" y2="15.9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// THEME — must be defined first; everything else in the file depends on these
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:               '#0A0A0B',
  bgCard:           '#16171A',
  bgCardAlt:        '#1C1D21',  // alias — used by other screens
  bgCardElevated:   '#1C1D21',
  bgDeep:           '#000000',
  bgElevated:       '#1C1D21',

  // Electric lime — new primary accent
  accent:           '#D7FF3D',
  accentDark:       '#A8CC2E',
  accentGlow:       'rgba(215,255,61,0.25)',
  accentDim:        'rgba(215,255,61,0.12)',

  // Legacy orange — kept so other screens don't break
  accentOrange:     '#FF6B35',
  accentLight:      '#FF8C5A',

  red:              '#FF453A',
  redLight:         '#FF6259',
  redDim:           'rgba(255,69,58,0.12)',

  gold:             '#FF6B35',
  goldDim:          'rgba(255,107,53,0.12)',

  text:             '#FFFFFF',
  textSub:          '#8A8B91',
  textMuted:        '#5A5B61',

  border:           '#26272B',
  borderLight:      '#2F3036',

  success:          '#3FB950',
  successDim:       'rgba(63,185,80,0.12)',
  error:            '#FF453A',
  errorDim:         'rgba(255,69,58,0.12)',

  white:            '#FFFFFF',
  black:            '#000000',
  overlay:          'rgba(0,0,0,0.85)',
};

const G = {
  accent:    ['#D7FF3D', '#A8CC2E'],
  accentAlt: ['#D7FF3D', '#A8CC2E'],
  accentH:   ['#D7FF3D', '#A8CC2E'],
  red:       ['#FF6259', '#FF453A'],
  gold:      ['#FF6B35', '#FF6B35'],
  success:   ['#3FB950', '#3FB950'],
  dark:      ['#141414', '#000000'],
  hero:      ['rgba(0,0,0,0)', 'rgba(0,0,0,0.95)'],
  cardOver:  ['transparent', 'rgba(0,0,0,0.95)'],
  splash:    ['#000000', '#0A0A0A', '#141414'],
  card:      ['#1C1C1C', '#141414'],
};

const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999 };

const T = {
  h1:    { fontSize: 36, fontWeight: '900', letterSpacing: -0.5, color: C.text },
  h2:    { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: C.text },
  h3:    { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: C.text },
  h4:    { fontSize: 16, fontWeight: '700', color: C.text },
  body:  { fontSize: 15, fontWeight: '400', lineHeight: 22, color: C.textSub },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 18, color: C.textSub },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: C.textMuted },
  cap:   { fontSize: 11, fontWeight: '600', color: C.textMuted },
  num:   { fontSize: 40, fontWeight: '900', letterSpacing: -1.5, color: C.text },
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND PROXY URL
// The Anthropic API key lives server-side in a Supabase Edge Function.
// Replace this URL with your deployed function endpoint.
// Deploy: supabase functions deploy ai-check
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ─────────────────────────────────────────────────────────────────────────────
const AI_CHECK_URL =
  Constants.expoConfig?.extra?.aiCheckUrl ??
  'https://kkilkggghydodfnbeoyw.supabase.co/functions/v1/ai-check';

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
// Dashboard → Settings → API
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://kkilkggghydodfnbeoyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraWxrZ2dnaHlkb2RmbmJlb3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg0MjQsImV4cCI6MjA5MDk3NDQyNH0.PbhjFAJiTdiL5ETE2xAYnyyVf5SsEf6H18Dmqnwv-N4';

// Deep-link scheme used by Supabase for email confirmation / password reset.
// Configure `scheme: "handstandhub"` in app.json + add this URL to the Supabase
// dashboard's allowed redirect list before shipping a production build.
const AUTH_REDIRECT_URL = 'handstandhub://auth-callback';

// True only when the developer has replaced the placeholder values above.
const SUPABASE_CONFIGURED =
  !SUPABASE_URL.includes('<YOUR_PROJECT_REF>') &&
  !SUPABASE_ANON_KEY.includes('<YOUR_ANON_KEY>');

// SecureStore-backed adapter for Supabase session persistence. Tokens go into
// iOS Keychain / Android Keystore instead of plaintext AsyncStorage. Supabase's
// internal key names contain characters SecureStore rejects (":", etc.) so we
// hash them to a deterministic safe slug before reading/writing.
const _safeKey = (k) =>
  'sb_' + String(k).replace(/[^A-Za-z0-9._-]/g, (c) =>
    '_' + c.charCodeAt(0).toString(16)
  ).slice(0, 60);

const SecureStorageAdapter = {
  getItem:    async (key) => { try { return await SecureStore.getItemAsync(_safeKey(key)); } catch { return null; } },
  setItem:    async (key, value) => { try { await SecureStore.setItemAsync(_safeKey(key), value); } catch (e) { console.warn('SecureStore.setItem failed', key, e); } },
  removeItem: async (key) => { try { await SecureStore.deleteItemAsync(_safeKey(key)); } catch {} },
};

// PII-grade storage for email, display name, and quiz answers (which include
// age range, body type, and biological sex). Backs onto SecureStorageAdapter
// so it lands in iOS Keychain / Android Keystore — never plaintext disk.
const sensitiveStore = {
  get:    (key) => SecureStorageAdapter.getItem(key),
  set:    (key, value) => SecureStorageAdapter.setItem(key, value),
  remove: (key) => SecureStorageAdapter.removeItem(key),
};

const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage:            SecureStorageAdapter,
        autoRefreshToken:   true,
        persistSession:     true,
        detectSessionInUrl: false,
      },
    })
  : null; // auth/cloud features disabled until credentials are provided

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [session,      setSession]      = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [authUser,     setAuthUser]     = useState(null); // public.users row

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }

    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchUserProfile(s.user.id);
      setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user.id);
        // If a trial was started locally pre-signup, sync it server-side now.
        AsyncStorage.getItem('@handstandai_pending_trial')
          .then(async (productId) => {
            if (!productId) return;
            try {
              await supabase.rpc('start_trial', { p_product_id: productId });
              await AsyncStorage.removeItem('@handstandai_pending_trial');
            } catch (err) { console.warn('pending start_trial sync failed', err); }
          })
          .catch((e) => console.warn('pending trial check failed', e));
      } else {
        setAuthUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) { console.warn('fetchUserProfile error', error); return; }
      if (data) setAuthUser(data);
    } catch (e) { console.warn('fetchUserProfile threw', e); }
  };

  // Local sign-up throttle — 3 attempts per minute per device. Defends against
  // accidental double-taps and slows targeted email-bombing. Server-side rate
  // limits and captcha must be enabled in the Supabase dashboard for full
  // protection.
  const _signUpAttemptsRef = useRef([]);
  const SIGNUP_WINDOW_MS = 60_000;
  const SIGNUP_MAX       = 3;

  const signUp = async (email, password, displayName) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const now = Date.now();
    _signUpAttemptsRef.current = _signUpAttemptsRef.current.filter(t => now - t < SIGNUP_WINDOW_MS);
    if (_signUpAttemptsRef.current.length >= SIGNUP_MAX) {
      throw new Error('Too many sign-up attempts. Please wait a minute and try again.');
    }
    _signUpAttemptsRef.current.push(now);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: cleanDisplayName(displayName) },
        emailRedirectTo: AUTH_REDIRECT_URL,
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // last_login is best-effort — log failures so they're not invisible.
    supabase.from('users').update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(({ error: e }) => { if (e) console.warn('last_login update failed', e); })
      .catch((e) => console.warn('last_login update threw', e));
    return data;
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
  };

  const sendPasswordReset = async (email) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AUTH_REDIRECT_URL,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateDisplayName = async (name) => {
    if (!supabase || !session?.user) return;
    const { error } = await supabase.from('users')
      .update({ display_name: cleanDisplayName(name) })
      .eq('id', session.user.id);
    if (error) throw error;
    setAuthUser(prev => prev ? { ...prev, display_name: name } : prev);
  };

  const deleteAccount = async () => {
    if (!supabase || !session?.user) return;
    await supabase.from('users').delete().eq('id', session.user.id);
    await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{
      session, authUser, authLoading,
      signUp, signIn, signOut,
      sendPasswordReset, updatePassword,
      updateDisplayName, deleteAccount,
      fetchUserProfile,
      isAuthenticated: !!session,
      userId: session?.user?.id ?? null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Input sanitisation helpers ────────────────────────────────────────────────
// Strip unsafe characters from display names before storing or sending to Supabase.
function cleanDisplayName(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .trim()
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s\-'.]/g, '') // letters, digits, spaces, - ' .
    .replace(/\s{2,}/g, ' ')                           // collapse multiple spaces
    .trim();
}

// Normalise email — trim, lowercase, cap at RFC 5321 max (254 chars).
function cleanEmail(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toLowerCase().slice(0, 254);
}
// ─────────────────────────────────────────────────────────────────────────────

// Helper to map Supabase error codes to human-readable messages
function friendlyAuthError(error) {
  const msg = error?.message?.toLowerCase() ?? '';
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
    return 'Wrong email or password. Please try again.';
  }
  if (msg.includes('user not found') || msg.includes('no user')) {
    return 'No account found with that email.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email before logging in.';
  }
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (msg.includes('password') && msg.includes('6')) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Check your internet connection and try again.';
  }
  return error?.message ?? 'Something went wrong. Please try again.';
}

// ─────────────────────────────────────────────────────────────────────────────
// HARDENED AI PROXY CALL — adds Authorization header + size pre-check
// Used by both the live capture flow and the offline retry queue.
// ─────────────────────────────────────────────────────────────────────────────
const AI_MAX_BASE64_LEN = 5_500_000; // ~4 MB raw

async function aiCheckFetch(imageBase64, { signal } = {}) {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('No image to send.');
  }
  if (imageBase64.length > AI_MAX_BASE64_LEN) {
    throw new Error('Image too large. Try a shorter clip.');
  }
  let token = null;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    } catch (e) { console.warn('aiCheckFetch: getSession failed', e); }
  }
  if (!token) throw new Error('Not signed in.');
  const res = await fetch(AI_CHECK_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
    signal,
  });
  if (res.status === 401) throw new Error('Session expired. Sign in again.');
  if (res.status === 402) throw new Error('Pro subscription required.');
  if (res.status === 413) throw new Error('Image too large.');
  return res;
}

// Server-side entitlement check — single source of truth. Returns
// { isActive, trialEndsAt, currentPeriodEnd } or null when offline.
async function fetchEntitlement() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { isActive: false };
    const { data, error } = await supabase
      .from('entitlements')
      .select('is_active, trial_ends_at, current_period_end')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) { console.warn('fetchEntitlement query failed', error); return null; }
    return {
      isActive:         !!data?.is_active,
      trialEndsAt:      data?.trial_ends_at      || null,
      currentPeriodEnd: data?.current_period_end || null,
    };
  } catch (e) {
    console.warn('fetchEntitlement failed', e);
    return null;
  }
}

// Server-side trial start — calls the start_trial RPC (idempotent).
async function startTrialServer(productId) {
  if (!supabase) throw new Error('Supabase not configured.');
  const { data, error } = await supabase.rpc('start_trial', { p_product_id: productId });
  if (error) { console.warn('start_trial RPC failed', error); throw error; }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE / MONETIZATION SYSTEM — local mock (beta)
// isPro / trial state stored in AsyncStorage. Real payments will be wired up
// via RevenueCat once App Store / Play Store accounts are ready.
// ─────────────────────────────────────────────────────────────────────────────
const PURCHASE_KEY = '@handstandai_purchases';
const TRIAL_DAYS   = 7;

const PRODUCTS = {
  PRO_MONTHLY: { id: 'pro_monthly', label: 'Pro Monthly', price: '$9.99', period: '/month',  priceNum: 9.99,  trialDays: 7 },
  PRO_ANNUAL:  { id: 'pro_annual',  label: 'Pro Annual',  price: '$59.99', period: '/year',  priceNum: 59.99, trialDays: 7 },
};

const FREE_MAX_LEVEL = 2;   // levels 1-2 free, 3+ require Pro

// ─────────────────────────────────────────────────────────────────────────────
// RETENTION — MILESTONES & FORGIVING STREAKS
// ─────────────────────────────────────────────────────────────────────────────
const MILESTONES_KEY     = '@handstandai_milestones';
const WEEKLY_SUMMARY_KEY = '@handstandai_weekly_summary';
const VOICE_TIMER_KEY    = '@handstandai_voice_timer';
const BADGE_STORAGE_KEY  = '@handstandai_badges';

// ─────────────────────────────────────────────────────────────────────────────
// BADGES — definitions
// ─────────────────────────────────────────────────────────────────────────────
// A short, valuable badge set. Hidden from the user — they only see them as a
// surprise pop-up the moment they unlock one. No checklist, no "1/26 earned"
// counter. Each badge here represents a real handstand milestone, not a vanity
// participation trophy.
const BADGES = [
  // Real strength milestones
  { id: 'hold_5',       category: 'hold',     icon: '⏱',  title: 'Five Seconds of Flight', description: 'Hold a handstand for 5 seconds.',          xpReward: 100 },
  { id: 'hold_30',      category: 'hold',     icon: '🏆',  title: 'Half-Minute Hero',       description: 'Hold a handstand for 30 seconds.',         xpReward: 500 },
  { id: 'hold_60',      category: 'hold',     icon: '👑',  title: 'One-Minute Master',      description: 'Hold a handstand for 60 seconds.',         xpReward: 1000 },
  // Streak commitment
  { id: 'streak_7',     category: 'streak',   icon: '🔥',  title: 'Week Warrior',           description: 'Train 7 days in a row.',                   xpReward: 200 },
  { id: 'streak_30',    category: 'streak',   icon: '💎',  title: 'Iron Will',              description: 'Train 30 days in a row.',                  xpReward: 750 },
  // Skill threshold
  { id: 'level_3',      category: 'level',    icon: '💪',  title: 'Real Handstand',         description: 'Reach Level 3 — your first true freestanding work.', xpReward: 500 },
  { id: 'level_5',      category: 'level',    icon: '🌟',  title: 'Elite',                  description: 'Reach Level 5.',                           xpReward: 2000 },
  // Deep commitment
  { id: 'sessions_100', category: 'practice', icon: '🎯',  title: 'Hundred Club',           description: 'Complete 100 training sessions.',          xpReward: 1500 },
];

// Standalone (no hook) streak computer used by _load() and StreakDetailModal.
// Returns { streak, frozen, freezeGapDate } where freezeGapDate is the
// DateString of the skipped day that consumed the freeze.
function computeStreakFromSubs(submissions) {
  if (!submissions || submissions.length === 0) return { streak: 0, frozen: false, freezeGapDate: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trainingDates = new Set(submissions.map(s => {
    const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d.getTime();
  }));
  const trainedToday = trainingDates.has(today.getTime());
  let consecutiveDays = 0;
  let restDayUsed = false;
  let freezeGapDate = null;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (trainingDates.has(d.getTime())) {
      consecutiveDays++;
    } else if (!restDayUsed && i > 0) {
      restDayUsed = true;
      freezeGapDate = d.toDateString();
    } else {
      break;
    }
  }
  const frozen = restDayUsed && !trainedToday;
  return { streak: consecutiveDays, frozen, freezeGapDate };
}

const MILESTONE_DEFS = [
  { id: 'first_submission',  label: 'First Training Session',   emoji: '🎉', condition: (p) => p.submissions?.length >= 1 },
  { id: 'streak_7',          label: '7-Day Streak',             emoji: '🔥', condition: (p) => (p.streak || 0) >= 7 },
  { id: 'streak_30',         label: '30-Day Streak',            emoji: '🌟', condition: (p) => (p.streak || 0) >= 30 },
  { id: 'streak_100',        label: '100-Day Streak',           emoji: '💎', condition: (p) => (p.streak || 0) >= 100 },
  { id: 'level_2',           label: 'Level 2 Unlocked',         emoji: '🏆', condition: (p) => p.completedLevels?.includes(1) },
  { id: 'level_3',           label: 'Level 3 Unlocked',         emoji: '⚡', condition: (p) => p.completedLevels?.includes(2) },
  { id: 'sessions_10',       label: '10 Sessions Completed',    emoji: '💪', condition: (p) => p.submissions?.length >= 10 },
  { id: 'sessions_50',       label: '50 Sessions Completed',    emoji: '🤸', condition: (p) => p.submissions?.length >= 50 },
  { id: 'ai_verified',       label: 'First AI Verified Hold',   emoji: '🤖', condition: (p) => p.submissions?.some(s => s.aiDetected === true) },
  { id: 'freestanding',      label: 'Freestanding Handstand!',  emoji: '🏅', condition: (p) => p.completedLevels?.includes(3) },
];

const MilestoneContext = React.createContext(null);

function MilestoneProvider({ children }) {
  const [earned,        setEarned]        = useState([]);   // array of milestone ids
  const [celebrating,   setCelebrating]   = useState(null); // milestone def being shown
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [showSummary,   setShowSummary]   = useState(false);
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { _loadMilestones(); _checkWeeklySummary(); }, []);

  async function _loadMilestones() {
    try {
      const raw = await AsyncStorage.getItem(MILESTONES_KEY);
      if (raw) setEarned(JSON.parse(raw));
    } catch (_) {}
  }

  async function _saveEarned(next) {
    try { await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(next)); } catch (_) {}
  }

  async function _checkWeeklySummary() {
    try {
      const raw = await AsyncStorage.getItem(WEEKLY_SUMMARY_KEY);
      const lastShown = raw ? JSON.parse(raw).lastShown : null;
      const now = new Date();
      // Show weekly summary on Sundays after 6pm, once per week
      if (now.getDay() === 0 && now.getHours() >= 18) {
        const lastDate = lastShown ? new Date(lastShown) : null;
        const alreadyShownThisWeek = lastDate && (now - lastDate) < 7 * 86400000;
        if (!alreadyShownThisWeek) {
          // Will be populated by checkMilestones once progress is available
          await AsyncStorage.setItem(WEEKLY_SUMMARY_KEY, JSON.stringify({ lastShown: now.toISOString() }));
        }
      }
    } catch (_) {}
  }

  // Call after every progress update — checks for newly earned milestones
  const checkMilestones = useCallback(async (progress) => {
    let current = earned;
    // reload in case state is stale
    try {
      const raw = await AsyncStorage.getItem(MILESTONES_KEY);
      if (raw) current = JSON.parse(raw);
    } catch (_) {}

    for (const def of MILESTONE_DEFS) {
      if (current.includes(def.id)) continue;
      if (def.condition(progress)) {
        const next = [...current, def.id];
        current = next;
        await _saveEarned(next);
        setEarned(next);
        // Celebrate the first new milestone found (queue others for next check)
        setCelebrating(def);
        _animateCelebration();
        break; // one at a time
      }
    }
  }, [earned]);

  function _animateCelebration() {
    confettiAnim.setValue(0);
    Animated.sequence([
      Animated.timing(confettiAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(confettiAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setCelebrating(null));
  }

  const buildWeeklySummary = useCallback((progress) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekSubs = (progress.submissions || []).filter(s => new Date(s.date) >= monday);
    const totalSec = weekSubs.reduce((n, s) => n + (s.duration || 0), 0);
    const avgForm  = weekSubs.filter(s => s.formScore != null).reduce((acc, s, _, arr) => acc + s.formScore / arr.length, 0);
    const summary  = {
      sessions: weekSubs.length,
      totalSeconds: totalSec,
      avgFormScore: Math.round(avgForm) || null,
      streak: progress.streak || 0,
      level: progress.currentLevel || 1,
    };
    setWeeklySummary(summary);
    setShowSummary(true);
  }, []);

  // Forgiving streak: allow 1 rest day per week without breaking
  const computeForgivingStreak = useCallback((progress) => {
    const { streak, frozen } = computeStreakFromSubs(progress.submissions || []);
    return { streak, frozen };
  }, []);

  return (
    <MilestoneContext.Provider value={{
      earned, celebrating, checkMilestones,
      weeklySummary, showSummary, setShowSummary, buildWeeklySummary,
      computeForgivingStreak,
    }}>
      {children}
      <MilestoneCelebration celebrating={celebrating} confettiAnim={confettiAnim} />
      <WeeklySummaryModal summary={weeklySummary} visible={showSummary} onClose={() => setShowSummary(false)} />
    </MilestoneContext.Provider>
  );
}

// ── Confetti + Milestone celebration overlay ──────────────────────────────────
function MilestoneCelebration({ celebrating, confettiAnim }) {
  if (!celebrating) return null;
  const scale = confettiAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.1, 1] });
  const opacity = confettiAnim;

  // Simple confetti using randomized dots
  const dots = Array.from({ length: 24 }, (_, i) => ({
    key: i,
    x: Math.random() * width,
    y: Math.random() * 300,
    color: ['#F78166', '#FFD700', '#79C0FF', '#56D364', '#FF7EFF'][i % 5],
    size: 6 + Math.random() * 8,
  }));

  return (
    <Animated.View style={[ms.overlay, { opacity }]} pointerEvents="none">
      {dots.map(d => (
        <View key={d.key} style={{ position: 'absolute', left: d.x, top: d.y, width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: d.color }} />
      ))}
      <Animated.View style={[ms.card, { transform: [{ scale }] }]}>
        <Text style={{ fontSize: 56 }}>{celebrating.emoji}</Text>
        <Text style={[T.h2, { textAlign: 'center', marginTop: S.sm }]}>Milestone!</Text>
        <Text style={[T.body, { textAlign: 'center', color: C.accent, fontWeight: '700', marginTop: S.xs }]}>{celebrating.label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ── Weekly summary modal ──────────────────────────────────────────────────────
function WeeklySummaryModal({ summary, visible, onClose }) {
  if (!summary) return null;
  const focusSuggestions = ['Work on hollow body', 'Drill wall handstand holds', 'Focus on straight-arm pressing', 'Practice kick-ups consistently'];
  const nextFocus = focusSuggestions[summary.level % focusSuggestions.length];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.summaryOverlay}>
        <View style={ms.summarySheet}>
          <LinearGradient colors={G.accent} style={ms.summaryHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[T.label, { color: 'rgba(0,0,0,0.6)', letterSpacing: 2 }]}>WEEKLY SUMMARY</Text>
            <Text style={[T.h1, { color: C.black, marginTop: S.xs }]}>This Week</Text>
          </LinearGradient>

          <View style={ms.summaryGrid}>
            <View style={ms.summaryCell}>
              <Text style={ms.summaryNum}>{summary.sessions}</Text>
              <Text style={ms.summaryLabel}>Sessions</Text>
            </View>
            <View style={ms.summaryCell}>
              <Text style={ms.summaryNum}>{summary.totalSeconds}s</Text>
              <Text style={ms.summaryLabel}>Total Hold</Text>
            </View>
            <View style={ms.summaryCell}>
              <Text style={ms.summaryNum}>{summary.avgFormScore != null ? `${summary.avgFormScore}%` : '—'}</Text>
              <Text style={ms.summaryLabel}>Avg Form</Text>
            </View>
            <View style={ms.summaryCell}>
              <Text style={ms.summaryNum}>🔥{summary.streak}</Text>
              <Text style={ms.summaryLabel}>Day Streak</Text>
            </View>
          </View>

          <View style={ms.focusCard}>
            <Text style={[T.cap, { color: C.accent, fontWeight: '700', marginBottom: S.xs }]}>NEXT WEEK'S FOCUS</Text>
            <Text style={T.body}>{nextFocus}</Text>
          </View>

          {summary.sessions === 0 && (
            <View style={[ms.focusCard, { backgroundColor: C.bgCardElevated, borderColor: C.border }]}>
              <Text style={[T.body, { color: C.textSub }]}>No sessions this week — your muscles still remember. Come back stronger 💪</Text>
            </View>
          )}

          <TouchableOpacity style={ms.closeSummaryBtn} onPress={onClose} activeOpacity={0.85}>
            <LinearGradient colors={G.accent} style={ms.closeSummaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Start This Week Strong</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:          { ...StyleSheet.absoluteFillObject, zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  card:             { backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.xl, alignItems: 'center', marginHorizontal: S.xl, borderWidth: 1, borderColor: C.border, shadowColor: C.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 16 },
  summaryOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  summarySheet:     { backgroundColor: C.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingBottom: 40 },
  summaryHero:      { padding: S.xl, paddingTop: S.xl + 8 },
  summaryGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: S.md, gap: S.sm },
  summaryCell:      { flex: 1, minWidth: (width - S.md * 2 - S.sm) / 2, backgroundColor: C.bgDeep, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  summaryNum:       { fontSize: 28, fontWeight: '900', color: C.text },
  summaryLabel:     { fontSize: 11, color: C.textMuted, marginTop: 2 },
  focusCard:        { marginHorizontal: S.md, marginTop: S.sm, backgroundColor: C.accentDim, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.accent + '44' },
  closeSummaryBtn:  { marginHorizontal: S.md, marginTop: S.lg, borderRadius: R.xl, overflow: 'hidden' },
  closeSummaryGrad: { paddingVertical: S.md + 2, alignItems: 'center' },
});

const PurchaseContext = React.createContext(null);

// Shape stored in AsyncStorage under PURCHASE_KEY:
// { isPro: bool, trialStartedAt: ISO string | null, productId: string | null }
const DEFAULT_PURCHASE_STATE = { isPro: false, trialStartedAt: null, productId: null };

function PurchaseProvider({ children }) {
  // Local cache. The SERVER entitlement view is the source of truth — this is
  // only used to render last-known-good UI before the server refresh resolves.
  const [proState,       setProState]       = useState(DEFAULT_PURCHASE_STATE);
  const [proLoaded,      setProLoaded]      = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [sessionPaywallShown, setSessionPaywallShown] = useState(false);
  const [paywallForced,  setPaywallForced]  = useState(false); // hard-gate mode

  useEffect(() => {
    (async () => {
      // 1. Hydrate from cache for instant UI.
      try {
        const raw = await AsyncStorage.getItem(PURCHASE_KEY);
        if (raw) setProState({ ...DEFAULT_PURCHASE_STATE, ...JSON.parse(raw) });
      } catch (e) { console.warn('PurchaseProvider: cache load failed', e); }
      // 2. Then verify with the server — this is what actually gates Pro.
      const ent = await fetchEntitlement();
      if (ent) {
        const next = {
          isPro:          !!ent.isActive,
          trialStartedAt: ent.trialEndsAt
            ? new Date(new Date(ent.trialEndsAt).getTime() - TRIAL_DAYS * 86400000).toISOString()
            : null,
          productId:      proState.productId,
        };
        setProState(next);
        try { await AsyncStorage.setItem(PURCHASE_KEY, JSON.stringify(next)); }
        catch (e) { console.warn('PurchaseProvider: cache save failed', e); }
      }
      setProLoaded(true);
    })();
  }, []);

  const _save = async (next) => {
    setProState(next);
    try { await AsyncStorage.setItem(PURCHASE_KEY, JSON.stringify(next)); }
    catch (e) { console.warn('PurchaseProvider: _save failed', e); }
  };

  // Re-fetch from server (called after a purchase, or when the user explicitly restores).
  const refreshEntitlement = async () => {
    const ent = await fetchEntitlement();
    if (!ent) return null;
    const next = {
      isPro:          !!ent.isActive,
      trialStartedAt: ent.trialEndsAt
        ? new Date(new Date(ent.trialEndsAt).getTime() - TRIAL_DAYS * 86400000).toISOString()
        : null,
      productId:      proState.productId,
    };
    await _save(next);
    return ent;
  };

  // ── Derived access helpers ─────────────────────────────────────────────────
  // NOTE: these are CLIENT-SIDE conveniences for UI gating only. Every protected
  // server endpoint must independently verify the JWT + entitlement.
  const isPro = () => proState.isPro;

  const isInTrial = () => {
    if (!proState.trialStartedAt) return false;
    const ms = new Date() - new Date(proState.trialStartedAt);
    return ms < TRIAL_DAYS * 86400000;
  };

  const trialDaysRemaining = () => {
    if (!proState.trialStartedAt) return 0;
    const ms = TRIAL_DAYS * 86400000 - (new Date() - new Date(proState.trialStartedAt));
    return Math.max(0, Math.ceil(ms / 86400000));
  };

  const subscriptionExpiresAt = () => null; // populated by real payments later

  const hasActiveEntitlement = () => isPro() || isInTrial();
  // Trial users get full access — gate on entitlement, not strict isPro.
  const canAccessLevel     = (levelId) => levelId <= FREE_MAX_LEVEL || hasActiveEntitlement();
  const canPostToCommunity = () => hasActiveEntitlement();
  const trialExpired = () => !!proState.trialStartedAt && !isInTrial() && !isPro();

  // ── Purchase flow (beta mock) — calls the start_trial RPC server-side ─────
  // During onboarding the user hits this paywall BEFORE signing up, so no
  // Supabase session exists yet. In that case we fall back to a local
  // cache-only trial and mark it pending; AuthProvider syncs to the server
  // (via start_trial RPC) on next successful sign-in.
  const PENDING_TRIAL_KEY = '@handstandai_pending_trial';

  const purchaseSubscription = async (productId) => {
    setPurchaseLoading(true);
    try {
      let session = null;
      if (supabase) {
        try { session = (await supabase.auth.getSession()).data.session; }
        catch (e) { console.warn('purchaseSubscription: getSession failed', e); }
      }

      if (session) {
        // Authenticated path — server is the source of truth.
        await startTrialServer(productId);
        await refreshEntitlement();
      } else {
        // Pre-signup path — record locally and queue for sync.
        const trialStartedAt = new Date().toISOString();
        await _save({ isPro: true, trialStartedAt, productId });
        try { await AsyncStorage.setItem(PENDING_TRIAL_KEY, productId); }
        catch (e) { console.warn('purchaseSubscription: queue pending trial failed', e); }
      }

      setPaywallVisible(false);
      setPaywallForced(false);
      Alert.alert('🎉 Welcome to Pro!', 'Your 7-day free trial has started. Enjoy full Pro access.');
      return true;
    } catch (e) {
      console.warn('purchaseSubscription failed', e);
      Alert.alert('Could not start trial', friendlyAuthError(e));
      return false;
    } finally {
      setPurchaseLoading(false);
    }
  };

  const restorePurchases = async () => {
    setPurchaseLoading(true);
    const ent = await refreshEntitlement();
    setPurchaseLoading(false);
    if (ent?.isActive) {
      Alert.alert('Restore Complete', 'Your Pro access has been restored.');
    } else {
      Alert.alert('Nothing to Restore', 'No active subscription found on this account.');
    }
  };

  const showPaywall = (reason = 'general', featureLabel = '') => {
    if (sessionPaywallShown) return;
    setPaywallTrigger({ reason, featureLabel });
    setPaywallForced(false);
    setPaywallVisible(true);
    setSessionPaywallShown(true);
  };

  // Hard-gate paywall — no close button, no backdrop dismiss. Used as a stage.
  const showForcedPaywall = (reason = 'gate') => {
    setPaywallTrigger({ reason, featureLabel: '' });
    setPaywallForced(true);
    setPaywallVisible(true);
  };

  const hidePaywall = () => {
    if (paywallForced) return; // can't dismiss when forced
    setPaywallVisible(false);
  };

  return (
    <PurchaseContext.Provider value={{
      proLoaded,
      isPro, isInTrial, trialDaysRemaining, subscriptionExpiresAt,
      hasActiveEntitlement, trialExpired,
      canAccessLevel, canPostToCommunity,
      purchaseSubscription, restorePurchases,
      showPaywall, showForcedPaywall, hidePaywall,
      paywallVisible, paywallForced, paywallTrigger, purchaseLoading,
      FREE_MAX_LEVEL,
    }}>
      {children}
      <PaywallModal />
    </PurchaseContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PaywallGateScreen — renders a solid branded background and triggers the
// forced (non-dismissible) paywall modal on mount. When the user acquires an
// entitlement (trial or Pro) we call onCleared to advance the stage machine.
// ─────────────────────────────────────────────────────────────────────────────
function PaywallGateScreen({ onCleared }) {
  const { showForcedPaywall, hasActiveEntitlement } = useContext(PurchaseContext);

  // Fire the forced paywall once on mount.
  useEffect(() => {
    const t = setTimeout(() => showForcedPaywall('post_quiz_gate'), 60);
    return () => clearTimeout(t);
  }, []);

  // Watch for entitlement activation and advance the stage.
  useEffect(() => {
    if (hasActiveEntitlement && hasActiveEntitlement()) {
      onCleared && onCleared();
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <HandstandFigure size={120} />
    </View>
  );
}

function PaywallModal() {
  const {
    paywallVisible, paywallTrigger, paywallForced, hidePaywall,
    purchaseSubscription, restorePurchases, purchaseLoading,
    trialExpired,
  } = useContext(PurchaseContext);
  const [selected, setSelected] = useState('pro_annual');
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState(null);
  const [userGoal, setUserGoal] = useState(null);
  const [userTargetDate, setUserTargetDate] = useState(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  // Load personalization data whenever the paywall becomes visible
  useEffect(() => {
    if (!paywallVisible) return;
    (async () => {
      try {
        // QUIZ_LEVEL_KEY + target_date are non-PII → AsyncStorage.
        // USER_NAME_KEY + QUIZ_ANSWERS_KEY are PII → SecureStore.
        const pairs = await AsyncStorage.multiGet([
          QUIZ_LEVEL_KEY,
          '@handstandai_target_date',
        ]);
        const map = Object.fromEntries(pairs);
        const [secureName, secureAnswers] = await Promise.all([
          sensitiveStore.get(USER_NAME_KEY),
          sensitiveStore.get(QUIZ_ANSWERS_KEY),
        ]);
        setUserName(secureName || '');
        setUserLevel(map[QUIZ_LEVEL_KEY] ? Number(map[QUIZ_LEVEL_KEY]) : null);
        if (secureAnswers) {
          try { const a = JSON.parse(secureAnswers); setUserGoal(a[13] || null); }
          catch (e) { console.warn('Paywall: parse quiz answers failed', e); }
        }
        if (map['@handstandai_target_date']) {
          const d = new Date(map['@handstandai_target_date']);
          if (!isNaN(d.getTime())) setUserTargetDate(d);
        }
      } catch (_) {}
    })();
  }, [paywallVisible]);

  useEffect(() => {
    if (paywallVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
    }
  }, [paywallVisible]);

  // Derived: personalized headline text pulled from quiz answers
  const goalLabel = userGoal || '30-second freestanding hold';
  const personalizedHeadline = userName
    ? `${userName}, your Level ${userLevel ?? '—'} plan to a ${goalLabel}.`
    : `Your Level ${userLevel ?? '—'} plan to a ${goalLabel}.`;
  const targetDateStr = userTargetDate
    ? userTargetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : null;

  const PRO_FEATURES = [
    'Personalized plan built around your answers',
    'AI form analysis on every rep',
    'Full level library — no drills locked',
    'Adaptive weekly training calendar',
    'Progress charts, streak protection, and badges',
  ];

  const handlePurchase = async () => {
    await purchaseSubscription(selected);
  };

  const expired = trialExpired && trialExpired();
  const goalText = userGoal ? userGoal.toLowerCase() : 'freestanding handstand';
  const heroHeadline = expired
    ? 'Keep your plan. Keep the progress.'
    : userName
      ? `${userName}, your ${goalText} is ${targetDateStr ? targetDateStr : 'weeks'} away.`
      : `Your ${goalText} is ${targetDateStr ? targetDateStr : 'weeks'} away.`;

  return (
    <Modal visible={paywallVisible} transparent animationType="none" onRequestClose={paywallForced ? () => {} : hidePaywall}>
      <Animated.View style={[pw.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[pw.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {/* Close — hidden when forced (hard gate) */}
            {!paywallForced && (
              <TouchableOpacity style={pw.closeBtn} onPress={hidePaywall} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={C.textMuted} />
              </TouchableOpacity>
            )}

            {/* Hero */}
            <View style={pw.hero}>
              <View style={pw.heroIconCircle}>
                <HandstandFigure size={72} />
              </View>
              <Text style={pw.eyebrow}>
                {expired ? 'YOUR FREE TRIAL ENDED' : `LEVEL ${userLevel ?? '—'} · PERSONAL PLAN`}
              </Text>
              <Text style={pw.heroHeadline}>{heroHeadline}</Text>
              <Text style={pw.heroSub}>
                {expired
                  ? 'Continue with Pro to pick up exactly where you left off.'
                  : 'Start today — pay nothing for 7 days.'}
              </Text>
            </View>

            {/* Feature list — clean, one lime dot per line */}
            <View style={pw.featureList}>
              {PRO_FEATURES.map(f => (
                <View key={f} style={pw.featureRow2}>
                  <View style={pw.featureDot}>
                    <Ionicons name="checkmark" size={12} color={C.black} />
                  </View>
                  <Text style={pw.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* Plans — annual prominent, monthly secondary */}
            <View style={pw.planStack}>
              {/* Annual — the recommended one */}
              <TouchableOpacity
                style={[pw.planAnnual, selected === 'pro_annual' && pw.planAnnualSelected]}
                onPress={() => setSelected('pro_annual')}
                activeOpacity={0.9}
              >
                <View style={pw.mostPopularPill}>
                  <Text style={pw.mostPopularText}>MOST POPULAR · SAVE 50%</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <View>
                    <Text style={pw.planName}>Annual</Text>
                    <Text style={pw.planSub}>$5.00/mo · billed yearly</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={pw.planPrice}>$59.99</Text>
                    <Text style={pw.planPriceSub}>/year</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Monthly — smaller alternative */}
              <TouchableOpacity
                style={[pw.planMonthly, selected === 'pro_monthly' && pw.planMonthlySelected]}
                onPress={() => setSelected('pro_monthly')}
                activeOpacity={0.9}
              >
                <View>
                  <Text style={pw.planName}>Monthly</Text>
                  <Text style={pw.planSub}>cancel anytime</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={pw.planPrice}>$9.99</Text>
                  <Text style={pw.planPriceSub}>/month</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[pw.ctaBtn, purchaseLoading && { opacity: 0.7 }]}
              onPress={handlePurchase}
              activeOpacity={0.9}
              disabled={purchaseLoading}
            >
              <LinearGradient colors={G.accent} style={pw.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {purchaseLoading
                  ? <ActivityIndicator color={C.black} />
                  : <Text style={pw.ctaText}>Start my 7-day free trial</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Trust line — one friendly row, no double disclaimers */}
            <Text style={pw.trustLine}>
              $0 today · reminded 2 days before trial ends · cancel anytime
            </Text>

            {/* Subtle links */}
            <View style={pw.footerLinks}>
              <TouchableOpacity onPress={restorePurchases} activeOpacity={0.6}>
                <Text style={pw.footerLink}>Restore</Text>
              </TouchableOpacity>
              <Text style={pw.footerDot}>·</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={pw.footerLink}>Terms</Text>
              </TouchableOpacity>
              <Text style={pw.footerDot}>·</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={pw.footerLink}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const pw = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.94, overflow: 'hidden', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.accent + '22' },
  closeBtn:        { position: 'absolute', top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },

  hero:            { alignItems: 'center', paddingTop: 36, paddingBottom: 22, paddingHorizontal: 28 },
  heroIconCircle:  { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  eyebrow:         { fontSize: 10, fontWeight: '800', color: C.accent, letterSpacing: 2, marginTop: 18 },
  heroHeadline:    { fontSize: 24, lineHeight: 30, fontWeight: '800', color: C.text, textAlign: 'center', marginTop: 10, maxWidth: 320, letterSpacing: -0.3 },
  heroSub:         { fontSize: 13, lineHeight: 19, color: C.textSub, textAlign: 'center', marginTop: 8, maxWidth: 300 },

  featureList:     { paddingHorizontal: 28, paddingTop: 6, paddingBottom: 4 },
  featureRow2:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  featureDot:      { width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  featureText:     { flex: 1, fontSize: 14, color: C.text, fontWeight: '500', lineHeight: 19 },

  planStack:       { paddingHorizontal: 20, paddingTop: 18, gap: 10 },
  planAnnual:      { borderRadius: 18, padding: 18, paddingTop: 20, backgroundColor: C.bgCard, borderWidth: 2, borderColor: C.border },
  planAnnualSelected: { borderColor: C.accent, backgroundColor: C.accent + '10' },
  planMonthly:     { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planMonthlySelected: { borderColor: C.accent },
  mostPopularPill: { position: 'absolute', top: -10, left: 16, backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  mostPopularText: { fontSize: 9, fontWeight: '900', color: C.black, letterSpacing: 0.7 },
  planName:        { fontSize: 16, fontWeight: '800', color: C.text },
  planSub:         { fontSize: 12, color: C.textMuted, marginTop: 2 },
  planPrice:       { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  planPriceSub:    { fontSize: 11, color: C.textMuted, marginTop: 1 },

  ctaBtn:          { marginHorizontal: 20, marginTop: 18, borderRadius: 999, overflow: 'hidden', shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  ctaGrad:         { height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText:         { fontSize: 16, fontWeight: '900', color: C.black, letterSpacing: 0.2 },

  trustLine:       { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 12, marginHorizontal: 24, lineHeight: 16 },

  footerLinks:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 },
  footerLink:      { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  footerDot:       { fontSize: 11, color: C.textMuted },
});

const XP_PER_LEVEL = 500;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE DATA  (videoId + mute replaces searchQuery)
// ─────────────────────────────────────────────────────────────────────────────
const EXERCISE_LEVELS = [
  {
    id: 1,
    name: 'Beginner',
    subtitle: 'Foundation Building',
    color: '#3FB950',
    icon: '🌱',
    xpReward: 500,
    description: 'Build the core strength and body awareness every handstand requires.',
    exercises: [
      {
        id: 'hollow_body',
        name: 'Hollow Body Hold',
        emoji: '🔥',
        recordDuration: 30,
        sets: '3 × 20–30 sec',
        description: 'Lie on back, press lower back to floor, lift arms and legs slightly. Builds core for a straight handstand.',
        instructions: 'Lie on your back with arms extended overhead. Press your lower back firmly into the floor – this is the key cue. Simultaneously lift your arms, head, shoulders, and straight legs just a few inches off the ground. Hold this hollow dish shape. If your lower back lifts, raise your legs higher until it stays grounded.',
        tip: 'Think of your body as a banana. The lower back MUST stay on the floor the entire hold.',
        videoId: 'B252KhFvWaY',
        mute: true,
      },
      {
        id: 'extended_plank',
        name: 'Extended Plank',
        emoji: '💪',
        recordDuration: 30,
        sets: '3 × 30–45 sec',
        description: 'Plank position with hands further forward than shoulders. Builds shoulder and core strength.',
        instructions: 'Start in a normal plank, then walk your hands 6–12 inches further from your body so they are well in front of your shoulders. Maintain a rigid straight body from head to heels. Keep hips level – do not let them sag or pike. The further forward the hands, the harder the exercise.',
        tip: 'This mimics the shoulder load of a handstand. Squeeze your core and glutes throughout.',
        videoId: 'kAZkLII49fk',
        mute: true,
      },
      {
        id: 'wall_walks',
        name: 'Wall Walks',
        emoji: '🧱',
        sets: '3 × 5 reps',
        description: 'Start in push-up position with feet at wall, walk hands back while feet climb the wall until chest touches wall.',
        instructions: 'Begin in a push-up position with feet against the wall. Simultaneously walk your hands backward toward the wall while your feet climb up the wall. Walk until your chest and belly are as close to the wall as possible. Then reverse – walk hands out as feet descend. Move slowly and controlled the entire time.',
        tip: 'The closer your chest gets to the wall, the closer you are to a real handstand position.',
        videoId: 'sfPsRW0eypU',
        mute: false,
      },
      {
        id: 'chest_wall_hs',
        name: 'Chest-to-Wall Handstand',
        emoji: '🤸',
        recordDuration: 20,
        sets: '5 × 10–30 sec holds',
        description: 'Static hold with chest, belly and hips touching the wall, hands close to wall. Teaches perfect straight line.',
        instructions: 'Face away from the wall. Place hands very close to the wall (6–8 inches). Walk feet up the wall and hands in until your chest, belly, and hips are all touching the wall. Push the floor away actively through straight arms. This position teaches the exact body shape needed for freestanding – a perfectly rigid straight line.',
        tip: 'Hands too far from wall = banana back. Stay close to keep the hollow straight position.',
        videoId: 'lb3ZGnLZ474',
        mute: true,
      },
      {
        id: 'pike_hold',
        name: 'Pike Hold',
        emoji: '🔼',
        recordDuration: 30,
        sets: '3 × 30–60 sec',
        description: 'Push hips up high, straight arms and back, 90 degree angle at hips. Builds shoulder flexibility and strength.',
        instructions: 'Start on all fours. Push your hips up and back as high as possible, fully straightening both arms and legs. Your body forms an inverted V with roughly a 90-degree angle at your hips. Actively press through your shoulders – do not let them collapse. Hold this position, feeling the load build on your shoulders.',
        tip: 'Look back toward your feet. The more you compress the hip angle, the better the shoulder load.',
        videoId: '1vwWeqpknUc',
        mute: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Intermediate',
    subtitle: 'Wrist Balance & Inversion',
    color: '#388BFD',
    icon: '🔥',
    xpReward: 1000,
    description: 'Develop wrist balance, inversion confidence, and targeted handstand strength.',
    exercises: [
      {
        id: 'crow_pose',
        name: 'Crow Pose',
        emoji: '🦅',
        sets: '5 × max hold attempts',
        description: 'Balance knees on elbows with hands on floor. Builds wrist balance and finger strength.',
        instructions: 'Squat and place hands flat on the floor shoulder-width apart. Bend elbows slightly and rest your knees on your upper arms near your armpits. Lean weight forward gradually until feet lift off the ground. Balance on your hands with knees pressing into your triceps. Keep your gaze forward, not down at the floor.',
        tip: 'This is your first real balance on your hands. The fear of falling forward is normal – lean into it.',
        videoId: 'fHgSQTe73Eg',
        mute: true,
      },
      {
        id: 'toe_pulls',
        name: 'Toe Pulls',
        emoji: '👇',
        sets: '3 × 8 pulls',
        description: 'From chest-to-wall handstand, press fingers hard into floor to lift feet off wall for a few seconds.',
        instructions: 'Get into your chest-to-wall handstand. Once stable, begin pressing your fingertips hard into the floor to shift weight slightly away from the wall. Try to lift one or both feet off the wall for 1–2 seconds before gently returning. You are searching for the freestanding balance point just beyond the wall.',
        tip: 'Do not kick off the wall – lift gently. You are learning micro-balance adjustments.',
        videoId: 'x5A0pLArpkI',
        mute: false,
      },
      {
        id: 'kickups',
        name: 'Kick-ups',
        emoji: '🦵',
        sets: '3 × 10 attempts',
        description: 'Practice kicking up to handstand against wall with one leg pushing and one swinging. Goal is soft controlled arrival.',
        instructions: 'Stand facing away from the wall. Place hands on the floor shoulder-width apart. Step one foot forward and swing the back leg up powerfully while the front foot pushes off the ground. The goal is to arrive at the wall softly and in control – not crash into it. Same kick, same hands, same body shape every rep.',
        tip: 'Under-kick while learning. Feel the balance point rather than slamming into the wall.',
        videoId: '8URA3YSur2M',
        mute: false,
      },
      {
        id: 'elevated_pike',
        name: 'Elevated Pike',
        emoji: '🦆',
        recordDuration: 30,
        sets: '3 × 30–45 sec',
        description: 'Pike position but feet on chair or box, much more weight on shoulders.',
        instructions: 'Place your feet on a chair or elevated surface. Walk your hands back toward your feet until your hips are as close to directly above your shoulders as possible. Arms stay straight. Your body approaches vertical. Hold this position, feeling significant load on your shoulders. The higher the surface, the harder it is.',
        tip: 'Progress gradually with box height. This is near-vertical loading without full inversion.',
        videoId: 'b52YpzcBqWA',
        mute: true,
      },
      {
        id: 'l_sit',
        name: 'L-Sit',
        emoji: '💪',
        sets: '3 × max hold',
        description: 'Hold body in air with hands only, legs straight forward. Builds core and scapula strength.',
        instructions: 'Place hands on the floor beside your hips. Push down through your hands to lift your entire body off the ground. Extend legs straight forward parallel to the floor forming an L shape. Keep shoulders depressed – pushed down, not shrugged. This is extremely demanding. Start with bent knees if needed and gradually straighten them over weeks.',
        tip: 'Scapular depression is everything. Push your shoulders DOWN away from your ears while holding.',
        videoId: 'eSijWz7GDTo',
        mute: true,
      },
    ],
  },
  {
    id: 3,
    name: 'Advanced',
    subtitle: 'Freestanding & Strength',
    color: '#BC8CFF',
    icon: '⚡',
    xpReward: 1500,
    description: 'Achieve real freestanding balance and build serious handstand-specific strength.',
    exercises: [
      {
        id: 'freestanding_hs',
        name: 'Freestanding Handstand',
        emoji: '🤸',
        recordDuration: 20,
        sets: '10+ kick-up attempts',
        description: 'Static hold in center of room, no wall support.',
        instructions: 'Kick up to handstand in the center of the room with no wall. Find balance through fingertip pressure. Falling forward: press fingertips harder. Falling backward: press palm heels. Maintain a perfectly straight line: arms by ears, ribs in, hips stacked, legs squeezed, toes pointed. Breathe slowly and steadily. Film every session.',
        tip: 'You cannot feel what you cannot see. Your shape is probably not what you think – always film.',
        videoId: 'eVjafa6NVI0',
        mute: true,
      },
      {
        id: 'bailouts',
        name: 'Bailouts',
        emoji: '🔄',
        sets: '3 × 10 controlled exits',
        description: 'Practice falling safely from handstand using cartwheel motion. Removes fear of falling.',
        instructions: 'From a handstand (against wall first, then freestanding), intentionally fall by rotating one hand outward and cartwheel-stepping down with one foot. This controlled exit must become completely automatic. Practice until you can bail smoothly every single time with zero hesitation. Do this before every freestanding session.',
        tip: 'Fear of falling is the #1 block to progress. Drill bailouts until falling feels boring.',
        videoId: 'r8WwpGQlq7U',
        mute: false,
      },
      {
        id: 'shoulder_taps',
        name: 'Wall Shoulder Taps',
        emoji: '👋',
        sets: '3 × 10 taps each side',
        description: 'From wall handstand, shift weight to one hand and tap opposite shoulder. Builds one-sided strength.',
        instructions: 'Get into your chest-to-wall handstand. Slowly shift your weight onto one hand by pressing harder through that arm. Lift your free hand and tap the opposite shoulder. Slowly replace the hand. Alternate sides. Each tap should take 3–5 seconds – slow is strong here. You are building the foundation for one-arm work.',
        tip: 'Shift weight with your shoulder, not by tilting hips. Keep the body line perfectly straight.',
        videoId: 'AGTlLisjNak',
        mute: true,
      },
      {
        id: 'wall_hspu',
        name: 'Wall HSPU',
        emoji: '💪',
        sets: '3 × 3–8 reps',
        description: 'Lower head to floor in controlled way from wall handstand, push back up.',
        instructions: 'Get into a chest-to-wall handstand. Slowly lower your head toward the floor by bending your elbows – keep them tracking over your wrists, not flaring out. Touch your head lightly to the floor, then press explosively back up to full arm extension. Control the descent completely. Never drop your head to the floor.',
        tip: 'Start with partial reps. Even lowering halfway and pressing back up builds serious pressing strength.',
        videoId: 'yxoe8kXgG74',
        mute: true,
      },
      {
        id: 'tuck_jump_hs',
        name: 'Tuck Jump to Handstand',
        emoji: '⬆️',
        sets: '3 × 8 attempts',
        description: 'Jump with both knees to chest toward balance point, then straighten legs up.',
        instructions: 'Place hands on the floor. Jump both feet simultaneously off the floor, pulling knees toward your chest in a tuck. Guide your hips over your hands toward the vertical balance point. Once you feel the center, extend legs straight up into a handstand. Both feet leave the floor together – no one-leg kick.',
        tip: 'Symmetrical inversion from both feet builds balanced strength and body awareness.',
        videoId: 'QsxWHpLLep8',
        mute: true,
      },
    ],
  },
  {
    id: 4,
    name: 'Elite',
    subtitle: 'Master Movements',
    color: '#F4C430',
    icon: '🏆',
    xpReward: 2500,
    description: 'The absolute pinnacle of handstand training. These movements take years to master.',
    exercises: [
      {
        id: 'straddle_press',
        name: 'Straddle Press',
        emoji: '🦅',
        sets: '5 × max quality reps',
        description: 'Rise to handstand from straddle stand or sit using only shoulder and core strength, no jump.',
        instructions: 'Stand in a wide straddle with hands on the floor between your feet. Lean forward, shifting weight onto hands. Use pure shoulder and core strength to slowly lift your hips and legs into the air, rising into a straddle handstand. Then squeeze legs together into a straight handstand. Absolutely no jumping or momentum allowed.',
        tip: 'Start on boxes in an L-sit to reduce the strength requirement. This takes months of pressing work.',
        videoId: 'aAErmRDDJKY',
        mute: false,
      },
      {
        id: 'freestanding_hspu',
        name: 'Freestanding HSPU',
        emoji: '🔥',
        sets: '3 × max quality reps',
        description: 'Handstand push-ups with no wall support, requires huge coordination.',
        instructions: 'From a freestanding handstand, slowly lower your head toward the floor by bending your elbows while maintaining full balance throughout the descent. Press back up to straight arms, regaining your vertical balance at the top. Every centimeter of this movement simultaneously demands strength and balance. Master wall HSPUs first.',
        tip: 'Use a spotter or spot yourself near a wall while learning the movement pattern.',
        videoId: '8D7iGST5qnk',
        mute: false,
      },
      {
        id: 'one_arm_hs',
        name: 'One Arm Handstand',
        emoji: '☝️',
        sets: '10+ balance attempts per arm',
        description: 'Shift full weight to one hand, release other hand. Requires phenomenal balance.',
        instructions: 'From a solid freestanding handstand, slowly shift your weight onto one arm by moving your hips slightly toward that side. Gradually reduce pressure on the free hand until you can briefly lift it. Balance. The free arm can reach out for counterbalance or rest against your hip. Return to two hands before losing control.',
        tip: 'Expect years of training. Dedicated one-arm sessions daily, 10+ minutes each, for years.',
        videoId: 'et_ATFxN_1Y',
        mute: true,
      },
      {
        id: 'hollowback',
        name: 'Hollowback Handstand',
        emoji: '🌊',
        sets: '5 × max hold',
        description: 'Handstand with deep back arch, shoulders pushed forward, legs past head line.',
        instructions: 'From a straight handstand, slowly open your back into a deep arch. Push your shoulders forward past your hands while your legs fall backward past your head line. In full position: back is deeply arched, shoulders are far forward of hands, legs angle well behind the vertical. Requires extraordinary shoulder and thoracic mobility.',
        tip: 'Daily thoracic bridge and shoulder mobility work is non-negotiable for this movement.',
        videoId: 'q7uhYsdVVzQ',
        mute: true,
      },
      {
        id: '90_degree_pushup',
        name: '90-Degree Push-up',
        emoji: '⚙️',
        sets: '3 × max quality reps',
        description: 'Lower from handstand to body fully parallel to floor (planche-like), push back up.',
        instructions: 'From a freestanding handstand, lower your body toward horizontal by bending your elbows while simultaneously leaning forward. Target a position where your body is fully horizontal and parallel to the floor – a planche-like position. Then press back up into the handstand. This combines handstand balance with near-planche straight-arm strength simultaneously.',
        tip: 'Train planche progressions alongside this move. One of the hardest upper body skills in calisthenics.',
        videoId: 'Xk-JcNj6lfY',
        mute: true,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WRIST WARM-UP DATA
// Wrist injuries are the #1 risk in handstand training. These six exercises
// take under 3 minutes and protect the joint before any loaded inversion work.
// ─────────────────────────────────────────────────────────────────────────────
const WRIST_WARMUP = [
  {
    id: 'wrist_circles',
    name: 'Wrist Circles',
    emoji: '🔄',
    duration: '10 circles each direction',
    instruction: 'Interlace fingers and rotate both wrists in full circles — 10 times clockwise, 10 times counter-clockwise. Move slowly through the full range of motion.',
  },
  {
    id: 'prayer_stretch',
    name: 'Prayer Stretch',
    emoji: '🙏',
    duration: '30 sec hold',
    instruction: 'Press palms together in front of your chest, fingers pointing up. Keeping palms touching, slowly lower your hands toward your waist until you feel a stretch on the underside of your wrists. Hold.',
  },
  {
    id: 'reverse_prayer',
    name: 'Reverse Prayer',
    emoji: '🤲',
    duration: '30 sec hold',
    instruction: 'Bring the backs of your hands together behind your back, fingers pointing down. Press gently and hold. This opens the top of the wrist — the side that compresses in a handstand.',
  },
  {
    id: 'finger_stretches',
    name: 'Finger Stretches',
    emoji: '🖐️',
    duration: '10 reps each hand',
    instruction: 'With one arm extended, use the other hand to gently pull all four fingers back toward you for 2 seconds, then curl them forward for 2 seconds. Repeat 10 times, then switch hands.',
  },
  {
    id: 'weight_shifts',
    name: 'Weight Shifts',
    emoji: '⚖️',
    duration: '20 reps',
    instruction: 'Get on all fours with wrists directly under shoulders. Slowly rock your body weight forward over your fingertips, then back over your heels. Keep arms straight throughout. Gradually load the wrist through its full range.',
  },
  {
    id: 'planche_lean',
    name: 'Planche Lean',
    emoji: '📐',
    duration: '3 × 10 sec holds',
    instruction: 'From a push-up position, lean your entire body forward so your shoulders pass in front of your hands. Hold for 10 seconds. This wakes up the wrist extensors under load — the exact muscles that protect you during handstand training.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WEAKNESS DIAGNOSIS — data
// ─────────────────────────────────────────────────────────────────────────────
const WEAKNESS_QUIZ = [
  {
    id: 'q1',
    question: 'When you kick up to handstand, what usually happens?',
    multi: false,
    options: [
      { label: 'I fall forward (overshoot)',         value: 'fall_forward' },
      { label: 'I fall back (don\'t reach vertical)',value: 'fall_back'    },
      { label: 'I fall to the side',                  value: 'fall_side'   },
      { label: 'I can\'t kick up high enough',        value: 'cant_kick'   },
      { label: 'I get up but can\'t hold balance',    value: 'cant_hold'   },
    ],
  },
  {
    id: 'q2',
    question: 'Where do you feel the most strain?',
    multi: true,
    options: [
      { label: 'Wrists',           value: 'wrists'   },
      { label: 'Shoulders',        value: 'shoulders'},
      { label: 'Lower back',       value: 'lower_back'},
      { label: 'Core',             value: 'core'     },
      { label: 'Nowhere specific', value: 'none'     },
    ],
  },
  {
    id: 'q3',
    question: 'How does your body line look in a handstand?',
    multi: false,
    options: [
      { label: 'Banana back (arched)',     value: 'banana'   },
      { label: 'Pike (hips bent forward)', value: 'pike'     },
      { label: 'Straight but unstable',    value: 'straight' },
      { label: 'I don\'t know',            value: 'unknown'  },
    ],
  },
  {
    id: 'q4',
    question: 'How many seconds can you hold against a wall right now?',
    multi: false,
    options: [
      { label: '0–5 seconds',   value: 'hold_0'  },
      { label: '5–15 seconds',  value: 'hold_5'  },
      { label: '15–30 seconds', value: 'hold_15' },
      { label: '30+ seconds',   value: 'hold_30' },
    ],
  },
];

const WEAKNESS_MAP = {
  fall_forward: {
    title: 'Overshooting Forward',
    icon: '⬆️',
    explanation: 'You\'re kicking too hard or letting your hips swing past vertical. The fix is learning to control the kick and stack your shoulders directly over your wrists.',
    drills: [
      {
        name: 'Chest-to-Wall Handstand',
        sets: '5 × 20–30 sec',
        cue: 'Face away from wall, hands close. Feel what vertical actually is.',
        videoId: 'lb3ZGnLZ474',
        emoji: '🤸',
      },
      {
        name: 'Shoulder Taps (Wall)',
        sets: '3 × 10 taps/side',
        cue: 'Shift weight onto one hand at a time — builds shoulder stacking.',
        videoId: 'sfPsRW0eypU',
        emoji: '👋',
      },
      {
        name: 'Hollow Body Hold',
        sets: '3 × 30 sec',
        cue: 'Lock the arch out of your back. This translates directly to a straight handstand.',
        videoId: 'B252KhFvWaY',
        emoji: '🔥',
      },
    ],
  },
  fall_back: {
    title: 'Not Reaching Vertical',
    icon: '⬇️',
    explanation: 'Your kick is too weak or your shoulder flexibility is limiting how far you can open up. Build hip flexor flexibility and kick power.',
    drills: [
      {
        name: 'Wall Walks',
        sets: '3 × 5 reps',
        cue: 'Walk all the way until your chest touches the wall — feel full shoulder flexion.',
        videoId: 'sfPsRW0eypU',
        emoji: '🧱',
      },
      {
        name: 'Pike Hold',
        sets: '3 × 45 sec',
        cue: 'Push hips as high as possible. Opens shoulder flexion range.',
        videoId: '1vwWeqpknUc',
        emoji: '🔼',
      },
      {
        name: 'Kick-Up Practice (Wall)',
        sets: '3 × 10 kick-ups',
        cue: 'Practice the kick alone — lead with the hips, not the feet.',
        videoId: 'eVjafa6NVI0',
        emoji: '🦵',
      },
    ],
  },
  fall_side: {
    title: 'Lateral Instability',
    icon: '↔️',
    explanation: 'Your hands aren\'t aligned with your shoulders or your wrists are collapsing to one side. Fix your hand placement and build lateral finger pressure.',
    drills: [
      {
        name: 'Chest-to-Wall Handstand',
        sets: '5 × 20 sec',
        cue: 'Focus on pressing equally through all 10 fingers — especially the index fingers.',
        videoId: 'lb3ZGnLZ474',
        emoji: '🤸',
      },
      {
        name: 'Extended Plank',
        sets: '3 × 40 sec',
        cue: 'Maintain perfectly square hips — lateral drift shows up here first.',
        videoId: 'kAZkLII49fk',
        emoji: '💪',
      },
      {
        name: 'Hollow Body Hold',
        sets: '3 × 30 sec',
        cue: 'Keep legs glued together. Lateral drift starts at the hips.',
        videoId: 'B252KhFvWaY',
        emoji: '🔥',
      },
    ],
  },
  cant_kick: {
    title: 'Insufficient Kick / Hip Flexor Limit',
    icon: '🦵',
    explanation: 'Your hip flexors or hamstrings are limiting how high you can send your hips. Build flexibility and explosive hip drive.',
    drills: [
      {
        name: 'Pike Hold',
        sets: '4 × 45 sec',
        cue: 'Squeeze into the angle — this is the mobility you\'re missing.',
        videoId: '1vwWeqpknUc',
        emoji: '🔼',
      },
      {
        name: 'Wall Walks',
        sets: '3 × 6 reps',
        cue: 'Every rep, try to get your chest slightly closer to the wall.',
        videoId: 'sfPsRW0eypU',
        emoji: '🧱',
      },
      {
        name: 'Hollow Body Hold',
        sets: '3 × 30 sec',
        cue: 'Core strength supports the kick. Build it here first.',
        videoId: 'B252KhFvWaY',
        emoji: '🔥',
      },
    ],
  },
  cant_hold: {
    title: 'Balance & Finger Control',
    icon: '🎯',
    explanation: 'You\'re getting inverted but losing balance immediately. This is a fingertip micro-adjustment problem — you need to train the balance reflex.',
    drills: [
      {
        name: 'Chest-to-Wall Handstand',
        sets: '6 × 30 sec',
        cue: 'Practice moving weight forward onto fingertips, then back to heel of hand.',
        videoId: 'lb3ZGnLZ474',
        emoji: '🤸',
      },
      {
        name: 'Back-to-Wall Handstand',
        sets: '5 × 20 sec',
        cue: 'Lightly touch wall with heels only. Try to come off the wall for 1 sec.',
        videoId: 'r8WwpGQlq7U',
        emoji: '🏋️',
      },
      {
        name: 'Shoulder Taps (Wall)',
        sets: '3 × 8 taps/side',
        cue: 'Each tap forces a single-arm balance shift — the core of balance training.',
        videoId: 'sfPsRW0eypU',
        emoji: '👋',
      },
    ],
  },
};

// Secondary modifier: Q2 strain → extra tip
function getStrainTip(strainAnswers) {
  if (!Array.isArray(strainAnswers) || strainAnswers.includes('none')) return null;
  if (strainAnswers.includes('wrists'))    return '🤚 Wrist strain detected — always complete the Wrist Warm-up before training.';
  if (strainAnswers.includes('lower_back')) return '🔧 Lower back strain = banana back. Prioritise hollow body holds every session.';
  if (strainAnswers.includes('shoulders')) return '💡 Shoulder strain — stretch into pike hold for 60 sec before each drill set.';
  if (strainAnswers.includes('core'))      return '🔥 Core fatigue — hollow body holds should be your daily non-negotiable.';
  return null;
}

// Q4 hold time → beginner tip
function getHoldTip(holdAnswer) {
  if (holdAnswer === 'hold_0')  return '⏱ You\'re at the start — focus only on Wall Walks and Chest-to-Wall holds for the next 2 weeks before attempting kick-ups.';
  if (holdAnswer === 'hold_5')  return '⏱ Aim to hit a solid 20-second wall hold before spending time on freestanding attempts.';
  if (holdAnswer === 'hold_30') return '⏱ Strong wall hold — you\'re ready to focus on freestanding balance. Reduce wall work and increase free attempts.';
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT – UserProgressContext + UserProgressProvider
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY        = '@handstandai_v2';
const ONBOARDING_KEY     = '@handstandai_onboarding';
const NOTIFICATIONS_KEY  = '@handstandai_notifications';
const AI_QUEUE_KEY       = '@handstandai_ai_queue';
const PLAN_KEY           = '@handstandai_plan';
const MIGRATION_KEY      = '@handstandai_migrated';
const AVATAR_KEY         = 'user_avatar_uri';
const QUIZ_ANSWERS_KEY   = 'onboarding_answers';
const QUIZ_LEVEL_KEY     = 'user_level';
const QUIZ_COMPLETE_KEY  = 'onboarding_complete';
const PREVIEW_MODE_KEY   = 'preview_mode';
const SIGNUP_COMPLETE_KEY = 'signup_complete';
const USER_NAME_KEY      = 'user_name';

const PreviewContext = React.createContext({ isPreview: false, triggerGate: () => {} });

const QUIZ_QUESTIONS = [
  // Skill assessment (feeds assignLevel — keep at start, indices 0-2 unchanged)
  { id: 0,  question: 'Can you kick up to a wall handstand?',                       options: ['Yes', 'Sometimes', 'No'] },
  { id: 1,  question: 'When you hold against the wall, how long do you last?',     options: ['0 seconds', '5-15 seconds', '15-30 seconds', '30+ seconds'] },
  { id: 2,  question: 'Ever balanced away from the wall — even for a moment?',     options: ['Never', 'A second or two', '5+ seconds'] },
  // Body & physical stats — personalizes plan and paywall copy
  { id: 3,  question: 'What is your age range?',                                    options: ['Under 18', '18-29', '30-44', '45-59', '60+'] },
  { id: 4,  question: 'What is your height?',                                       options: ["Under 5'4\"", "5'4\" – 5'9\"", "5'10\" – 6'1\"", "6'2\"+"] },
  { id: 5,  question: 'How would you describe your body type?',                     options: ['Lean', 'Athletic', 'Average', 'Heavier'] },
  // Frustrations (multi) — existing Q3, now Q6
  { id: 6,  question: "What's frustrating you the most right now?",                 options: ['I fall forward', 'I fall back', "I can't kick up", 'My wrists hurt', 'My shoulders are tight', 'Nothing — I feel solid'] },
  // Training availability
  { id: 7,  question: 'How many days a week can you realistically train?',          options: ['2-3 days', '4-5 days', '6-7 days'] },
  { id: 8,  question: "When's your best time to train?",                            options: ['Morning', 'Midday', 'Evening', 'Whenever I can'] },
  { id: 9,  question: 'How long can each session realistically be?',                options: ['Under 10 min', '10-20 min', '20-30 min', '30+ min'] },
  // Fears & mental blocks — drives encouragement copy
  { id: 10, question: 'How do you feel about being upside down?',                   options: ['Excited', 'Neutral', 'Nervous', 'Scared'] },
  { id: 11, question: "What's been stopping you the most?",                         options: ['Fear of falling', 'Fear of looking silly', "Don't know how", "Can't stay consistent", 'Nothing'] },
  { id: 12, question: 'How confident do you feel in your balance right now?',       options: ['None', 'A little', 'Moderate', 'High'] },
  // Goal + injuries (existing Q5, Q6 — now Q13, Q14)
  { id: 13, question: "What would make you proudest to achieve?",                   options: ['10-second hold', '30-second hold', '1-minute hold', 'Press to handstand', 'Walking on hands'] },
  { id: 14, question: 'Anything we should train around?',                           options: ['Wrists', 'Shoulders', 'Back', 'None'] },
];

// Maps each quiz answer to a short "unlock" message shown in real-time
// during the quiz — demonstrates value and personalization at every step.
const QUIZ_UNLOCKS = {
  0: {
    'Yes':            'Freestanding kick-up drills',
    'Sometimes':      'Kick-up consistency training',
    'No':             'Wall walk foundation progressions',
  },
  1: {
    '0 seconds':      '3-week wall endurance build',
    '5-15 seconds':   '20-second wall hold target',
    '15-30 seconds':  'Freestanding bail technique',
    '30+ seconds':    'Advanced shape drills (hollow body)',
  },
  2: {
    'Never':             'Balance-without-wall primer',
    'A second or two':   'Micro-balance corrections',
    '5+ seconds':        'Extended freestanding workouts',
  },
  3: { // Age
    'Under 18': 'Youth-paced joint-safe progressions',
    '18-29':    'Max-intensity progression track',
    '30-44':    'Balanced intensity + recovery',
    '45-59':    'Age-aware joint protection prep',
    '60+':      'Gentle approach with extra warmup',
  },
  4: { // Height
    "Under 5'4\"":    'Shorter-leverage balance tuning',
    "5'4\" – 5'9\"":  'Standard leverage progressions',
    "5'10\" – 6'1\"": 'Extended-frame balance work',
    "6'2\"+":         'Tall-frame stability coaching',
  },
  5: { // Body type
    'Lean':     'Endurance-biased plan',
    'Athletic': 'Strength + skill blend',
    'Average':  'Balanced strength & mobility build',
    'Heavier':  'Shoulder-friendly shape drills prioritized',
  },
  6: { // Frustrations (multi) — was idx 3
    'I fall forward':          'Forward-fall corrections',
    'I fall back':             'Back-fall recovery (pirouette out)',
    "I can't kick up":         'Kick-up timing drills',
    'My wrists hurt':          '3-min wrist prep routine',
    'My shoulders are tight':  'Shoulder mobility warmup',
    'Nothing — I feel solid':  'Confidence track: straight to hold progressions',
  },
  7: { // Days/week — was idx 4
    '2-3 days': 'Plan sized: 3 sessions / week',
    '4-5 days': 'Plan sized: 5 sessions / week',
    '6-7 days': 'Plan sized: Daily 15-min sessions',
  },
  8: { // Time of day
    'Morning':       'Morning mobility-led sessions',
    'Midday':        'Midday quick-hit sessions',
    'Evening':       'Evening wind-down training',
    'Whenever I can':'Flexible scheduling mode',
  },
  9: { // Session length
    'Under 10 min': 'Micro-session plan (<10 min)',
    '10-20 min':    'Compact 15-min sessions',
    '20-30 min':    'Full 25-min sessions',
    '30+ min':      'Deep 30+ min workouts',
  },
  10: { // Upside-down feeling
    'Excited': 'Advanced confidence track',
    'Neutral': 'Progressive balance build',
    'Nervous': 'Fear-graded kick-up progressions',
    'Scared':  'Wall-based safety-first progressions',
  },
  11: { // What stops you
    'Fear of falling':        'Confidence track: safe bail technique',
    'Fear of looking silly':  'Private-practice friendly program',
    "Don't know how":         'Step-by-step technique library',
    "Can't stay consistent":  'Streak coaching + reminders',
    'Nothing':                'Focused skill-only track',
  },
  12: { // Confidence
    'None':     'Stability-first foundation',
    'A little': 'Confidence-building progressions',
    'Moderate': 'Intermediate balance drills',
    'High':     'Advanced freestanding work',
  },
  13: { // Goal — was idx 5
    '10-second hold':      'Goal locked: 10-sec in 4 weeks',
    '30-second hold':      'Goal locked: 30-sec in 8 weeks',
    '1-minute hold':       'Goal locked: 60-sec in 16 weeks',
    'Press to handstand':  'Goal locked: Press progression',
    'Walking on hands':    'Goal locked: Hand-walking path',
  },
  14: { // Injuries — was idx 6
    'Wrists':    'Plan will avoid high-impact wrist work',
    'Shoulders': 'Plan will favor shoulder-friendly shapes',
    'Back':      'Plan will avoid heavy back extension',
    'None':      'Full drill library available to you',
  },
};

// Returns an ordered list of unlock strings derived from the answers given so far.
function deriveUnlocks(answers) {
  const out = [];
  for (let i = 0; i < answers.length; i++) {
    const ans = answers[i];
    const map = QUIZ_UNLOCKS[i];
    if (!map) continue;
    if (Array.isArray(ans)) {
      ans.forEach(opt => { if (map[opt]) out.push(map[opt]); });
    } else if (ans && map[ans]) {
      out.push(map[ans]);
    }
  }
  return out;
}

function assignLevel(answers) {
  const q1 = answers[0]; // kick up?
  const q2 = answers[1]; // wall hold duration
  const q3 = answers[2]; // freestanding?
  if (q1 === 'No' || q2 === '0 seconds') return 1;
  if (q2 === '5-15 seconds' && q3 === 'Never') return 2;
  if (q3 === 'A second or two') return 3;
  if (q3 === '5+ seconds' && q2 === '15-30 seconds') return 4;
  if (q3 === '5+ seconds' && q2 === '30+ seconds') return 5;
  // Fallback by wall hold
  if (q2 === '5-15 seconds') return 2;
  if (q2 === '15-30 seconds') return 3;
  return 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4 – OFFLINE HANDLING
// ─────────────────────────────────────────────────────────────────────────────
const OfflineContext = React.createContext({ isOnline: true });

function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial state
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return unsub;
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline }}>
      {children}
    </OfflineContext.Provider>
  );
}

// Banner that floats at the top of the screen when offline
function OfflineBanner() {
  const { isOnline } = useContext(OfflineContext);
  const slideAnim    = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -48 : 0,
      tension: 60, friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9998,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: S.sm,
        backgroundColor: C.bgDeep, paddingHorizontal: S.md, paddingVertical: S.sm,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <Ionicons name="cloud-offline-outline" size={14} color={C.textSub} />
        <Text style={[T.cap, { color: C.textSub, flex: 1, fontWeight: '700' }]}>
          You're offline — training features still work. AI checks will queue.
        </Text>
      </View>
    </Animated.View>
  );
}

// AI queue helpers
async function loadAIQueue() {
  try {
    const raw = await AsyncStorage.getItem(AI_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

async function enqueueAICheck(item) {
  const queue = await loadAIQueue();
  queue.push({ ...item, queuedAt: new Date().toISOString() });
  try { await AsyncStorage.setItem(AI_QUEUE_KEY, JSON.stringify(queue)); } catch (_) {}
}

async function processAIQueue(onResult) {
  const queue = await loadAIQueue();
  if (queue.length === 0) return;
  const remaining = [];
  for (const item of queue) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await aiCheckFetch(item.imageBase64, { signal: controller.signal });
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        if (onResult) onResult(item.submissionId, result);
      } else {
        // Server replied but no usable content — drop from queue to avoid loops.
        console.warn('processAIQueue: empty/invalid response', data);
      }
    } catch (e) {
      console.warn('processAIQueue: item failed', e?.message || e);
      remaining.push(item);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  try { await AsyncStorage.setItem(AI_QUEUE_KEY, JSON.stringify(remaining)); }
  catch (e) { console.warn('processAIQueue: save remaining failed', e); }
}

const DEFAULT_NOTIF_SETTINGS = {
  enabled:           false,
  reminderHour:      18,   // default 6 PM
  reminderMinute:    0,
  streakEnabled:     true,
  weeklyEnabled:     true,
  milestoneEnabled:  true, // milestone celebrations
};

// Show alerts even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

async function loadNotifSettings() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_NOTIF_SETTINGS };
  } catch (_) { return { ...DEFAULT_NOTIF_SETTINGS }; }
}

async function _saveNotifSettings(settings) {
  try { await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings)); } catch (_) {}
}

async function getNotifPermissionStatus() {
  try { const { status } = await Notifications.getPermissionsAsync(); return status; }
  catch (_) { return 'undetermined'; }
}

async function requestNotifPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return 'granted';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('handstandhub', {
        name: 'HandstandHub',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (_) { return 'denied'; }
}

// Immediate notification fired when user hits a streak milestone
async function scheduleMilestoneStreakNotif(streak) {
  try {
    const STREAK_XP = { 7: 100, 14: 200, 30: 500, 60: 1000, 100: 2000 };
    const xp = STREAK_XP[streak] || 100;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${streak}-Day Streak!`,
        body: `You're absolutely on fire. +${xp} XP awarded. Keep it going!`,
        sound: true,
      },
      trigger: null, // immediate
    });
  } catch (_) {}
}

async function scheduleAllNotifications(settings, streak = 0, freezeAvailable = 1) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.enabled) return;
    const { reminderHour: h, reminderMinute: m } = settings;

    // 1. Daily training reminder at configured time (default 6 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: streak > 0 ? `Don't break your streak!` : '🤸 Time to Train!',
        body: streak > 2
          ? `Just 5 minutes keeps your ${streak}-day streak alive 🔥`
          : "Your daily handstand practice is waiting. Let's build that skill!",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h, minute: m,
      },
    });

    // 2. 8 PM "last chance" warning (only when no freezes available)
    if (settings.streakEnabled) {
      const warningHour = Math.max(h + 1, 20); // 1h after reminder, min 8pm
      await Notifications.scheduleNotificationAsync({
        content: {
          title: freezeAvailable > 0 ? '🔥 Streak reminder' : '⚠️ Last chance!',
          body: freezeAvailable > 0
            ? `Day ${streak} streak — train now to keep it going.`
            : `You're out of freeze days. Train now or your streak resets at midnight.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: Math.min(warningHour, 22), minute: 0,
        },
      });
    }

    // 3. Freeze restored — Sunday 9 AM
    if (settings.streakEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Freeze day restored ❄️',
          body: 'You have 1 freeze day available this week.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday
          hour: 9, minute: 0,
        },
      });
    }

    // 4. Weekly progress summary — Sunday at 09:30
    if (settings.weeklyEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Progress Check',
          body: 'Another week of training done! Open the app to see your progress summary.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: 9, minute: 30,
        },
      });
    }
  } catch (_) {}
}

async function cancelStreakReminderToday() {
  // Called when user completes a session so the "don't break streak" ping is silenced
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.content.title?.includes("Don't Break Your Streak")) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (_) {}
}

const DEFAULT_PROGRESS = {
  currentLevel:              1,
  xp:                        0,
  totalXP:                   0,
  completedLevels:           [],
  submissions:               [],
  streak:                    0,
  longestStreak:             0,
  lastActiveDate:            null,
  dailyChallengeCompleted:   false,
  dailyChallengeDate:        null,
  joinDate:                  new Date().toISOString(),
  userName:                  '',
  startHereDismissed:        false,
  freezeDaysAvailable:       1,
  lastFreezeReset:           null,
  freezeUsedDates:           [],  // DateString[] of days freeze was auto-consumed
  notifiedStreakMilestones:  [],  // streak numbers we already celebrated
  lastSeenStreak:            0,   // last streak count the user saw celebrated via daily pop
  inbox:                     [],  // in-app notifications: [{ id, type, title, body, date, read }]
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGE CONTEXT + PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
const BadgeContext = React.createContext({ earned: [], checkBadges: () => {}, newBadge: null });

async function _loadEarnedBadges() {
  try {
    const raw = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

async function _saveEarnedBadges(list) {
  try { await AsyncStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(list)); } catch (_) {}
}

function BadgeProvider({ children }) {
  const [earned,   setEarned]   = useState([]);  // array of badge ids
  const [newBadge, setNewBadge] = useState(null); // badge def currently toasting
  const queueRef = useRef([]);    // badges waiting to toast
  const toasting = useRef(false);

  useEffect(() => {
    _loadEarnedBadges().then(ids => setEarned(ids));
  }, []);

  // Show queued badges one at a time, 3 s apart
  const drainQueue = useCallback(() => {
    if (toasting.current || queueRef.current.length === 0) return;
    toasting.current = true;
    const next = queueRef.current.shift();
    setNewBadge(next);
    setTimeout(() => {
      setNewBadge(null);
      toasting.current = false;
      // small gap then next
      setTimeout(drainQueue, 400);
    }, 3200);
  }, []);

  // checkBadges({ progress, voiceHistory, programsCompleted, diagnosisDone })
  const checkBadges = useCallback(async ({
    progress = {},
    voiceHistory = null,
    programsCompleted = null,
    diagnosisDone = false,
  }) => {
    const currentIds = await _loadEarnedBadges();
    const currentSet = new Set(currentIds);
    const nowEarned  = [];

    const streak       = progress.streak ?? 0;
    const sessions     = progress.submissions?.length ?? 0;
    const completedLvl = progress.completedLevels ?? [];

    // Helper: check single badge
    const tryEarn = (id) => {
      if (!currentSet.has(id)) {
        const def = BADGES.find(b => b.id === id);
        if (def) { currentSet.add(id); nowEarned.push(def); }
      }
    };

    // Streak badges (the meaningful ones — week + month commitment)
    if (streak >= 7)   tryEarn('streak_7');
    if (streak >= 30)  tryEarn('streak_30');

    // Session badge — deep commitment marker
    if (sessions >= 100) tryEarn('sessions_100');

    // Level badges — only the real-skill thresholds
    if (completedLvl.includes(3)) tryEarn('level_3');
    if (completedLvl.includes(5)) tryEarn('level_5');

    // Hold time badges — actual handstand strength milestones
    if (voiceHistory !== null) {
      const best = voiceHistory.length ? Math.max(...voiceHistory.map(h => h.duration)) : 0;
      if (best >= 5)  tryEarn('hold_5');
      if (best >= 30) tryEarn('hold_30');
      if (best >= 60) tryEarn('hold_60');
    }

    if (nowEarned.length > 0) {
      const newIds = [...currentSet];
      await _saveEarnedBadges(newIds);
      setEarned(newIds);
      // Queue toasts
      queueRef.current.push(...nowEarned);
      drainQueue();
    }
  }, [drainQueue]);

  return (
    <BadgeContext.Provider value={{ earned, checkBadges, newBadge }}>
      {children}
      <BadgeToast badge={newBadge} />
    </BadgeContext.Provider>
  );
}

function BadgeToast({ badge }) {
  const insets   = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (badge) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0,   tension: 70, friction: 11, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1,   tension: 70, friction: 11, useNativeDriver: true }),
      ]).start();
      Vibration.vibrate([0, 30, 50, 30]);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -120, duration: 280, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8,  duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <Animated.View
      style={[
        bst.wrap,
        { top: insets.top + 10, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
      pointerEvents="none"
    >
      <LinearGradient colors={['#1C1D21', '#16171A']} style={bst.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={bst.iconWrap}>
          <Text style={{ fontSize: 28 }}>{badge.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bst.label}>BADGE UNLOCKED</Text>
          <Text style={bst.title}>{badge.title}</Text>
          <Text style={bst.desc} numberOfLines={1}>{badge.description}</Text>
        </View>
        <View style={bst.xpPill}>
          <Text style={bst.xpText}>+{badge.xpReward} XP</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const bst = StyleSheet.create({
  wrap:     { position: 'absolute', left: 16, right: 16, zIndex: 9999, elevation: 99, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16 },
  card:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, borderRadius: R.xl, borderWidth: 1, borderColor: C.accent + '55' },
  iconWrap: { width: 52, height: 52, borderRadius: R.lg, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: C.accent, marginBottom: 1 },
  title:    { fontSize: 14, fontWeight: '900', color: C.text },
  desc:     { fontSize: 11, color: C.textSub, marginTop: 1 },
  xpPill:   { backgroundColor: C.accentDim, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 4, borderWidth: 1, borderColor: C.accent + '44' },
  xpText:   { fontSize: 11, fontWeight: '900', color: C.accent },
});

const UserProgressContext = React.createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE SYNC HELPERS  (used inside UserProgressProvider)
// ─────────────────────────────────────────────────────────────────────────────
async function _getAuthUserId() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch (_) { return null; }
}

// Push local progress → Supabase user_progress row (upsert)
async function _syncProgressToCloud(p, userId) {
  if (!userId) return;
  try {
    // Read quiz answers from SecureStore so the server can recompute level authoritatively
    let quizAnswers = null;
    try {
      const raw = await sensitiveStore.get(QUIZ_ANSWERS_KEY);
      if (raw) quizAnswers = JSON.parse(raw);
    } catch (_) {}

    await supabase.from('user_progress').upsert({
      user_id:                  userId,
      current_level:            p.currentLevel,
      xp:                       p.xp,
      total_xp:                 p.totalXP,
      completed_levels:         p.completedLevels,
      streak_count:             p.streak,
      last_active_date:         p.lastActiveDate,
      daily_challenge_completed: p.dailyChallengeCompleted,
      daily_challenge_date:     p.dailyChallengeDate,
      updated_at:               new Date().toISOString(),
      ...(quizAnswers !== null && { quiz_answers: quizAnswers }),
    }, { onConflict: 'user_id' });
  } catch (_) {}
}

// Push a single training session → Supabase training_sessions
async function _syncSessionToCloud(sub, userId) {
  if (!userId) return;
  try {
    await supabase.from('training_sessions').upsert({
      user_id:          userId,
      local_id:         sub.id,
      session_date:     sub.date,
      level_id:         sub.levelId,
      exercise_name:    sub.exerciseName ?? null,
      duration_seconds: sub.duration    ?? null,
      ai_detected:      sub.aiDetected  ?? null,
      ai_type:          sub.aiType      ?? null,
      ai_confidence:    sub.aiConfidence ?? null,
      form_feedback:    sub.formFeedback ?? [],
      star_rating:      sub.starRating   ?? null,
      form_score:       sub.formScore    ?? null,
      status:           sub.status      ?? 'pending',
    }, { onConflict: 'local_id' });
  } catch (e) { console.warn('_syncSessionToCloud failed', e); }
}

// Pull cloud progress and merge: cloud wins on numeric fields, local wins on submissions array
async function _mergeCloudProgress(localP, userId) {
  if (!userId) return localP;
  try {
    const { data: cloudRow } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!cloudRow) return localP;

    // Cloud wins if its updated_at is newer or if local has no date
    return {
      ...localP,
      currentLevel:    Math.max(localP.currentLevel, cloudRow.current_level ?? 1),
      xp:              Math.max(localP.xp,           cloudRow.xp            ?? 0),
      totalXP:         Math.max(localP.totalXP,      cloudRow.total_xp      ?? 0),
      completedLevels: Array.from(new Set([...(localP.completedLevels || []), ...(cloudRow.completed_levels || [])])),
      streak:          Math.max(localP.streak,       cloudRow.streak_count  ?? 0),
    };
  } catch (_) { return localP; }
}

// Pull cloud sessions and merge them into the local submissions list (by local_id)
async function _mergeCloudSessions(localSubs, userId) {
  if (!userId) return localSubs;
  try {
    const { data: cloudSessions } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(50);

    if (!cloudSessions?.length) return localSubs;

    const localIds = new Set(localSubs.map(s => s.id));
    const newFromCloud = cloudSessions
      .filter(cs => cs.local_id && !localIds.has(cs.local_id))
      .map(cs => ({
        id:           cs.local_id,
        date:         cs.session_date,
        levelId:      cs.level_id,
        exerciseName: cs.exercise_name,
        duration:     cs.duration_seconds,
        aiDetected:   cs.ai_detected,
        aiType:       cs.ai_type,
        aiConfidence: cs.ai_confidence,
        formFeedback: cs.form_feedback ?? [],
        starRating:   cs.star_rating,
        formScore:    cs.form_score,
        status:       cs.status,
      }));

    return [...localSubs, ...newFromCloud]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);
  } catch (_) { return localSubs; }
}

// Migrate all local submissions to cloud (called once after first login)
async function _migrateLocalToCloud(localProgress, userId) {
  if (!userId || !localProgress.submissions?.length) return;
  try {
    const rows = localProgress.submissions.map(sub => ({
      user_id:          userId,
      local_id:         sub.id,
      session_date:     sub.date,
      level_id:         sub.levelId,
      exercise_name:    sub.exerciseName ?? null,
      duration_seconds: sub.duration    ?? null,
      ai_detected:      sub.aiDetected  ?? null,
      ai_type:          sub.aiType      ?? null,
      ai_confidence:    sub.aiConfidence ?? null,
      form_feedback:    sub.formFeedback ?? [],
      star_rating:      sub.starRating   ?? null,
      form_score:       sub.formScore    ?? null,
      status:           sub.status      ?? 'pending',
    }));
    await supabase.from('training_sessions').upsert(rows, { onConflict: 'local_id' });
    await _syncProgressToCloud(localProgress, userId);
  } catch (_) {}
}

function UserProgressProvider({ children, onReset }) {
  const [progress,      setProgress]      = useState(DEFAULT_PROGRESS);
  const [loading,       setLoading]       = useState(true);
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
  const [notifPermission, setNotifPermission] = useState('undetermined');
  const [syncStatus,    setSyncStatus]    = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  useEffect(() => {
    _load();
    loadNotifSettings().then(s => setNotifSettings(s));
    getNotifPermissionStatus().then(s => setNotifPermission(s));
  }, []);

  async function _load() {
    try {
      const raw   = await AsyncStorage.getItem(STORAGE_KEY);
      const today = new Date().toDateString();
      const yesterday = (() => {
        const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString();
      })();

      let p;
      if (raw) {
        p = { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
        if (p.dailyChallengeDate !== today) {
          p.dailyChallengeCompleted = false;
          p.dailyChallengeDate      = null;
        }
      } else {
        p = { ...DEFAULT_PROGRESS, lastActiveDate: today };
      }

      // ── Freeze day: reset on new week (Sunday-based) ────────────────────────
      const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
      const thisSunday = new Date(todayDate);
      thisSunday.setDate(todayDate.getDate() - todayDate.getDay());
      const lastReset = p.lastFreezeReset ? new Date(p.lastFreezeReset) : null;
      if (!lastReset || lastReset < thisSunday) {
        p.freezeDaysAvailable = 1;
        p.lastFreezeReset     = thisSunday.toISOString();
        p.freezeUsedDates     = p.freezeUsedDates ?? [];
      }

      // ── Compute training streak from submissions ─────────────────────────────
      const subStreak = computeStreakFromSubs(p.submissions || []);

      // ── Auto-apply freeze if eligible ────────────────────────────────────────
      if (subStreak.frozen && subStreak.freezeGapDate) {
        const alreadyUsed = (p.freezeUsedDates || []).includes(subStreak.freezeGapDate);
        if (!alreadyUsed && (p.freezeDaysAvailable || 0) > 0) {
          p.freezeUsedDates     = [...(p.freezeUsedDates || []), subStreak.freezeGapDate];
          p.freezeDaysAvailable = Math.max(0, p.freezeDaysAvailable - 1);
          // Immediate notification: streak saved by freeze
          Notifications.scheduleNotificationAsync({
            content: {
              title: '❄️ Freeze day used!',
              body: `Your ${subStreak.streak}-day streak is protected. Train today to keep it!`,
              sound: true,
            },
            trigger: null,
          }).catch(() => {});
        }
      }

      // ── Update streak counter + longest streak ───────────────────────────────
      p.streak        = subStreak.streak;
      p.longestStreak = Math.max(p.streak, p.longestStreak || 0);
      p.lastActiveDate = today;

      // ── Cloud sync: merge then check for first-time migration ──
      const userId = await _getAuthUserId();
      if (userId) {
        setSyncStatus('syncing');
        try {
          // Check whether we need to migrate local-only data to the new account
          const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
          if (!migrated && p.submissions?.length > 0) {
            await _migrateLocalToCloud(p, userId);
            await AsyncStorage.setItem(MIGRATION_KEY, 'true');
          }
          // Merge cloud data into local
          p = await _mergeCloudProgress(p, userId);
          p.submissions = await _mergeCloudSessions(p.submissions || [], userId);
          setSyncStatus('synced');
        } catch (_) {
          setSyncStatus('error');
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      setProgress(p);
    } catch (_) {}
    setLoading(false);
  }

  async function _save(next) {
    // Always write locally first (offline-first)
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
    // Then sync to cloud if authenticated (fire-and-forget)
    _getAuthUserId().then(userId => {
      if (userId) {
        setSyncStatus('syncing');
        _syncProgressToCloud(next, userId)
          .then(() => setSyncStatus('synced'))
          .catch(() => setSyncStatus('error'));
      }
    }).catch(() => setSyncStatus('error'));
  }

  const refreshProgress = useCallback(() => { setLoading(true); _load(); }, []);

  const addXP = useCallback(async (amount) => {
    setProgress(prev => {
      const maxLevel = EXERCISE_LEVELS.length;
      let xp           = prev.xp + amount;
      let currentLevel = prev.currentLevel;
      let completedLevels = [...prev.completedLevels];

      // Process all level-ups in a loop so no XP overflow is lost when a
      // single award spans multiple thresholds (e.g. +1500 XP on a 500 XP/level cap).
      while (xp >= XP_PER_LEVEL && currentLevel < maxLevel) {
        xp -= XP_PER_LEVEL;
        if (!completedLevels.includes(currentLevel)) {
          completedLevels = [...completedLevels, currentLevel];
        }
        currentLevel += 1;
      }

      const next = {
        ...prev,
        totalXP: prev.totalXP + amount,
        xp,
        currentLevel,
        completedLevels,
      };
      _save(next);
      return next;
    });
  }, []);

  const addSubmission = useCallback(async (sub) => {
    const entry = { ...sub, id: Date.now().toString(), date: new Date().toISOString(), status: 'pending' };
    setProgress(prev => {
      const next = { ...prev, submissions: [entry, ...prev.submissions].slice(0, 50) };
      _save(next);
      return next;
    });
    // Sync this specific session to cloud (fire-and-forget)
    _getAuthUserId().then(userId => {
      if (userId) _syncSessionToCloud(entry, userId).catch(e => console.warn('syncSession failed', e));
    }).catch(e => console.warn('getAuthUserId failed', e));
    // User trained today — silence tonight's "don't break streak" reminder
    cancelStreakReminderToday();
    return entry;
  }, []);

  const completeDailyChallenge = useCallback(async () => {
    const today = new Date().toDateString();
    setProgress(prev => {
      const next = { ...prev, dailyChallengeCompleted: true, dailyChallengeDate: today };
      _save(next);
      return next;
    });
  }, []);

  const getLevelProgress = useCallback((prog) => {
    const p = prog || progress;
    return Math.min(p.xp / XP_PER_LEVEL, 1);
  }, [progress]);

  const completeLevel = useCallback((levelId) => {
    setProgress(prev => {
      if (prev.completedLevels.includes(levelId)) return prev;
      const maxLevel = EXERCISE_LEVELS.length;
      const next = {
        ...prev,
        completedLevels: [...prev.completedLevels, levelId],
        currentLevel:    Math.min(prev.currentLevel + 1, maxLevel),
      };
      _save(next);
      return next;
    });
  }, []);

  const completeLevelWithXP = useCallback((levelId, xpAmount) => {
    setProgress(prev => {
      if (prev.completedLevels.includes(levelId)) return prev;
      const maxLevel = EXERCISE_LEVELS.length;
      const newXPRaw = prev.xp + xpAmount;
      const levelUp  = newXPRaw >= XP_PER_LEVEL && prev.currentLevel < maxLevel;
      // Only advance currentLevel when the user completes their actual current
      // level (or a level above it). Completing an already-passed level must
      // not re-increment the counter.
      const newCurrentLevel = levelId >= prev.currentLevel
        ? Math.min(prev.currentLevel + 1, maxLevel)
        : prev.currentLevel;
      const next = {
        ...prev,
        totalXP:         prev.totalXP + xpAmount,
        xp:              levelUp ? newXPRaw - XP_PER_LEVEL : newXPRaw,
        currentLevel:    newCurrentLevel,
        completedLevels: [...prev.completedLevels, levelId],
      };
      _save(next);
      return next;
    });
  }, []);

  const saveUserName = useCallback(async (name) => {
    setProgress(prev => {
      const next = { ...prev, userName: name };
      _save(next);
      return next;
    });
  }, []);

  const dismissStartHere = useCallback(() => {
    setProgress(prev => {
      const next = { ...prev, startHereDismissed: true };
      _save(next);
      return next;
    });
  }, []);

  const saveNotifSettings = useCallback(async (updates) => {
    const next = { ...notifSettings, ...updates };
    setNotifSettings(next);
    await _saveNotifSettings(next);
    if (next.enabled) {
      const status = await requestNotifPermission();
      setNotifPermission(status);
      if (status === 'granted') {
        await scheduleAllNotifications(next, progress.streak, progress.freezeDaysAvailable ?? 1);
      }
    } else {
      try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (_) {}
    }
    return next;
  }, [notifSettings, progress.streak, progress.freezeDaysAvailable]);

  const enableNotifications = useCallback(async () => {
    const status = await requestNotifPermission();
    setNotifPermission(status);
    if (status === 'granted') {
      const next = { ...notifSettings, enabled: true };
      setNotifSettings(next);
      await _saveNotifSettings(next);
      await scheduleAllNotifications(next, progress.streak, progress.freezeDaysAvailable ?? 1);
    }
    return status;
  }, [notifSettings, progress.streak, progress.freezeDaysAvailable]);

  // ── Streak milestone celebrations + XP ──────────────────────────────────────
  const STREAK_MILESTONES = [7, 14, 30, 60, 100];
  const STREAK_MILESTONE_XP = { 7: 100, 14: 200, 30: 500, 60: 1000, 100: 2000 };

  const [streakCelebration, setStreakCelebration] = useState(null); // { streak, xp }
  const [streakDayPop, setStreakDayPop] = useState(null); // { streak } — small daily pop

  const pushInbox = useCallback((item) => {
    const entry = {
      id: item.id || `${item.type || 'msg'}_${Date.now()}`,
      type: item.type || 'info',
      title: item.title,
      body: item.body || '',
      date: new Date().toISOString(),
      read: false,
    };
    setProgress(prev => {
      // Dedupe by id (don't re-notify for the same milestone twice)
      if ((prev.inbox || []).some(n => n.id === entry.id)) return prev;
      const next = { ...prev, inbox: [entry, ...(prev.inbox || [])].slice(0, 40) };
      _save(next);
      return next;
    });
  }, []);

  const markInboxRead = useCallback(() => {
    setProgress(prev => {
      if (!(prev.inbox || []).some(n => !n.read)) return prev;
      const next = { ...prev, inbox: (prev.inbox || []).map(n => ({ ...n, read: true })) };
      _save(next);
      return next;
    });
  }, []);

  // Daily streak increment pop — fires every time the streak goes up (not just milestones).
  useEffect(() => {
    if (loading) return;
    const { streak: currentStreak } = computeStreakFromSubs(progress.submissions || []);
    const lastSeen = progress.lastSeenStreak || 0;
    if (currentStreak > lastSeen && currentStreak > 0) {
      const isMilestone = STREAK_MILESTONES.includes(currentStreak);
      setProgress(prev => {
        const next = { ...prev, lastSeenStreak: currentStreak };
        _save(next);
        return next;
      });
      if (!isMilestone) {
        setStreakDayPop({ streak: currentStreak });
        pushInbox({
          id: `streak_day_${currentStreak}`,
          type: 'streak',
          title: `Day ${currentStreak} streak 🔥`,
          body: `You extended your streak. Keep it going tomorrow.`,
        });
      }
    }
  }, [progress.submissions?.length, loading]);

  useEffect(() => {
    if (loading) return;
    const { streak: currentStreak } = computeStreakFromSubs(progress.submissions || []);
    for (const ms of STREAK_MILESTONES) {
      if (currentStreak >= ms && !(progress.notifiedStreakMilestones || []).includes(ms)) {
        const xpAward = STREAK_MILESTONE_XP[ms] || 100;
        // Mark notified + award XP
        setProgress(prev => {
          const next = {
            ...prev,
            notifiedStreakMilestones: [...(prev.notifiedStreakMilestones || []), ms],
            totalXP: prev.totalXP + xpAward,
          };
          _save(next);
          return next;
        });
        setStreakCelebration({ streak: ms, xp: xpAward });
        pushInbox({
          id: `streak_milestone_${ms}`,
          type: 'milestone',
          title: `${ms}-Day Streak!`,
          body: `Achievement unlocked · +${xpAward} XP. You're absolutely on fire.`,
        });
        // Fire push notification if enabled
        if (notifSettings.enabled && notifSettings.milestoneEnabled) {
          scheduleMilestoneStreakNotif(ms);
        }
        break; // show one milestone at a time; next will show next open
      }
    }
  }, [progress.streak, loading]);

  // ── Milestone + Badge checking after every progress update ─────────────────
  const milestoneCtx = useContext(MilestoneContext);
  const badgeCtx     = useContext(BadgeContext);

  useEffect(() => {
    if (loading) return;
    if (milestoneCtx?.checkMilestones) milestoneCtx.checkMilestones(progress);
    if (badgeCtx?.checkBadges) {
      loadVoiceHistory().then(vh => {
        badgeCtx.checkBadges({ progress, voiceHistory: vh });
      });
    }
  }, [progress.submissions?.length, progress.completedLevels?.length, progress.streak]);

  // ── Comeback push notification: schedule if inactive 3+ days ────────────────
  useEffect(() => {
    if (loading) return;
    const lastActive = progress.lastActiveDate ? new Date(progress.lastActiveDate) : null;
    if (!lastActive) return;
    const daysSince = Math.floor((new Date() - lastActive) / 86400000);
    if (daysSince >= 3 && notifSettings.enabled) {
      const levelName = EXERCISE_LEVELS.find(l => l.id === progress.currentLevel)?.name ?? 'training';
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your muscles remember 💪',
          body: `Pick up where you left off — ${levelName} is waiting for you.`,
        },
        trigger: null, // immediate
      }).catch(() => {});
    }
  }, [loading]);

  return (
    <UserProgressContext.Provider value={{
      progress, loading,
      addXP, addSubmission, completeDailyChallenge,
      getLevelProgress, completeLevel, completeLevelWithXP,
      saveUserName, dismissStartHere, refreshProgress,
      notifSettings, notifPermission,
      saveNotifSettings, enableNotifications,
      syncStatus,
      streakCelebration,
      dismissStreakCelebration: () => setStreakCelebration(null),
      streakDayPop,
      dismissStreakDayPop: () => setStreakDayPop(null),
      pushInbox, markInboxRead,
      onReset: onReset || null,
    }}>
      {children}
    </UserProgressContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

function getDailyChallenge(currentLevel) {
  const levelData = EXERCISE_LEVELS.find(l => l.id === Math.min(currentLevel, EXERCISE_LEVELS.length)) || EXERCISE_LEVELS[0];
  // Use the ISO day-of-year so every calendar day maps to a unique index,
  // giving uniform distribution across all exercises.
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const ex = levelData.exercises[dayOfYear % levelData.exercises.length];
  return { text: `Train ${ex.name} – ${ex.sets}`, xp: 40 + (currentLevel - 1) * 15, icon: ex.emoji, exercise: ex };
}

// Returns array of last 7 days: { label:'Mon', date:'Mon Apr 01 2026', isToday:bool }
function getWeekDays() {
  const days = [];
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: labels[d.getDay()],
      dateStr: d.toDateString(),
      isToday: i === 0,
      day: d.getDate(),
    });
  }
  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ value, color = C.accent, height: h = 5, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value, useNativeDriver: false, tension: 40, friction: 8 }).start();
  }, [value]);
  return (
    <View style={[{ height: h, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' }, style]}>
      <Animated.View style={{
        height: h, backgroundColor: color, borderRadius: R.full,
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: TutorialModal – YouTube player via react-native-youtube-iframe
// ─────────────────────────────────────────────────────────────────────────────
function TutorialModal({ visible, exercise, onClose }) {
  const insets = useSafeAreaInsets();
  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state each time the modal opens
  useEffect(() => {
    if (visible) {
      setPlaying(false);
      setLoading(true);
      setHasError(false);
    } else {
      // Stop playback when modal closes so audio doesn't leak
      setPlaying(false);
    }
  }, [visible]);

  if (!exercise) return null;

  const videoPlayerHeight = width * (9 / 16); // 16:9 aspect ratio

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[tm.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={tm.header}>
          <TouchableOpacity onPress={onClose} style={tm.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={tm.headerMid}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>{exercise.emoji}</Text>
            <View>
              <Text style={[T.h4, { color: C.white }]} numberOfLines={1}>{exercise.name}</Text>
              <Text style={[T.label, { color: C.accent }]}>VIDEO TUTORIAL</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={tm.closeBtn}>
            <Ionicons name="close" size={20} color={C.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Video player area */}
          <View style={[tm.playerWrap, { height: videoPlayerHeight }]}>
            {hasError ? (
              /* ── Error state ── */
              <View style={tm.errorBox}>
                <Ionicons name="wifi-outline" size={36} color={C.textMuted} />
                <Text style={[T.body, { color: C.textSub, marginTop: S.sm, textAlign: 'center' }]}>
                  Video unavailable — check your connection
                </Text>
                <TouchableOpacity
                  style={tm.retryBtn}
                  onPress={() => { setHasError(false); setLoading(true); setPlaying(false); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={16} color={C.black} />
                  <Text style={[T.cap, { color: C.black, fontWeight: '800' }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <YoutubePlayer
                  height={videoPlayerHeight}
                  videoId={exercise.videoId}
                  play={playing}
                  onReady={() => setLoading(false)}
                  onError={() => { setLoading(false); setHasError(true); }}
                  onChangeState={(state) => {
                    if (state === 'ended') setPlaying(false);
                  }}
                  initialPlayerParams={{
                    modestbranding: 1,
                    rel: 0,
                    controls: 1,
                  }}
                  webViewStyle={{ opacity: loading ? 0 : 1 }}
                  webViewProps={{
                    allowsFullscreenVideo: true,
                    mediaPlaybackRequiresUserAction: false,
                  }}
                />

                {/* Loading overlay — sits on top until onReady fires */}
                {loading && (
                  <View style={tm.loadingOverlay}>
                    <View style={tm.loadingLogo}>
                      <Ionicons name="logo-youtube" size={40} color="#FF0000" />
                    </View>
                    <ActivityIndicator color={C.accent} size="small" style={{ marginTop: S.md }} />
                    <Text style={[T.small, { marginTop: S.sm, color: C.textSub }]}>Loading tutorial…</Text>
                  </View>
                )}

                {/* Tap-to-play overlay — shown before first play */}
                {!loading && !playing && (
                  <TouchableOpacity
                    style={tm.playOverlay}
                    onPress={() => setPlaying(true)}
                    activeOpacity={0.85}
                  >
                    <View style={tm.playBtn}>
                      <Ionicons name="play" size={28} color={C.white} />
                    </View>
                    <Text style={[T.small, { color: C.white, marginTop: S.sm, fontWeight: '600' }]}>
                      Tap to play
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Exercise info below the player */}
          <View style={tm.infoSection}>
            <Text style={T.h3}>{exercise.name}</Text>
            {exercise.sets && (
              <View style={tm.setsPill}>
                <Ionicons name="repeat-outline" size={12} color={C.accent} />
                <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>{exercise.sets}</Text>
              </View>
            )}
            <Text style={[T.body, { marginTop: S.md, lineHeight: 22, color: C.textSub }]}>
              {exercise.instructions || exercise.description}
            </Text>
            {exercise.tip && (
              <View style={tm.tipBox}>
                <Text style={{ fontSize: 16 }}>💡</Text>
                <Text style={[T.small, { flex: 1, color: C.text, lineHeight: 18 }]}>{exercise.tip}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const tm = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bgDeep },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingVertical: S.sm, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border },
  headerMid:      { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.sm },
  backBtn:        { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  closeBtn:       { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  playerWrap:     { backgroundColor: '#000', overflow: 'hidden' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  loadingLogo:    { width: 72, height: 72, borderRadius: 36, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },
  playOverlay:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  playBtn:        { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  errorBox:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard, paddingHorizontal: S.xl },
  retryBtn:       { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.accent, paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.xl, marginTop: S.lg },
  infoSection:    { padding: S.lg },
  setsPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: S.xs },
  tipBox:         { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, backgroundColor: C.bgCard, borderRadius: R.md, padding: S.md, borderLeftWidth: 3, borderLeftColor: C.accent, marginTop: S.lg },
});

// ─────────────────────────────────────────────────────────────────────────────
// WEAKNESS DIAGNOSIS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function WeaknessDiagnosisModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const badgeCtx = useContext(BadgeContext);
  const { progress } = useContext(UserProgressContext);
  // 'quiz' | 'result'
  const [phase, setPhase] = useState('quiz');
  const [step,  setStep]  = useState(0);
  // answers[0] = single string | answers[1] = array | etc.
  const [answers, setAnswers] = useState([null, [], null, null]);
  const [result,  setResult]  = useState(null);
  const [drillModal, setDrillModal] = useState(null); // drill object for video

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setPhase('quiz');
      setStep(0);
      setAnswers([null, [], null, null]);
      setResult(null);
      setDrillModal(null);
    }
  }, [visible]);

  const animateStep = (direction, cb) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: direction * -30, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      slideAnim.setValue(direction * 30);
      cb();
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  };

  const q = WEAKNESS_QUIZ[step];

  const selectOption = (value) => {
    const next = [...answers];
    if (q.multi) {
      const cur = Array.isArray(next[step]) ? next[step] : [];
      if (value === 'none') {
        next[step] = cur.includes('none') ? [] : ['none'];
      } else {
        const withoutNone = cur.filter(v => v !== 'none');
        next[step] = withoutNone.includes(value)
          ? withoutNone.filter(v => v !== value)
          : [...withoutNone, value];
      }
      setAnswers(next);
    } else {
      next[step] = value;
      setAnswers(next);
    }
  };

  const hasAnswer = () => {
    if (q.multi) return Array.isArray(answers[step]) && answers[step].length > 0;
    return answers[step] !== null;
  };

  const handleNext = () => {
    if (!hasAnswer()) return;
    if (step < WEAKNESS_QUIZ.length - 1) {
      animateStep(1, () => setStep(s => s + 1));
    } else {
      // Compute result
      const weakness = answers[0] || 'cant_hold';
      const diagnosis = WEAKNESS_MAP[weakness];
      const strainTip = getStrainTip(answers[1]);
      const holdTip   = getHoldTip(answers[3]);
      setResult({ ...diagnosis, strainTip, holdTip });
      badgeCtx?.checkBadges({ progress, diagnosisDone: true });
      AsyncStorage.setItem('@handstandai_weakness_done', 'true').catch(() => {});
      animateStep(1, () => setPhase('result'));
    }
  };

  const handleBack = () => {
    if (step === 0) { onClose(); return; }
    animateStep(-1, () => setStep(s => s - 1));
  };

  const handleRetake = () => {
    animateStep(-1, () => {
      setPhase('quiz');
      setStep(0);
      setAnswers([null, [], null, null]);
      setResult(null);
    });
  };

  if (!visible) return null;

  const progressPct = ((step) / WEAKNESS_QUIZ.length) * 100;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Drill video modal (nested) */}
      {drillModal && (
        <Modal visible animationType="slide" onRequestClose={() => setDrillModal(null)} statusBarTranslucent>
          <TutorialModal visible exercise={drillModal} onClose={() => setDrillModal(null)} />
        </Modal>
      )}

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.bg, '#0D0D0F']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={[wd.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={phase === 'result' ? handleRetake : handleBack} style={wd.headerBtn} activeOpacity={0.7}>
            <Ionicons name={phase === 'result' ? 'refresh-outline' : 'arrow-back'} size={18} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: S.sm }}>
            <Text style={[T.label, { color: C.accent }]}>WEAKNESS DIAGNOSIS</Text>
            <Text style={[T.h4, { fontSize: 13 }]}>
              {phase === 'quiz' ? `Question ${step + 1} of ${WEAKNESS_QUIZ.length}` : 'Your Diagnosis'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={wd.headerBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Progress bar (quiz only) */}
        {phase === 'quiz' && (
          <View style={wd.progressTrack}>
            <Animated.View style={[wd.progressFill, { width: `${progressPct}%` }]} />
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 40, paddingTop: S.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── QUIZ PHASE ── */}
            {phase === 'quiz' && (
              <>
                <Text style={[T.h3, { marginBottom: S.md, lineHeight: 30 }]}>{q.question}</Text>
                {q.multi && (
                  <Text style={[T.cap, { color: C.accent, marginBottom: S.md }]}>SELECT ALL THAT APPLY</Text>
                )}
                {q.options.map(opt => {
                  const selected = q.multi
                    ? Array.isArray(answers[step]) && answers[step].includes(opt.value)
                    : answers[step] === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[wd.optionRow, selected && wd.optionRowSelected]}
                      onPress={() => selectOption(opt.value)}
                      activeOpacity={0.8}
                    >
                      <View style={[wd.optionCheck, selected && wd.optionCheckSelected]}>
                        {selected && <Ionicons name="checkmark" size={12} color={C.black} />}
                      </View>
                      <Text style={[wd.optionLabel, selected && { color: C.accent }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[wd.nextBtn, !hasAnswer() && { opacity: 0.35 }]}
                  onPress={handleNext}
                  activeOpacity={0.85}
                  disabled={!hasAnswer()}
                >
                  <LinearGradient colors={G.accent} style={wd.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>
                      {step === WEAKNESS_QUIZ.length - 1 ? 'Get My Diagnosis' : 'Next'}
                    </Text>
                    <Ionicons name={step === WEAKNESS_QUIZ.length - 1 ? 'flash' : 'arrow-forward'} size={16} color={C.black} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* ── RESULT PHASE ── */}
            {phase === 'result' && result && (
              <>
                {/* Weakness banner */}
                <View style={wd.weaknessBanner}>
                  <LinearGradient colors={[C.accentDim, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Text style={{ fontSize: 36, marginBottom: S.sm }}>{result.icon}</Text>
                  <Text style={[T.label, { color: C.accent, marginBottom: 4 }]}>YOUR #1 WEAKNESS</Text>
                  <Text style={[T.h2, { textAlign: 'center', marginBottom: S.sm, lineHeight: 30 }]}>{result.title}</Text>
                  <Text style={[T.body, { textAlign: 'center', color: C.textSub, lineHeight: 22, maxWidth: 300 }]}>
                    {result.explanation}
                  </Text>
                </View>

                {/* Extra tips from Q2/Q4 */}
                {result.strainTip && (
                  <View style={wd.tipCard}>
                    <Text style={[T.small, { lineHeight: 18, color: C.text }]}>{result.strainTip}</Text>
                  </View>
                )}
                {result.holdTip && (
                  <View style={wd.tipCard}>
                    <Text style={[T.small, { lineHeight: 18, color: C.text }]}>{result.holdTip}</Text>
                  </View>
                )}

                {/* Drill list */}
                <Text style={[T.label, { color: C.textMuted, marginTop: S.lg, marginBottom: S.sm }]}>YOUR 3 TARGETED DRILLS</Text>
                {result.drills.map((drill, i) => (
                  <View key={i} style={wd.drillCard}>
                    <View style={wd.drillLeft}>
                      <View style={wd.drillNum}><Text style={{ fontSize: 11, fontWeight: '900', color: C.black }}>{i + 1}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[T.h4, { fontSize: 14 }]}>{drill.emoji}  {drill.name}</Text>
                        <Text style={[T.cap, { color: C.accent, marginTop: 2 }]}>{drill.sets}</Text>
                        <Text style={[T.small, { color: C.textSub, marginTop: 4, lineHeight: 18 }]}>{drill.cue}</Text>
                      </View>
                    </View>
                    {drill.videoId && (
                      <TouchableOpacity
                        style={wd.drillYt}
                        onPress={() => setDrillModal({ name: drill.name, emoji: drill.emoji, videoId: drill.videoId, instructions: drill.cue })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play-circle" size={28} color={C.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* CTA */}
                <TouchableOpacity style={[wd.nextBtn, { marginTop: S.lg }]} onPress={onClose} activeOpacity={0.85}>
                  <LinearGradient colors={G.accent} style={wd.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Start Training These Drills</Text>
                    <Ionicons name="barbell" size={16} color={C.black} />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: S.md }} onPress={handleRetake} activeOpacity={0.7}>
                  <Text style={[T.small, { color: C.textMuted }]}>Retake quiz</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const wd = StyleSheet.create({
  header:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingBottom: S.sm },
  headerBtn:           { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  progressTrack:       { height: 3, backgroundColor: C.bgCard, marginHorizontal: S.md, marginBottom: S.sm, borderRadius: 2, overflow: 'hidden' },
  progressFill:        { height: 3, backgroundColor: C.accent, borderRadius: 2 },
  optionRow:           { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.border },
  optionRowSelected:   { borderColor: C.accent, backgroundColor: C.accentDim },
  optionCheck:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  optionCheckSelected: { backgroundColor: C.accent, borderColor: C.accent },
  optionLabel:         { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  nextBtn:             { borderRadius: R.xxl, overflow: 'hidden', marginTop: S.md },
  nextGrad:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 4 },
  weaknessBanner:      { alignItems: 'center', backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.xl, marginBottom: S.md, borderWidth: 1, borderColor: C.accent + '33', overflow: 'hidden' },
  tipCard:             { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.border },
  drillCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.border, gap: S.sm },
  drillLeft:           { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  drillNum:            { width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  drillYt:             { paddingLeft: S.sm },
  // HomeScreen entry card
  weaknessEntryCard:   { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.accent + '55' },
  weaknessEntryIcon:   { width: 44, height: 44, borderRadius: R.md, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// VOICE TIMER SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const START_WORDS = ['start', 'go', 'begin'];
const STOP_WORDS  = ['stop', 'down', 'end'];

function matchesWord(transcript, words) {
  const t = transcript.toLowerCase();
  return words.some(w => t.includes(w));
}

async function loadVoiceHistory() {
  try {
    const raw = await AsyncStorage.getItem(VOICE_TIMER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

async function saveVoiceAttempt(seconds) {
  try {
    const history = await loadVoiceHistory();
    const next = [{ date: new Date().toISOString(), duration: seconds }, ...history].slice(0, 100);
    await AsyncStorage.setItem(VOICE_TIMER_KEY, JSON.stringify(next));
    return next;
  } catch (_) { return []; }
}

function todaysBest(history) {
  const today = new Date().toDateString();
  const todays = history.filter(h => new Date(h.date).toDateString() === today);
  return todays.length ? Math.max(...todays.map(h => h.duration)) : 0;
}

function fmtTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// iOS limits a single speech session to ~60 sec. We restart every 50 sec.
const SESSION_RESTART_MS = 50000;

// VoiceTimerScreen disabled for Expo Go — @react-native-voice/voice is a native module
// not available in the Expo Go client. Re-enable when building with EAS Build / dev client.
function VoiceTimerScreen() {
  return null;
}
function _VoiceTimerScreen_disabled({ visible, onClose }) {
  if (true) return null;
  const insets    = useSafeAreaInsets();
  const badgeCtx  = useContext(BadgeContext);
  const { progress } = useContext(UserProgressContext);

  // 'idle' | 'holding' | 'error' | 'manual'
  const [mode,        setMode]        = useState('idle');
  const [seconds,     setSeconds]     = useState(0);
  const [history,     setHistory]     = useState([]);
  const [lastHold,    setLastHold]    = useState(0);
  const [status,      setStatus]      = useState("Say 'START' to begin");
  const [permDenied,  setPermDenied]  = useState(false);
  const [voiceError,  setVoiceError]  = useState(false);
  const [listening,   setListening]   = useState(false);

  const tickRef       = useRef(null);
  const restartRef    = useRef(null);
  const secondsRef    = useRef(0);
  const modeRef       = useRef('idle');
  const mountedRef    = useRef(false);

  // Animated pulse for mic icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  // Tint when holding
  const tintAnim  = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    pulseLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ]));
    pulseLoop.current.start();
  };
  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  // ── voice helpers ────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      await Voice.start('en-US');
      if (mountedRef.current) setListening(true);
    } catch (e) {
      if (mountedRef.current) setVoiceError(true);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try { await Voice.stop(); } catch (_) {}
    if (mountedRef.current) setListening(false);
  }, []);

  // Restart session every 50 sec to beat iOS limit
  const scheduleRestart = useCallback(() => {
    clearTimeout(restartRef.current);
    restartRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try { await Voice.stop(); } catch (_) {}
      await startListening();
      scheduleRestart();
    }, SESSION_RESTART_MS);
  }, [startListening]);

  // ── timer helpers ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    modeRef.current = 'holding';
    setMode('holding');
    setStatus("Holding! Say 'STOP' when done");
    Animated.timing(tintAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    tickRef.current = setInterval(() => {
      secondsRef.current += 1;
      if (mountedRef.current) setSeconds(secondsRef.current);
    }, 1000);
  }, [tintAnim]);

  const stopTimer = useCallback(async () => {
    clearInterval(tickRef.current);
    modeRef.current = 'idle';
    const held = secondsRef.current;
    secondsRef.current = 0;
    setSeconds(0);
    setMode('idle');
    setStatus("Say 'START' to begin");
    Animated.timing(tintAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    if (held > 0) {
      setLastHold(held);
      const next = await saveVoiceAttempt(held);
      if (mountedRef.current) setHistory(next);
      Vibration.vibrate([0, 40, 60, 40]);
      // Badge check with fresh hold history
      badgeCtx?.checkBadges({ progress, voiceHistory: next });
    }
  }, [tintAnim, badgeCtx, progress]);

  // ── Voice event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    mountedRef.current = true;

    Voice.onSpeechResults = (e) => {
      if (!mountedRef.current) return;
      const transcript = (e.value || []).join(' ');
      if (modeRef.current !== 'holding' && matchesWord(transcript, START_WORDS)) {
        startTimer();
      } else if (modeRef.current === 'holding' && matchesWord(transcript, STOP_WORDS)) {
        stopTimer();
      }
    };

    Voice.onSpeechError = (e) => {
      // Error 7 = "No match" — benign, just restart
      const code = e?.error?.code ?? e?.error;
      const benign = code === '7' || code === 7 || String(code).includes('no match');
      if (!mountedRef.current) return;
      if (benign) {
        startListening();
      } else {
        setVoiceError(true);
        setListening(false);
      }
    };

    Voice.onSpeechEnd = () => {
      // OS ended session — restart if still mounted
      if (mountedRef.current) startListening();
    };

    (async () => {
      // Load history
      const h = await loadVoiceHistory();
      if (mountedRef.current) setHistory(h);

      // Check permission via starting a session; the OS prompts if needed
      try {
        await Voice.start('en-US');
        if (mountedRef.current) {
          setListening(true);
          setVoiceError(false);
          setPermDenied(false);
          startPulse();
          scheduleRestart();
        }
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = String(e?.message || e);
        if (msg.includes('permission') || msg.includes('denied')) {
          setPermDenied(true);
        } else {
          setVoiceError(true);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      clearInterval(tickRef.current);
      clearTimeout(restartRef.current);
      stopListening();
      stopPulse();
      Voice.onSpeechResults = null;
      Voice.onSpeechError   = null;
      Voice.onSpeechEnd     = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Manual mode handlers ─────────────────────────────────────────────────
  const handleManualStart = () => {
    if (modeRef.current === 'holding') return;
    startTimer();
  };
  const handleManualStop = () => {
    if (modeRef.current !== 'holding') return;
    stopTimer();
  };

  const switchToManual = async () => {
    await stopListening();
    clearTimeout(restartRef.current);
    stopPulse();
    setListening(false);
    setVoiceError(false);
    setMode('manual');
    modeRef.current = 'manual';
    setStatus('Tap START to begin');
  };

  const switchToVoice = async () => {
    if (modeRef.current === 'holding') stopTimer();
    setMode('idle');
    modeRef.current = 'idle';
    setVoiceError(false);
    setStatus("Say 'START' to begin");
    await startListening();
    startPulse();
    scheduleRestart();
  };

  if (!visible) return null;

  const todayBest   = todaysBest(history);
  const isHolding   = mode === 'holding';
  const isManual    = mode === 'manual';
  const timerColor  = isHolding ? C.accent : C.text;
  const tintBg      = tintAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(215,255,61,0)', 'rgba(215,255,61,0.06)'] });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Animated.View style={[vt.container, { backgroundColor: tintBg }]}>
        <LinearGradient colors={[C.bg, '#0D0D0F']} style={StyleSheet.absoluteFill} pointerEvents="none" />

        {/* Header */}
        <View style={[vt.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={vt.headerBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={[T.label, { color: C.accent, letterSpacing: 2 }]}>HANDS-FREE TIMER</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Permission denied state */}
        {permDenied ? (
          <View style={vt.centeredContent}>
            <Ionicons name="mic-off-outline" size={56} color={C.textMuted} />
            <Text style={[T.h3, { textAlign: 'center', marginTop: S.lg }]}>Microphone Access Needed</Text>
            <Text style={[T.body, { textAlign: 'center', color: C.textSub, marginTop: S.sm, maxWidth: 280, lineHeight: 22 }]}>
              HandstandHub needs microphone and speech recognition permission to detect your voice commands.
            </Text>
            <TouchableOpacity
              style={[vt.accentBtn, { marginTop: S.xl }]}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={vt.accentBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Open Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: S.md }} onPress={switchToManual} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Use manual timer instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={vt.centeredContent}>

            {/* Timer display */}
            <Text style={[vt.timerText, { color: timerColor }]}>{fmtTime(seconds)}</Text>

            {/* Status text */}
            <Text style={[T.body, { color: isHolding ? C.accent : C.textSub, marginTop: S.sm, fontWeight: isHolding ? '700' : '400' }]}>
              {status}
            </Text>

            {/* Mic / manual button area */}
            {!isManual ? (
              <Animated.View style={[vt.micWrap, { transform: [{ scale: pulseAnim }] }]}>
                <View style={[vt.micCircle, listening && { borderColor: C.accent, backgroundColor: C.accentDim }]}>
                  <Ionicons
                    name={listening ? 'mic' : voiceError ? 'mic-off' : 'mic-outline'}
                    size={36}
                    color={listening ? C.accent : C.textMuted}
                  />
                </View>
                <Text style={[T.cap, { color: listening ? C.accent : C.textMuted, marginTop: S.sm }]}>
                  {listening ? 'Listening…' : voiceError ? 'Mic unavailable' : 'Starting mic…'}
                </Text>
              </Animated.View>
            ) : (
              /* Manual mode buttons */
              <View style={{ marginTop: S.xl, width: '100%', paddingHorizontal: S.xl, gap: S.sm }}>
                {!isHolding ? (
                  <TouchableOpacity style={vt.accentBtn} onPress={handleManualStart} activeOpacity={0.85}>
                    <LinearGradient colors={G.accent} style={vt.accentBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="play" size={18} color={C.black} />
                      <Text style={[T.h4, { color: C.black, fontWeight: '900', fontSize: 16 }]}>START</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={vt.accentBtn} onPress={handleManualStop} activeOpacity={0.85}>
                    <LinearGradient colors={['#FF453A', '#FF6259']} style={vt.accentBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="stop" size={18} color={C.white} />
                      <Text style={[T.h4, { color: C.white, fontWeight: '900', fontSize: 16 }]}>STOP</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Voice error retry */}
            {voiceError && !isManual && (
              <TouchableOpacity style={[vt.accentBtn, { marginTop: S.lg }]} onPress={switchToVoice} activeOpacity={0.85}>
                <LinearGradient colors={G.accent} style={vt.accentBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="refresh-outline" size={16} color={C.black} />
                  <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Retry Voice</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Stats row */}
            <View style={vt.statsRow}>
              <View style={vt.statBox}>
                <Text style={[T.label, { color: C.textMuted }]}>LAST HOLD</Text>
                <Text style={[T.h3, { color: C.text }]}>{lastHold}s</Text>
              </View>
              <View style={vt.statDivider} />
              <View style={vt.statBox}>
                <Text style={[T.label, { color: C.textMuted }]}>TODAY'S BEST</Text>
                <Text style={[T.h3, { color: todayBest > 0 ? C.accent : C.text }]}>{todayBest}s</Text>
              </View>
            </View>

            {/* Mode toggle link */}
            <TouchableOpacity
              style={{ paddingVertical: S.sm }}
              onPress={isManual ? switchToVoice : switchToManual}
              activeOpacity={0.7}
            >
              <Text style={[T.small, { color: C.textMuted }]}>
                {isManual ? '🎙 Switch to voice timer' : '👆 Tap to use manual timer'}
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const vt = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingBottom: S.md },
  headerBtn:     { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  centeredContent:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg, paddingBottom: 60 },
  timerText:     { fontSize: 88, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -2, lineHeight: 96 },
  micWrap:       { marginTop: S.xl, alignItems: 'center' },
  micCircle:     { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard },
  statsRow:      { flexDirection: 'row', alignItems: 'center', marginTop: S.xl, backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, paddingVertical: S.md },
  statBox:       { flex: 1, alignItems: 'center', gap: 4 },
  statDivider:   { width: 1, height: 40, backgroundColor: C.border },
  accentBtn:     { borderRadius: R.xxl, overflow: 'hidden', width: '100%', marginTop: S.sm },
  accentBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 4 },
  // HomeScreen entry card
  entryCard:     { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.accent + '55' },
  entryIcon:     { width: 44, height: 44, borderRadius: R.md, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: ExerciseCard (Movemate style with left accent bar)
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, levelColor, index }) {
  const [expanded,  setExpanded]  = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, 4) * 50;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, delay, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <>
      <TutorialModal visible={showModal} exercise={exercise} onClose={() => setShowModal(false)} />
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}>
        <View style={ec.card}>
          {/* Left accent bar */}
          <View style={[ec.accentBar, { backgroundColor: C.accent }]} />

          <View style={{ flex: 1 }}>
            {/* Header row */}
            <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8} style={ec.header}>
              <View style={[ec.emojiWrap, { backgroundColor: C.accentDim }]}>
                <Text style={{ fontSize: 22 }}>{exercise.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[T.h4, { fontSize: 14 }]}>{exercise.name}</Text>
                <View style={ec.setsPill}>
                  <Ionicons name="repeat-outline" size={10} color={C.accent} />
                  <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>{exercise.sets}</Text>
                </View>
              </View>
              <View style={[ec.chevronWrap, expanded && { backgroundColor: C.accent + '20' }]}>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={expanded ? C.accent : C.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Description */}
            <Text style={[T.small, { paddingHorizontal: S.md, paddingBottom: S.sm, lineHeight: 18 }]}>
              {exercise.description}
            </Text>

            {/* Expanded */}
            {expanded && (
              <View style={ec.expanded}>
                <View style={ec.divider} />
                <Text style={[T.label, { marginBottom: S.sm }]}>HOW TO DO IT</Text>
                <Text style={[T.body, { marginBottom: S.md, lineHeight: 20 }]}>{exercise.instructions}</Text>

                {exercise.tip && (
                  <View style={[ec.tipBox, { borderLeftColor: levelColor }]}>
                    <Text style={{ fontSize: 13 }}>💡</Text>
                    <Text style={[T.small, { flex: 1, color: C.text }]}>{exercise.tip}</Text>
                  </View>
                )}

                <TouchableOpacity style={ec.ytBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  <Text style={[T.h4, { fontSize: 13, color: C.text }]}>Watch Video Tutorial</Text>
                  <Ionicons name="play-circle-outline" size={16} color={C.accent} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const ec = StyleSheet.create({
  card:       { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: R.lg, marginBottom: S.sm, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  accentBar:  { width: 4, borderTopLeftRadius: R.lg, borderBottomLeftRadius: R.lg },
  header:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md },
  emojiWrap:  { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  setsPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  chevronWrap:{ width: 28, height: 28, borderRadius: R.full, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  expanded:   { paddingHorizontal: S.md, paddingBottom: S.md },
  divider:    { height: 1, backgroundColor: C.border, marginBottom: S.md },
  tipBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, backgroundColor: C.bgCardAlt, borderRadius: R.md, padding: S.sm, borderLeftWidth: 3, marginBottom: S.md },
  ytBtn:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.bgDeep, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: LevelCard (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
function LevelCard({ level, index, isUnlocked, isCurrent, proLocked, onPress }) {
  const entryAnim = useRef(new Animated.Value(0)).current;
  const isCompleted = false; // future: check progress.completedLevels.includes(level.id)
  const locked = !isUnlocked;

  useEffect(() => {
    Animated.spring(entryAnim, { toValue: 1, delay: index * 80, tension: 55, friction: 11, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: entryAnim, transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[lc.card, locked && { opacity: 0.45 }, isCurrent && lc.cardActive]}
      >
        {/* Subtle inner sheen */}
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
          pointerEvents="none"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* LEFT: 3D badge */}
          <View style={lc.badgeWrap}>
            {/* Back glow */}
            <View style={[lc.badgeLayer, locked
              ? { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)' }
              : lc.badgeBack]}
            />
            {/* Mid ring */}
            <View style={[lc.badgeLayer, locked
              ? { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.05)' }
              : lc.badgeMid]}
            />
            {/* Front face */}
            {locked ? (
              <View style={lc.badgeFrontLocked}>
                <Ionicons name={proLocked ? 'star' : 'lock-closed'} size={24} color={C.textMuted} />
              </View>
            ) : (
              <LinearGradient
                colors={['#D7FF3D', '#A8CC2E']}
                style={lc.badgeFront}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={lc.badgeNum}>{level.id}</Text>
              </LinearGradient>
            )}
            {/* Completed checkmark badge */}
            {isCompleted && (
              <View style={lc.checkBadge}>
                <Ionicons name="checkmark" size={9} color={C.black} />
              </View>
            )}
          </View>

          {/* RIGHT: text */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={lc.levelLabel}>LEVEL {level.id}</Text>
            <Text style={lc.levelName}>{level.name.toUpperCase()}</Text>
            <Text style={lc.levelSub}>{level.subtitle}</Text>

            <View style={lc.pillRow}>
              <View style={lc.pill}>
                <Ionicons name="barbell-outline" size={10} color={C.textMuted} />
                <Text style={lc.pillText}>{level.exercises.length} EXERCISES</Text>
              </View>
              <View style={lc.pill}>
                <Ionicons name="flash-outline" size={10} color={C.textMuted} />
                <Text style={lc.pillText}>+{level.xpReward} XP</Text>
              </View>
              {isCurrent && (
                <View style={lc.activePill}>
                  <View style={lc.activeDot} />
                  <Text style={lc.activeText}>ACTIVE</Text>
                </View>
              )}
              {proLocked && (
                <View style={lc.proPill}>
                  <Text style={lc.proText}>PRO</Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons
            name={locked ? (proLocked ? 'star-outline' : 'lock-closed') : 'chevron-forward'}
            size={16}
            color={locked ? C.textMuted : C.textMuted}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const lc = StyleSheet.create({
  card:           { backgroundColor: C.bgCard, borderRadius: R.xl, marginBottom: 16, borderWidth: 1, borderColor: C.border, padding: 20, overflow: 'hidden',
                    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  cardActive:     { borderColor: C.accent + '55' },
  // badge layers
  badgeWrap:      { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  badgeLayer:     { position: 'absolute' },
  badgeBack:      { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(215,255,61,0.15)',
                    shadowColor: '#D7FF3D', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  badgeMid:       { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(215,255,61,0.25)' },
  badgeFront:     { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  badgeFrontLocked:{ width: 58, height: 58, borderRadius: 29, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  badgeNum:       { fontSize: 24, fontWeight: '900', color: C.black, letterSpacing: -0.5 },
  checkBadge:     { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  // text
  levelLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: C.textMuted },
  levelName:      { fontSize: 20, fontWeight: '900', color: C.white, letterSpacing: -0.3, marginTop: 3 },
  levelSub:       { fontSize: 13, fontWeight: '500', color: C.textMuted, marginTop: 3, marginBottom: 10 },
  // pills
  pillRow:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bgCardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.full },
  pillText:       { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: C.textMuted },
  activePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.full, borderWidth: 1, borderColor: C.accent + '44' },
  activeDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  activeText:     { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: C.accent },
  proPill:        { backgroundColor: C.bgCardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.full, borderWidth: 1, borderColor: C.borderLight },
  proText:        { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: C.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: StageRow (submission processing)
// ─────────────────────────────────────────────────────────────────────────────
function StageRow({ stage, isActive, isComplete, delay }) {
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isActive) {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1100, useNativeDriver: true })).start();
    } else {
      spinAnim.stopAnimation(() => spinAnim.setValue(0));
    }
  }, [isActive]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[sr.row, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[sr.iconWrap,
        isComplete && { backgroundColor: C.successDim, borderColor: C.success + '44' },
        isActive   && { backgroundColor: C.accentDim,  borderColor: C.accent + '44' },
      ]}>
        {isComplete
          ? <Ionicons name="checkmark" size={15} color={C.success} />
          : isActive
            ? <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync-outline" size={15} color={C.accent} />
              </Animated.View>
            : <Ionicons name={stage.icon} size={15} color={C.textMuted} />
        }
      </View>
      <Text style={[T.small, isComplete && { color: C.text }, isActive && { color: C.accent, fontWeight: '700' }]}>
        {stage.label}
      </Text>
      {isComplete && <Ionicons name="checkmark-circle" size={14} color={C.success} style={{ marginLeft: 'auto' }} />}
    </Animated.View>
  );
}

const sr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm },
  iconWrap: { width: 32, height: 32, borderRadius: R.full, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
});

// ─────────────────────────────────────────────────────────────────────────────
// BRANDED SPLASH SCREEN – Movemate style
// ─────────────────────────────────────────────────────────────────────────────
function SplashScreen({ visible }) {
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  // Tracks whether the fade-out animation has fully completed so we can
  // unmount the overlay. We use state instead of reading the internal
  // ._value property, which is undocumented and unreliable.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseAnim, { toValue: 1.1,  duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim,  { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim,  { toValue: 0,    duration: 900, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!visible) {
      setHidden(false); // reset while fading out (still mounted)
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) setHidden(true); }
      );
    } else {
      fadeAnim.setValue(1);
      setHidden(false);
    }
  }, [visible]);

  if (hidden) return null;

  return (
    <Animated.View style={[sp.container, { opacity: fadeAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />

      {/* Decorative background circles */}
      <View style={sp.circle1} />
      <View style={sp.circle2} />

      <Animated.View style={[sp.glowRing, { opacity: glowAnim }]} />
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={sp.logoBg}>
          <HandstandFigure size={160} />
        </View>
      </Animated.View>

      <Text style={sp.appName}>HandstandHub</Text>
      <Text style={[T.label, { color: C.textMuted, marginTop: S.xs, letterSpacing: 2 }]}>YOUR HANDSTAND COACH</Text>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, zIndex: 999 },
  logoBg:    { alignItems: 'center', justifyContent: 'center' },
  glowRing:  { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: C.accent + '55', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  appName:   { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginTop: 28 },
  circle1:   { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: C.accent + '06', top: -80, right: -80 },
  circle2:   { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent + '04', bottom: -40, left: -60 },
});

// ─────────────────────────────────────────────────────────────────────────────
// STREAK MILESTONE CELEBRATION OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
// Sparkle particles that explode outward from center — used in both celebrations.
function SparkleBurst({ count = 14, duration = 1100, radius = 140, size = 6, color = '#D7FF3D' }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.4,
      dist: radius * (0.6 + Math.random() * 0.5),
      delay: Math.random() * 120,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      40,
      particles.map(p =>
        Animated.timing(p.anim, { toValue: 1, duration, delay: p.delay, useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, idx) => {
        const tx = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.dist] });
        const ty = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.dist] });
        const op = p.anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
        const sc = p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1, 0.6] });
        return (
          <Animated.View
            key={idx}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
              borderRadius: size / 2, backgroundColor: color,
              opacity: op,
              transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
            }}
          />
        );
      })}
    </View>
  );
}

function StreakMilestoneCelebration({ celebration, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flameAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (celebration) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      // Punchier haptic pattern
      Vibration.vibrate([0, 40, 40, 40, 40, 120, 60, 200]);
      // Pulsing flame
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, { toValue: 1.2, duration: 450, useNativeDriver: true }),
          Animated.timing(flameAnim, { toValue: 1,   duration: 450, useNativeDriver: true }),
        ])
      ).start();
      // Breathing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.85, duration: 700, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4,  duration: 700, useNativeDriver: true }),
        ])
      ).start();
      const t = setTimeout(onDismiss, 3600);
      return () => clearTimeout(t);
    } else {
      scaleAnim.setValue(0); opacityAnim.setValue(0);
    }
  }, [celebration]);

  if (!celebration) return null;
  return (
    <Animated.View style={[smc.overlay, { opacity: opacityAnim }]} pointerEvents="box-none">
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
      <Animated.View style={[smc.card, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[smc.glow, { opacity: glowAnim }]} />
        <SparkleBurst count={18} radius={170} size={7} color="#D7FF3D" />
        <SparkleBurst count={10} radius={110} size={5} color="#FFD700" />
        <Animated.View style={[smc.flameEmoji, { transform: [{ scale: flameAnim }] }]}>
          <FlameIcon size={56} active />
        </Animated.View>
        <Text style={smc.label}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={smc.title}>{celebration.streak}-Day Streak!</Text>
        <View style={smc.xpPill}>
          <Text style={smc.xpText}>+{celebration.xp} XP</Text>
        </View>
        <Text style={smc.sub}>You're absolutely on fire. Keep going!</Text>
        <Text style={smc.tap}>Tap to dismiss</Text>
      </Animated.View>
    </Animated.View>
  );
}

// Small daily streak-increment pop — fires every day the user extends their streak.
function StreakDayPop({ pop, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flameAnim = useRef(new Animated.Value(0.8)).current;
  const liftAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (pop) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 140, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(liftAnim, { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
        Animated.spring(flameAnim, { toValue: 1.15, tension: 120, friction: 4, useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(flameAnim, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }).start();
      });
      Vibration.vibrate([0, 30, 40, 60]);
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
          Animated.timing(liftAnim,    { toValue: -20, duration: 240, useNativeDriver: true }),
        ]).start(onDismiss);
      }, 1700);
      return () => clearTimeout(t);
    } else {
      scaleAnim.setValue(0); opacityAnim.setValue(0); liftAnim.setValue(30);
    }
  }, [pop]);

  if (!pop) return null;
  return (
    <Animated.View style={[sdp.overlay, { opacity: opacityAnim }]} pointerEvents="box-none">
      <Animated.View style={[sdp.card, { transform: [{ scale: scaleAnim }, { translateY: liftAnim }] }]}>
        <SparkleBurst count={12} radius={120} size={5} color="#D7FF3D" />
        <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
          <FlameIcon size={42} active />
        </Animated.View>
        <Text style={sdp.dayNum}>Day {pop.streak}</Text>
        <Text style={sdp.label}>STREAK EXTENDED 🔥</Text>
      </Animated.View>
    </Animated.View>
  );
}
const sdp = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-start', paddingTop: height * 0.22, zIndex: 998 },
  card:    { backgroundColor: C.bgCard, borderRadius: R.xxl, paddingHorizontal: 28, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: '#D7FF3D66', shadowColor: '#D7FF3D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 24, minWidth: 180 },
  dayNum:  { fontSize: 28, fontWeight: '900', color: C.text, marginTop: 6, letterSpacing: -0.5 },
  label:   { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#D7FF3D', marginTop: 2 },
});
const smc = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 999 },
  card:       { width: width * 0.82, backgroundColor: C.bgCard, borderRadius: R.xxl, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.accent + '55', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 32 },
  glow:       { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent + '18', top: -20 },
  flameEmoji: { marginBottom: 12, alignItems: 'center' },
  label:      { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: C.accent, marginBottom: 4 },
  title:      { fontSize: 30, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 12 },
  xpPill:     { backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 6, borderRadius: R.full, marginBottom: 12 },
  xpText:     { fontSize: 16, fontWeight: '900', color: C.black },
  sub:        { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  tap:        { fontSize: 11, color: C.textMuted, marginTop: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// STREAK DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function StreakDetailModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { progress } = useContext(UserProgressContext);
  const { computeForgivingStreak } = useContext(MilestoneContext);
  const { streak: currentStreak, frozen } = computeForgivingStreak(progress);
  const longestStreak     = progress.longestStreak ?? currentStreak;
  const freezeAvailable   = progress.freezeDaysAvailable ?? 1;
  const freezeUsedDates   = progress.freezeUsedDates ?? [];

  const flameAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(flameAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  // Build 30-day calendar grid
  const calendarDays = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const trainedSet = new Set(
      (progress.submissions || []).map(s => {
        const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d.getTime();
      })
    );
    const freezeSet = new Set(freezeUsedDates.map(ds => new Date(ds).getTime()));
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const t = d.getTime();
      const isToday    = i === 0;
      const trained    = trainedSet.has(t);
      const usedFreeze = freezeSet.has(t);
      days.push({ date: d, isToday, trained, usedFreeze });
    }
    return days;
  })();

  // Flame color tier
  const flameEmoji = currentStreak >= 30 ? '💎🔥' : currentStreak >= 7 ? '🔥' : '🕯️';
  const flameColor = currentStreak >= 30 ? '#FF8C00' : currentStreak >= 7 ? C.accentOrange : C.textMuted;

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.bg, '#0D0D0F']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={[sdm.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[T.label, { color: C.accent }]}>STREAK STATS</Text>
          <TouchableOpacity onPress={onClose} style={sdm.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={C.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* Big flame */}
          <View style={sdm.flameWrap}>
            <View style={[sdm.flameGlow, { backgroundColor: flameColor + '22' }]} />
            <Animated.View style={[sdm.flameIcon, { transform: [{ scale: flameAnim }] }]}>
              <FlameIcon size={64} active={currentStreak > 0} />
            </Animated.View>
            <Text style={[T.num, { fontSize: 72, color: currentStreak >= 30 ? '#FF8C00' : C.accent }]}>
              {currentStreak}
            </Text>
            <Text style={[T.label, { color: C.textMuted, marginTop: -4 }]}>DAY STREAK</Text>
            {frozen && (
              <View style={sdm.frozenPill}>
                <IceFlakeIcon size={13} />
                <Text style={[T.small, { color: '#60C8FF', fontWeight: '700' }]}>Freeze day active</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={sdm.statsRow}>
            <View style={sdm.statBox}>
              <Text style={sdm.statVal}>{longestStreak}</Text>
              <Text style={sdm.statLbl}>All-time best</Text>
            </View>
            <View style={sdm.statDivider} />
            <View style={sdm.statBox}>
              <Text style={[sdm.statVal, { color: freezeAvailable > 0 ? '#60C8FF' : C.textMuted }]}>
                {freezeAvailable > 0 ? '1' : '0'}
              </Text>
              <Text style={sdm.statLbl}>Freeze day{'\n'}available</Text>
            </View>
            <View style={sdm.statDivider} />
            <View style={sdm.statBox}>
              <Text style={sdm.statVal}>{progress.submissions?.length ?? 0}</Text>
              <Text style={sdm.statLbl}>Total{'\n'}sessions</Text>
            </View>
          </View>

          {/* 30-day calendar */}
          <View style={sdm.calSection}>
            <Text style={[T.h4, { marginBottom: S.sm }]}>Last 30 Days</Text>
            <View style={sdm.calGrid}>
              {calendarDays.map((day, i) => {
                let bg   = C.bgCardAlt;
                let icon = null;
                if (day.trained)    { bg = C.success + 'AA'; icon = '✓'; }
                if (day.usedFreeze) { bg = '#60C8FF44';       icon = '❄'; }
                if (day.isToday && !day.trained) { bg = 'transparent'; }
                return (
                  <View key={i} style={[sdm.calDay, { backgroundColor: bg, borderColor: day.isToday ? C.accent : 'transparent', borderWidth: day.isToday ? 1.5 : 0 }]}>
                    {icon ? (
                      <Text style={{ fontSize: day.usedFreeze ? 11 : 10, color: day.trained ? C.black : '#60C8FF' }}>{icon}</Text>
                    ) : (
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: day.isToday ? C.accent : C.border }} />
                    )}
                  </View>
                );
              })}
            </View>
            {/* Legend */}
            <View style={sdm.legend}>
              {[
                { color: C.success + 'AA', label: 'Trained' },
                { color: '#60C8FF44',       label: 'Freeze used' },
                { color: C.bgCardAlt,       label: 'Rest day' },
              ].map(l => (
                <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color, borderWidth: 1, borderColor: C.border }} />
                  <Text style={[T.cap, { color: C.textMuted }]}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestone progress */}
          <View style={sdm.milestoneSection}>
            <Text style={[T.h4, { marginBottom: S.sm }]}>Next milestone</Text>
            {(() => {
              const next = [7, 14, 30, 60, 100, 365].find(m => m > currentStreak);
              if (!next) return <Text style={[T.small, { color: C.accent }]}>You've reached the top. Legendary! 👑</Text>;
              const pct = currentStreak / next;
              return (
                <View style={sdm.mileRow}>
                  <Text style={sdm.mileEmoji}>{next >= 100 ? '👑' : next >= 30 ? '💎' : '🔥'}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[T.small, { color: C.text, fontWeight: '700' }]}>{next}-Day Streak</Text>
                      <Text style={[T.cap, { color: C.accent }]}>{currentStreak}/{next}</Text>
                    </View>
                    <View style={sdm.mileBarBg}>
                      <View style={[sdm.mileBarFill, { width: `${Math.min(pct * 100, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const sdm = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingBottom: S.sm },
  closeBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },
  flameWrap:       { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
  flameGlow:       { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: 0 },
  flameIcon:       { marginBottom: 4, alignItems: 'center' },
  frozenPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1A2E3A', borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8, borderWidth: 1, borderColor: '#60C8FF44' },
  statsRow:        { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, marginBottom: S.md, overflow: 'hidden' },
  statBox:         { flex: 1, alignItems: 'center', paddingVertical: S.lg },
  statDivider:     { width: 1, backgroundColor: C.border, marginVertical: S.sm },
  statVal:         { fontSize: 28, fontWeight: '900', color: C.accent, letterSpacing: -1 },
  statLbl:         { fontSize: 10, fontWeight: '600', color: C.textMuted, textAlign: 'center', marginTop: 2, lineHeight: 14 },
  calSection:      { backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border, marginBottom: S.md },
  calGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  calDay:          { width: (width - S.md * 2 - S.md * 2 - 5 * 6) / 7, height: (width - S.md * 2 - S.md * 2 - 5 * 6) / 7, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  legend:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  milestoneSection:{ backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border },
  mileRow:         { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  mileEmoji:       { fontSize: 28 },
  mileBarBg:       { height: 6, backgroundColor: C.bgCardAlt, borderRadius: 3, overflow: 'hidden' },
  mileBarFill:     { height: 6, backgroundColor: C.accent, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Home (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
function NotificationPanel({ visible, onClose, inbox }) {
  const insets = useSafeAreaInsets();
  const slide    = useRef(new Animated.Value(-500)).current;
  const fade     = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.92)).current;
  const rowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset every animated value so the full entrance plays on every open,
      // not only the first mount.
      slide.setValue(-500);
      scale.setValue(0.92);
      fade.setValue(0);
      rowAnim.setValue(0);
      Animated.parallel([
        // Bouncy drop-down with overshoot
        Animated.spring(slide, { toValue: 0, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      // Staggered row entrance fires right after the panel settles
      Animated.timing(rowAnim, { toValue: 1, duration: 500, delay: 120, useNativeDriver: true }).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: -500, duration: 240, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 240, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 0,    duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const relTime = (iso) => {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const iconFor = (type) => {
    if (type === 'streak')    return { name: 'flame',              color: C.accentOrange };
    if (type === 'milestone') return { name: 'trophy',             color: C.accent };
    if (type === 'badge')     return { name: 'ribbon',             color: C.accent };
    return { name: 'notifications', color: C.textSub };
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[np.backdrop, { opacity: fade }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[np.panel, {
        paddingTop: insets.top + 10,
        opacity: fade,
        transform: [{ translateY: slide }, { scale }],
      }]}>
        <View style={np.header}>
          <Text style={np.title}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={np.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
        {inbox.length === 0 ? (
          <View style={np.empty}>
            <Ionicons name="notifications-off-outline" size={28} color={C.textMuted} />
            <Text style={np.emptyText}>You're all caught up</Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: height * 0.42 }} contentContainerStyle={{ paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
            {inbox.map((n, idx) => {
              const ic = iconFor(n.type);
              const step = 1 / Math.max(inbox.length, 1);
              const start = Math.min(idx * step * 0.7, 0.7);
              const end   = Math.min(start + step + 0.2, 1);
              const rowTranslate = rowAnim.interpolate({ inputRange: [0, start, end, 1], outputRange: [20, 20, 0, 0] });
              const rowOpacity   = rowAnim.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1] });
              return (
                <Animated.View key={n.id} style={[np.row, { opacity: rowOpacity, transform: [{ translateY: rowTranslate }] }]}>
                  <View style={[np.rowIcon, { backgroundColor: ic.color + '22' }]}>
                    <Ionicons name={ic.name} size={18} color={ic.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={np.rowTitle}>{n.title}</Text>
                    {!!n.body && <Text style={np.rowBody}>{n.body}</Text>}
                    <Text style={np.rowTime}>{relTime(n.date)}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}
const np = StyleSheet.create({
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel:     { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.bgCard, borderBottomLeftRadius: R.xxl, borderBottomRightRadius: R.xxl, paddingHorizontal: S.md, paddingBottom: S.md, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title:     { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  closeBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  empty:     { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  row:       { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border + '66' },
  rowIcon:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowTitle:  { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  rowBody:   { fontSize: 12, color: C.textSub, lineHeight: 17 },
  rowTime:   { fontSize: 10, color: C.textMuted, marginTop: 4, fontWeight: '600' },
});

function HomeScreen({ navigation }) {
  const insets  = useSafeAreaInsets();
  const { progress, getLevelProgress, completeDailyChallenge, addXP, dismissStartHere,
          streakCelebration, dismissStreakCelebration,
          streakDayPop, dismissStreakDayPop, markInboxRead } = useContext(UserProgressContext);
  const [showInbox, setShowInbox] = useState(false);
  const inbox = progress.inbox || [];
  const unreadCount = inbox.filter(n => !n.read).length;
  const { buildWeeklySummary, computeForgivingStreak } = useContext(MilestoneContext);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [dailyExpanded,   setDailyExpanded]   = useState(false);
  const [showExPicker,    setShowExPicker]    = useState(false);
  const [showWeakness,    setShowWeakness]    = useState(false);
  const [showVoiceTimer,  setShowVoiceTimer]  = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [pendingNav,    setPendingNav]    = useState(null);
  const [avatarUri,     setAvatarUri]     = useState(null);
  const [checklist,     setChecklist]     = useState({ firstDrill: false, weakness: false });
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  const level = EXERCISE_LEVELS.find(l => l.id === Math.min(progress.currentLevel, EXERCISE_LEVELS.length)) || EXERCISE_LEVELS[0];
  const daily = getDailyChallenge(progress.currentLevel);
  const weekDays = getWeekDays();
  const { streak: forgivingStreak, frozen } = computeForgivingStreak(progress);

  // Flame appearance: changes at 7-day and 30-day thresholds
  const streakIcon  = frozen ? 'snow-outline' : forgivingStreak >= 7 ? 'flame' : 'flame-outline';
  const streakColor = forgivingStreak >= 30 ? '#FF8C00'
                    : forgivingStreak >= 7  ? C.accentOrange
                    : forgivingStreak > 0   ? C.accent
                    : C.textMuted;

  useFocusEffect(useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    // Check weekly summary on Sundays
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() >= 18) {
      buildWeeklySummary(progress);
    }
    // Load avatar
    AsyncStorage.getItem(AVATAR_KEY).then(uri => { if (uri) setAvatarUri(uri); });
    // Load first-handstand checklist state
    AsyncStorage.multiGet([
      '@handstandai_first_drill_done',
      '@handstandai_weakness_done',
      '@handstandai_checklist_dismissed',
    ]).then(pairs => {
      const map = Object.fromEntries(pairs);
      setChecklist({
        firstDrill: map['@handstandai_first_drill_done'] === 'true',
        weakness:   map['@handstandai_weakness_done']   === 'true',
      });
      setChecklistDismissed(map['@handstandai_checklist_dismissed'] === 'true');
    });
    return () => { fadeAnim.setValue(0); slideAnim.setValue(20); setShowExPicker(false); };
  }, []));

  const handleDaily = async () => {
    const today = new Date().toDateString();
    if (progress.dailyChallengeCompleted && progress.dailyChallengeDate === today) return;
    Vibration.vibrate(30);
    await completeDailyChallenge();
    await addXP(daily.xp);
  };

  const handleExPickerDismiss = () => {
    if (pendingNav) {
      const nav = pendingNav;
      setPendingNav(null);
      navigation.navigate('WristWarmup', nav);
    }
  };

  const initials = progress.userName
    ? progress.userName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  const firstName = progress.userName ? progress.userName.split(' ')[0].toUpperCase() : 'ATHLETE';
  const btnScale  = useRef(new Animated.Value(1)).current;
  // Shimmer loop for the XP bar — tactile polish signal
  const xpShimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(xpShimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(xpShimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [xpShimmer]);

  const pressBtnIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressBtnOut = () => Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  // Weekly bars: 7 items SUN→SAT, today's bar is lime, trained days are dim lit
  const today = new Date().getDay(); // 0=Sun
  const BAR_DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const barData = BAR_DAYS.map((label, i) => {
    const trained = progress.submissions.some(s => new Date(s.date).getDay() === i);
    return { label, isToday: i === today, trained };
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Ambient background layers (behind everything) ── */}
      {/* Layer 1: base gradient */}
      <LinearGradient
        colors={['#0A0A0B', '#0F1014', '#0A0A0B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Layer 2: lime glow top-right */}
      <View style={amb.glowTopRight} pointerEvents="none" />
      {/* Layer 3: lime glow bottom-left */}
      <View style={amb.glowBottomLeft} pointerEvents="none" />
      {/* Layer 4: grain overlay */}
      <View style={amb.grain} pointerEvents="none" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. HEADER ROW ── */}
        <Animated.View style={[hd.header, { paddingTop: insets.top + 16, opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={hd.avatarWrap}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
              : (initials ? <Text style={hd.avatarText}>{initials}</Text> : <HandstandFigure size={22} />)
            }
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={hd.welcomeLabel}>WELCOME BACK,</Text>
            <Text style={hd.welcomeName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={hd.notifBtn} onPress={() => { setShowInbox(true); markInboxRead(); }}>
            <Ionicons name="notifications-outline" size={20} color={C.textSub} />
            {unreadCount > 0 && <View style={hd.notifDot} />}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Streak-at-risk banner (loss aversion) ── */}
        {(() => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const trainedToday = (progress.submissions || []).some(s => {
            const d = new Date(s.date); d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          });
          const hour = new Date().getHours();
          const atRisk = forgivingStreak >= 2 && !trainedToday && hour >= 12;
          if (!atRisk) return null;
          return (
            <Animated.View style={[hd.streakRiskBanner, { opacity: fadeAnim }]}>
              {frozen ? <IceFlakeIcon size={26} /> : <FlameIcon size={26} active />}
              <View style={{ flex: 1 }}>
                <Text style={[T.h4, { fontSize: 14, color: C.text, marginBottom: 2 }]}>
                  {frozen
                    ? `Train today or lose your ${forgivingStreak}-day streak`
                    : `Keep your ${forgivingStreak}-day streak alive`}
                </Text>
                <Text style={[T.small, { color: C.textSub, lineHeight: 16 }]}>
                  {frozen ? 'Your rest day is already used this week' : 'One session today keeps the fire going'}
                </Text>
              </View>
              <TouchableOpacity
                style={hd.startBannerBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Levels')}
              >
                <Text style={[T.cap, { color: C.black, fontWeight: '800' }]}>Train now</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })()}

        {/* ── 1.5 FIRST-HANDSTAND CHECKLIST ── */}
        {(() => {
          const submissionCount = progress.submissions?.length || 0;
          const steps = [
            { key: 'quiz',       label: 'Complete onboarding quiz',   done: true,                       onPress: null },
            { key: 'drill',      label: 'Do your first wrist warmup', done: checklist.firstDrill,       onPress: () => navigation.navigate('WristWarmup', { exerciseId: 'wrist_prep_01', levelId: 1 }) },
            { key: 'submission', label: 'Record your first wall hold',done: submissionCount >= 1,       onPress: () => navigation.navigate('Levels') },
            { key: 'weakness',   label: 'Run the Weakness Diagnosis', done: checklist.weakness,         onPress: () => setShowWeakness(true) },
            { key: 'day3',       label: 'Complete 3 training sessions',done: submissionCount >= 3,      onPress: () => navigation.navigate('Levels') },
          ];
          const doneCount = steps.filter(s => s.done).length;
          const allDone = doneCount === steps.length;
          const tooExperienced = submissionCount >= 5;
          if (checklistDismissed || tooExperienced || allDone) return null;
          return (
            <Animated.View style={{ marginHorizontal: S.lg, marginTop: S.md, marginBottom: S.sm, padding: S.md, borderRadius: R.xl, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.accent + '33', opacity: fadeAnim }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ flex: 1, fontSize: 11, letterSpacing: 1.5, fontWeight: '800', color: C.accent }}>FIRST HANDSTAND CHECKLIST</Text>
                <Text style={[T.cap, { color: C.textMuted, fontWeight: '700' }]}>{doneCount}/{steps.length}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    setChecklistDismissed(true);
                    try { await AsyncStorage.setItem('@handstandai_checklist_dismissed', 'true'); } catch (_) {}
                  }}
                  style={{ paddingHorizontal: 6, paddingVertical: 4, marginLeft: 6 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={14} color={C.textMuted} />
                </TouchableOpacity>
              </View>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                <View style={{ height: 4, width: `${(doneCount / steps.length) * 100}%`, backgroundColor: C.accent, borderRadius: 2 }} />
              </View>
              {steps.map(s => (
                <TouchableOpacity
                  key={s.key}
                  onPress={s.done || !s.onPress ? undefined : s.onPress}
                  activeOpacity={s.done || !s.onPress ? 1 : 0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: 1.5, borderColor: s.done ? C.accent : C.border,
                    backgroundColor: s.done ? C.accent : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.done && <Ionicons name="checkmark" size={12} color={C.black} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: s.done ? C.textMuted : C.text, fontWeight: '600', textDecorationLine: s.done ? 'line-through' : 'none' }}>
                    {s.label}
                  </Text>
                  {!s.done && s.onPress && <Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
                </TouchableOpacity>
              ))}
            </Animated.View>
          );
        })()}

        {/* ── 2. STATS ROW ── */}
        <Animated.View style={[hd.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Streak card — tappable, dynamic flame color */}
          <TouchableOpacity style={hd.statCard} onPress={() => setShowStreakModal(true)} activeOpacity={0.75}>
            <Ionicons name={streakIcon} size={24} color={streakColor} />
            <Text style={[hd.statNum, { color: streakColor }]}>{forgivingStreak}</Text>
            <Text style={hd.statLabel}>DAY STREAK</Text>
            {frozen && <Text style={{ fontSize: 9, color: '#60C8FF', marginTop: 1 }}>❄ freeze</Text>}
          </TouchableOpacity>
          {[
            { icon: 'flash-outline', val: progress.xp, label: 'TOTAL XP' },
            { icon: 'trophy-outline', val: progress.currentLevel, label: 'LEVEL' },
          ].map(s => (
            <View key={s.label} style={hd.statCard}>
              <Ionicons name={s.icon} size={24} color={C.accent} />
              <Text style={hd.statNum}>{s.val}</Text>
              <Text style={hd.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── 3. WEEKLY ACTIVITY CARD ── */}
        <Animated.View style={[hd.card, { marginTop: 24, opacity: fadeAnim }]}>
          {(() => {
            const trainedCount = barData.filter(d => d.trained).length;
            const remaining = Math.max(0, 7 - trainedCount);
            let kicker;
            if (trainedCount === 0)      kicker = "Let's start this week strong";
            else if (trainedCount >= 7)  kicker = 'Week complete — incredible';
            else if (remaining === 1)    kicker = 'One more day to hit your weekly goal';
            else                          kicker = `${remaining} more days to hit your weekly goal`;
            return (
              <>
                <View style={hd.cardHeaderRow}>
                  <Text style={hd.cardLabel}>THIS WEEK</Text>
                  <Text style={[hd.cardLabel, { color: C.accent }]}>{trainedCount}/7 DAYS</Text>
                </View>
                <Text style={[T.h4, { fontSize: 15, color: C.text, marginTop: 6, marginBottom: 12, lineHeight: 20 }]}>
                  {kicker}
                </Text>
              </>
            );
          })()}
          <View style={hd.barsRow}>
            {barData.map((d, i) => (
              <View key={i} style={hd.barCol}>
                <View style={hd.barTrack}>
                  <View style={[
                    hd.barFill,
                    d.isToday  && { backgroundColor: C.accent, height: '75%' },
                    d.trained && !d.isToday && { backgroundColor: C.borderLight, height: '50%' },
                    !d.trained && !d.isToday && { height: '20%' },
                  ]} />
                </View>
                <Text style={[hd.barLabel, d.isToday && { color: C.white }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── 4. CURRENT LEVEL CARD ── */}
        <Animated.View style={[hd.card, { marginTop: 16, opacity: fadeAnim }]}>
          <Text style={hd.cardLabel}>CURRENT LEVEL</Text>
          <Text style={hd.levelName}>{level.name.toUpperCase()}</Text>
          <Text style={[T.small, { color: C.textMuted, marginBottom: 12, marginTop: 2 }]}>{level.subtitle}</Text>
          <View style={hd.progressTrack}>
            <View style={[hd.progressFill, { width: `${Math.round(getLevelProgress() * 100)}%` }]}>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: 60,
                  transform: [{ translateX: xpShimmer.interpolate({ inputRange: [0, 1], outputRange: [-60, 260] }) }],
                }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </View>
          </View>
          <Text style={[hd.cardLabel, { marginTop: 8, letterSpacing: 0.5 }]}>
            {progress.xp} / {XP_PER_LEVEL} XP TO NEXT LEVEL
          </Text>
        </Animated.View>

        {/* Hands-Free Timer card disabled for Expo Go */}
        {false && (
        <Animated.View style={[{ marginTop: 12, marginHorizontal: 20 }, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={vt.entryCard}
            onPress={() => setShowVoiceTimer(true)}
            activeOpacity={0.85}
          >
            <View style={vt.entryIcon}>
              <Ionicons name="mic" size={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.h4, { fontSize: 14, color: C.accent }]}>Hands-Free Timer</Text>
              <Text style={[T.small, { color: C.textSub, marginTop: 2, lineHeight: 17 }]}>
                Say 'start' and 'stop' — no touching your phone
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.accent} />
          </TouchableOpacity>
        </Animated.View>
        )}

        {/* ── Find Your Weakness card ── */}
        <Animated.View style={[{ marginTop: 8, marginHorizontal: 20 }, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={wd.weaknessEntryCard}
            onPress={() => setShowWeakness(true)}
            activeOpacity={0.85}
          >
            <View style={wd.weaknessEntryIcon}>
              <Text style={{ fontSize: 20 }}>🎯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.h4, { fontSize: 14, color: C.accent }]}>Find Your Weakness</Text>
              <Text style={[T.small, { color: C.textSub, marginTop: 2, lineHeight: 17 }]}>
                60-second quiz → 3 drills picked just for you
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Daily challenge ── */}
        <Animated.View style={[hd.card, { marginTop: 24, opacity: fadeAnim }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={hd.cardLabel}>DAILY CHALLENGE</Text>
            <Text style={[hd.cardLabel, { color: C.accent }]}>+{daily.xp} XP</Text>
          </View>

          <TouchableOpacity onPress={() => setDailyExpanded(e => !e)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28 }}>{daily.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[T.h4, { fontSize: 15 }]}>{daily.exercise.name}</Text>
                <Text style={T.small}>{daily.exercise.sets}</Text>
              </View>
              <Ionicons name={dailyExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
            </View>
          </TouchableOpacity>

          {dailyExpanded && (
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={[T.body, { marginBottom: 10 }]}>{daily.exercise.instructions}</Text>
              {daily.exercise.tip && (
                <View style={hd.tipRow}>
                  <Text style={{ fontSize: 13 }}>💡</Text>
                  <Text style={[T.small, { flex: 1, color: C.text }]}>{daily.exercise.tip}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ marginTop: 16 }}>
            {progress.dailyChallengeCompleted ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={C.success} />
                <Text style={[T.small, { color: C.success, fontWeight: '700' }]}>Completed today!</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleDaily} style={hd.dailyCompleteBtn} activeOpacity={0.85}>
                <Ionicons name="checkmark" size={15} color={C.black} />
                <Text style={[T.cap, { color: C.black, fontWeight: '900', fontSize: 12 }]}>MARK COMPLETE · +{daily.xp} XP</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Recent activity ── */}
        {progress.submissions.length > 0 && (
          <Animated.View style={[hd.card, { marginTop: 16, opacity: fadeAnim }]}>
            <Text style={[hd.cardLabel, { marginBottom: 14 }]}>RECENT ACTIVITY</Text>
            {progress.submissions.slice(0, 3).map((sub, i) => (
              <View key={sub.id || i} style={hd.actRow}>
                <View style={[hd.actDot, sub.aiDetected === true && { backgroundColor: C.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.small, { color: C.text, fontWeight: '600' }]}>Level {sub.levelId} Practice</Text>
                  <Text style={T.cap}>{new Date(sub.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[T.cap, { color: sub.aiDetected === true ? C.accent : C.textMuted }]}>
                  {sub.aiDetected === true ? 'Verified' : 'Pending'}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

      </ScrollView>

      {/* ── Exercise Picker Modal ── */}
      <Modal
        visible={showExPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExPicker(false)}
        onDismiss={handleExPickerDismiss}
        statusBarTranslucent
      >
        <TouchableOpacity style={ho.sheetBackdrop} activeOpacity={1} onPress={() => setShowExPicker(false)} />
        <View style={[ho.sheet, { paddingBottom: insets.bottom + S.md }]}>
          <View style={ho.sheetHandle} />
          <Text style={[T.label, { color: C.textMuted, marginBottom: S.xs }]}>CHOOSE AN EXERCISE TO RECORD</Text>
          <Text style={[T.h4, { marginBottom: S.md }]}>{level.icon} Level {level.id} – {level.name}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {level.exercises.map(ex => (
              <TouchableOpacity
                key={ex.id}
                style={ho.sheetRow}
                activeOpacity={0.8}
                onPress={() => {
                  setPendingNav({
                    levelId:        progress.currentLevel,
                    exerciseName:   ex.name,
                    exerciseEmoji:  ex.emoji,
                    recordDuration: ex.recordDuration || 15,
                  });
                  setShowExPicker(false);
                }}
              >
                <View style={[ho.sheetEmoji, { backgroundColor: C.bgCardElevated }]}>
                  <Text style={{ fontSize: 20 }}>{ex.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h4, { fontSize: 13 }]}>{ex.name}</Text>
                  <Text style={T.cap}>{ex.sets}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {ex.videoId ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${ex.videoId}`)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                    </TouchableOpacity>
                  ) : null}
                  <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Weakness Diagnosis Modal ── */}
      {/* <VoiceTimerScreen visible={showVoiceTimer} onClose={() => setShowVoiceTimer(false)} /> disabled for Expo Go */}
      <WeaknessDiagnosisModal visible={showWeakness} onClose={() => setShowWeakness(false)} />

      {/* ── Streak detail + celebration ── */}
      <StreakDetailModal visible={showStreakModal} onClose={() => setShowStreakModal(false)} />
      <StreakMilestoneCelebration celebration={streakCelebration} onDismiss={dismissStreakCelebration} />
      <StreakDayPop pop={streakDayPop} onDismiss={dismissStreakDayPop} />
      <NotificationPanel visible={showInbox} onClose={() => setShowInbox(false)} inbox={inbox} />
    </View>
  );
}

const amb = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(215,255,61,0.08)',
    shadowColor: '#D7FF3D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 80,
    elevation: 0,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 200,
    left: -150,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(215,255,61,0.04)',
    shadowColor: '#D7FF3D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 80,
    elevation: 0,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'transparent',
  },
});

const hd = StyleSheet.create({
  // header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  avatarWrap:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 15, fontWeight: '900', color: C.black },
  welcomeLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: C.textMuted },
  welcomeName:   { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  notifBtn:      { width: 40, height: 40, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },
  notifDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, position: 'absolute', top: 8, right: 8 },
  // stats row
  statsRow:      { flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 20 },
  statCard:      { flex: 1, backgroundColor: C.bgCard, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'flex-start', gap: 4 },
  statNum:       { fontSize: 22, fontWeight: '900', color: C.white, marginTop: 4 },
  statLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: C.textMuted },
  // shared card
  card:          { marginHorizontal: 20, backgroundColor: C.bgCard, borderRadius: R.xl, padding: 20, borderWidth: 1, borderColor: C.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: C.textMuted },
  // weekly bars
  barsRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 },
  barCol:        { flex: 1, alignItems: 'center', gap: 6 },
  barTrack:      { width: '100%', height: 56, backgroundColor: C.bgCardElevated, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:       { width: '100%', backgroundColor: C.border, borderRadius: 6 },
  barLabel:      { fontSize: 10, fontWeight: '600', color: C.textMuted, letterSpacing: 0.5 },
  // level card
  levelName:     { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5, marginTop: 4 },
  progressTrack: { width: '100%', height: 6, backgroundColor: C.bgCardElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, backgroundColor: C.accent, borderRadius: 3 },
  // CTA button
  ctaBtn:        { height: 60, borderRadius: R.full, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, justifyContent: 'space-between' },
  ctaText:       { fontSize: 15, fontWeight: '900', color: C.black, letterSpacing: 1, textTransform: 'uppercase' },
  ctaArrow:      { width: 40, height: 40, borderRadius: 20, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
  // start banner
  startBanner:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.accent + '44', gap: S.sm },
  startBannerBtn:{ backgroundColor: C.accent, borderRadius: R.full, paddingHorizontal: 14, paddingVertical: 7 },
  streakRiskBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, backgroundColor: '#2A1810', borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: '#FF8C00' + '55', gap: S.sm },
  // daily
  tipRow:        { flexDirection: 'row', gap: 8, backgroundColor: C.bgCardElevated, borderRadius: R.md, padding: 10 },
  dailyCompleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: R.full, paddingVertical: 13 },
  // activity
  actRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  actDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
});

const homeHero = StyleSheet.create({
  heroWrap: {
    width: '100%',
    height: height * 0.55,
    backgroundColor: C.black,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: height * 0.55,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.55 * 0.5,
  },
  heroContent: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
  },
  heroKicker: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: C.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
    maxWidth: 280,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  heroBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  heroBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});

const ho = StyleSheet.create({
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingBottom: S.sm },
  notifBtn:       { width: 38, height: 38, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, position: 'absolute', top: 7, right: 7, borderWidth: 1.5, borderColor: C.bg },
  avatarCircle:   { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 15, fontWeight: '800', color: C.white },
  // week strip
  weekRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.md, paddingVertical: S.sm, marginTop: 32 },
  dayCol:         { alignItems: 'center', gap: 4 },
  dayCircle:      { width: 30, height: 30, borderRadius: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive:{ backgroundColor: C.accent, borderColor: C.accent },
  dayCircleTrained:{ borderColor: C.accent + '66' },
  dayDot:         { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent },
  // hero card
  heroCard:       { marginHorizontal: S.md, marginTop: 32, borderRadius: R.xxl, padding: S.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
  heroTop:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroBadge:      { width: 72, height: 72, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center' },
  // stats
  statsRow:       { flexDirection: 'row', gap: S.sm, marginHorizontal: S.md, marginTop: 32 },
  statCard:       { flex: 1, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statIconWrap:   { width: 36, height: 36, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
  // section
  section:        { marginHorizontal: S.md, marginTop: 32 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  goldPill:       { backgroundColor: C.accentDim, paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.full },
  // daily
  dailyCard:      { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dailyBar:       { width: 4, backgroundColor: C.accent },
  dailyTop:       { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, paddingBottom: S.xs },
  chevron:        { width: 28, height: 28, borderRadius: R.full, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  dailyDivider:   { height: 1, backgroundColor: C.border, marginVertical: S.sm },
  tipRow:         { flexDirection: 'row', gap: S.sm, backgroundColor: C.bgCardAlt, borderRadius: R.md, padding: S.sm, marginBottom: S.sm },
  dailyFooter:    { marginTop: S.sm, paddingHorizontal: S.md, paddingBottom: S.md },
  doneRow:        { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  completeBtn:    { borderRadius: R.lg, overflow: 'hidden' },
  completeBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: 10 },
  // primary action
  recordBtn:      { borderRadius: R.xl, overflow: 'hidden', backgroundColor: C.accent },
  recordBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: 18 },
  recordBtnText:  { fontSize: 16, fontWeight: '700', color: C.white, letterSpacing: -0.2 },
  secondaryLink:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: S.md },
  // start here banner
  startHereBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: S.md, marginTop: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.accent + '55', gap: S.sm },
  startHereActions:{ alignItems: 'flex-end', gap: S.xs },
  startHereBtn:    { borderRadius: R.full, overflow: 'hidden' },
  startHereGrad:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: S.sm, paddingVertical: 6 },
  startHereDismiss:{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  // activity
  activityRow:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  actDot:         { width: 8, height: 8, borderRadius: 4 },
  actBadge:       { backgroundColor: C.accentDim, paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.full },
  // bottom sheet
  sheetBackdrop:  { flex: 1, backgroundColor: C.overlay },
  sheet:          { backgroundColor: C.bgCard, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingHorizontal: S.md, paddingTop: S.sm, maxHeight: height * 0.65 },
  sheetHandle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderLight, alignSelf: 'center', marginBottom: S.md },
  sheetRow:       { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetEmoji:     { width: 40, height: 40, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Levels (Movemate exercise list)
// ─────────────────────────────────────────────────────────────────────────────
function LevelsScreen({ navigation }) {
  const insets   = useSafeAreaInsets();
  const { progress } = useContext(UserProgressContext);
  const { canAccessLevel, showPaywall } = useContext(PurchaseContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    return () => fadeAnim.setValue(0);
  }, []));

  const total = EXERCISE_LEVELS.reduce((n, l) => n + l.exercises.length, 0);

  const handleLevelPress = (level, isUnlocked) => {
    if (!isUnlocked) {
      // Progress-locked (not yet reached)
      Alert.alert('Level Locked', `Complete Level ${level.id - 1} to unlock this level.`);
      return;
    }
    if (!canAccessLevel(level.id)) {
      // Pro-locked
      showPaywall('level_lock', `Unlock Level ${level.id} — ${level.name}`);
      return;
    }
    navigation.navigate('LevelDetail', { levelId: level.id });
  };

  return (
    <View style={lv.container}>
      {/* Ambient glow — same as HomeScreen */}
      <LinearGradient colors={['#0A0A0B', '#0F1014', '#0A0A0B']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={[amb.glowTopRight, { top: -80, right: -80, width: 300, height: 300, borderRadius: 150 }]} pointerEvents="none" />

      <Animated.View style={[lv.header, { paddingTop: insets.top + 20, opacity: fadeAnim }]}>
        <View style={{ flex: 1 }}>
          <Text style={lv.title}>LEVELS</Text>
          <Text style={lv.subtitle}>YOUR HANDSTAND JOURNEY</Text>
        </View>
        <View style={lv.totalPill}>
          <Ionicons name="barbell-outline" size={12} color={C.accent} />
          <Text style={lv.totalPillText}>{total} EXERCISES</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {EXERCISE_LEVELS.map((level, index) => {
          const progressUnlocked = level.id === 1
            || progress.completedLevels.includes(level.id - 1)
            || progress.currentLevel >= level.id;
          const proLocked  = !canAccessLevel(level.id);
          const isCurrent  = progress.currentLevel === level.id;
          return (
            <LevelCard
              key={level.id}
              level={level}
              index={index}
              isUnlocked={progressUnlocked && !proLocked}
              isCurrent={isCurrent}
              proLocked={proLocked}
              onPress={() => handleLevelPress(level, progressUnlocked)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const lv = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title:        { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  subtitle:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: C.textMuted, marginTop: 4 },
  totalPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bgCard, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.full, borderWidth: 1, borderColor: C.accent + '44' },
  totalPillText:{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: C.accent },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Level Detail
// ─────────────────────────────────────────────────────────────────────────────
function LevelDetailScreen({ route, navigation }) {
  const { levelId } = route.params;
  const insets   = useSafeAreaInsets();
  const level    = EXERCISE_LEVELS.find(l => l.id === levelId);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!level) return null;

  return (
    <View style={[ld.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* HERO — full-width gradient placeholder, swap in real photo later */}
        <View style={levelHero.heroWrap}>
          <LinearGradient
            colors={['#1F1F1F', '#0A0A0A']}
            style={[levelHero.heroBg, { paddingTop: insets.top }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative orange glow */}
            <View style={levelHero.glowCircle} />

            {/* Level emoji as placeholder until real photos */}
            <Text style={levelHero.heroEmoji}>{level.icon}</Text>

            {/* Bottom gradient overlay so text is readable */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.95)']}
              style={levelHero.heroOverlay}
            />

            {/* Back button */}
            <TouchableOpacity
              style={[levelHero.backBtn, { top: insets.top + 10 }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color={C.white} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Title + info pills overlaid at the bottom of the hero */}
          <View style={levelHero.heroContent}>
            <Text style={[T.label, { color: C.accent, marginBottom: 6 }]}>LEVEL {level.id} · {level.subtitle}</Text>
            <Text style={levelHero.heroTitle}>{level.name.toUpperCase()}</Text>

            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bgCardElevated, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Ionicons name="barbell-outline" size={14} color={C.accent} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 }}>{level.exercises.length} EXERCISES</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bgCardElevated, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Ionicons name="flash-outline" size={14} color={C.accent} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 }}>+{level.xpReward} XP</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bgCardElevated, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Ionicons name="time-outline" size={14} color={C.accent} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 }}>~{level.exercises.length * 3} MIN</Text>
              </View>
            </View>

            {/* Big CTA button */}
            <TouchableOpacity
              style={levelHero.ctaBtn}
              onPress={() => navigation.navigate('WristWarmup', { levelId })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={G.accent}
                style={levelHero.ctaGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={levelHero.ctaText}>START LEVEL</Text>
                <View style={levelHero.ctaIconCircle}>
                  <Ionicons name="arrow-forward" size={14} color={C.accent} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise list */}
        <View style={{ paddingHorizontal: S.md }}>
          <Text style={[T.label, { marginBottom: S.md }]}>TAP TO EXPAND EACH EXERCISE</Text>
          {level.exercises.map((ex, idx) => (
            <ExerciseCard key={ex.id} exercise={ex} levelColor={level.color} index={idx} />
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <Animated.View style={[ld.cta, { paddingBottom: insets.bottom + S.sm, opacity: fadeAnim }]}>
        <TouchableOpacity
          style={ld.ctaBtn}
          onPress={() => navigation.navigate('WristWarmup', { levelId })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={G.accent} style={ld.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="arrow-forward" size={18} color={C.black} />
            <Text style={[T.h4, { color: C.black, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' }]}>Start Level {level.id}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const levelHero = StyleSheet.create({
  heroWrap:      { width: '100%', backgroundColor: C.bgDeep, marginBottom: S.md },
  heroBg:        { height: 380, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji:     { fontSize: 140, opacity: 0.35 },
  glowCircle:    { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: C.accent, opacity: 0.15, top: 40 },
  heroOverlay:   { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  backBtn:       { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  heroContent:   { position: 'absolute', bottom: 24, left: 20, right: 20 },
  heroTitle:     { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: -0.8, marginBottom: 12 },
  pillRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText:      { color: C.white, fontSize: 12, fontWeight: '700' },
  ctaBtn:        { borderRadius: 999, overflow: 'hidden', shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  ctaGrad:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 6, paddingVertical: 6 },
  ctaText:       { color: C.black, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  ctaIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
});

const ld = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:   { width: 38, height: 38, borderRadius: R.lg, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  iconBubble:{ width: 44, height: 44, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  hero:      { padding: S.lg, alignItems: 'center' },
  heroBadges:{ flexDirection: 'row', gap: S.sm, marginTop: S.md, flexWrap: 'wrap', justifyContent: 'center' },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: S.md, paddingVertical: 6, borderRadius: R.full },
  cta:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: S.md, paddingTop: S.sm, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  ctaBtn:    { borderRadius: R.full, overflow: 'hidden', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  ctaGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Wrist Warm-up
// Shown before every recording session. Users step through each exercise with
// a live timer, then tap "I'm warmed up – Start Recording" to proceed.
// ─────────────────────────────────────────────────────────────────────────────
function WristWarmupScreen({ route, navigation }) {
  const { levelId, exerciseName = null, exerciseEmoji = null, recordDuration = 15 } = route.params || { levelId: 1 };
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);   // index into WRIST_WARMUP
  const [done, setDone] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const current = WRIST_WARMUP[step];
  const isLast  = step === WRIST_WARMUP.length - 1;

  // Fade-in on each step change
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [step]);

  const handleNext = () => {
    Vibration.vibrate(30);
    if (isLast) {
      // Animate the completion check before navigating
      setDone(true);
      Animated.spring(checkAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleStartRecording = () => {
    navigation.replace('VideoSubmission', { levelId, exerciseName, exerciseEmoji, recordDuration });
  };

  const handleSkip = () => {
    navigation.replace('VideoSubmission', { levelId, exerciseName, exerciseEmoji, recordDuration });
  };

  return (
    <View style={[ww.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={ww.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ww.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: S.sm }}>
          <Text style={[T.label, { color: C.accent }]}>WRIST WARM-UP</Text>
          <Text style={[T.h4, { fontSize: 13 }]}>Protect your wrists before training</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={ww.skipBtn}>
          <Text style={[T.cap, { color: C.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress pills */}
      <View style={ww.progressRow}>
        {WRIST_WARMUP.map((_, i) => (
          <View
            key={i}
            style={[
              ww.pill,
              i < step  && { backgroundColor: C.success },
              i === step && !done && { backgroundColor: C.accent },
              done       && { backgroundColor: C.success },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={ww.body} showsVerticalScrollIndicator={false}>
        {!done ? (
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            {/* Step counter */}
            <Text style={ww.stepLabel}>STEP {step + 1} OF {WRIST_WARMUP.length}</Text>

            {/* Emoji icon */}
            <View style={ww.iconCircle}>
              <Text style={{ fontSize: 48 }}>{current.emoji}</Text>
            </View>

            {/* Name + duration */}
            <Text style={[T.h2, { textAlign: 'center', marginTop: S.md }]}>{current.name}</Text>
            <View style={ww.durationPill}>
              <Ionicons name="timer-outline" size={13} color={C.accent} />
              <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>{current.duration}</Text>
            </View>

            {/* Instruction card */}
            <View style={ww.instructionCard}>
              <Text style={[T.body, { lineHeight: 22, textAlign: 'center' }]}>{current.instruction}</Text>
            </View>

            {/* Safety notice on first step */}
            {step === 0 && (
              <View style={ww.safetyBanner}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.accent} />
                <Text style={[T.small, { color: C.textSub, flex: 1, lineHeight: 18 }]}>
                  Wrist injuries are the #1 risk in handstand training. This 3-minute routine can prevent months of recovery time.
                </Text>
              </View>
            )}

            {/* Next / Done button */}
            <TouchableOpacity style={ww.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <LinearGradient colors={G.accent} style={ww.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 15, fontWeight: '900' }]}>
                  {isLast ? 'Finish Warm-up' : `Next: ${WRIST_WARMUP[step + 1].name}`}
                </Text>
                {!isLast && <Ionicons name="arrow-forward" size={16} color={C.black} />}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Completion screen */
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Animated.View style={[ww.checkCircle, { transform: [{ scale: checkAnim }] }]}>
              <Ionicons name="checkmark" size={48} color={C.white} />
            </Animated.View>
            <Text style={[T.h2, { marginTop: S.lg, textAlign: 'center' }]}>Wrists Ready! 💪</Text>
            <Text style={[T.body, { textAlign: 'center', marginTop: S.sm, maxWidth: 300 }]}>
              Your wrists are warmed up and ready for handstand training. Go get it!
            </Text>

            <TouchableOpacity style={[ww.nextBtn, { marginTop: S.lg }]} onPress={handleStartRecording} activeOpacity={0.85}>
              <LinearGradient colors={G.accent} style={ww.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="videocam" size={18} color={C.black} />
                <Text style={[T.h4, { color: C.black, fontSize: 15, fontWeight: '900' }]}>Start Recording</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ww = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:         { width: 38, height: 38, borderRadius: R.lg, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  skipBtn:         { paddingHorizontal: S.sm, paddingVertical: S.xs },
  progressRow:     { flexDirection: 'row', gap: S.xs, paddingHorizontal: S.md, paddingTop: S.sm, paddingBottom: S.xs },
  pill:            { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  body:            { alignItems: 'center', padding: S.lg, paddingBottom: 48 },
  stepLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.textMuted, marginBottom: S.md },
  iconCircle:      { width: 110, height: 110, borderRadius: 55, backgroundColor: C.accentDim, borderWidth: 2, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center' },
  durationPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentDim, paddingHorizontal: S.md, paddingVertical: 5, borderRadius: R.full, marginTop: S.sm },
  instructionCard: { backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, marginTop: S.md, borderWidth: 1, borderColor: C.border, width: '100%' },
  safetyBanner:    { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, backgroundColor: C.accentDim, borderRadius: R.lg, padding: S.md, marginTop: S.md, width: '100%', borderWidth: 1, borderColor: C.accent + '44' },
  nextBtn:         { width: '100%', borderRadius: R.xl, overflow: 'hidden', marginTop: S.lg },
  nextGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
  checkCircle:     { width: 100, height: 100, borderRadius: 50, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginTop: S.xl, shadowColor: C.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Video Submission
// ─────────────────────────────────────────────────────────────────────────────
const RS = { IDLE: 'idle', COUNTDOWN: 'countdown', RECORDING: 'recording', CHECKING: 'checking', DONE: 'done' };

function VideoSubmissionScreen({ route, navigation }) {
  const { levelId, exerciseName = null, exerciseEmoji = null, recordDuration = 15 } = route.params || { levelId: 1 };
  const insets = useSafeAreaInsets();
  const level  = EXERCISE_LEVELS.find(l => l.id === levelId) || EXERCISE_LEVELS[0];
  const { addSubmission } = useContext(UserProgressContext);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission,    requestMicPermission]    = useMicrophonePermissions();

  const [recState,    setRecState]    = useState(RS.IDLE);
  const [preCount,    setPreCount]    = useState(3);
  const [recCount,    setRecCount]    = useState(recordDuration);
  const [videoUri,    setVideoUri]    = useState(null);
  const [facing,      setFacing]      = useState('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraMode,  setCameraMode]  = useState('video');
  const [aiResult,    setAiResult]    = useState(null);
  const [aiError,     setAiError]     = useState(false);
  const [aiQueued,    setAiQueued]    = useState(false);

  const cameraRef    = useRef(null);
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const scanAnim     = useRef(new Animated.Value(0)).current;
  const checkPulse   = useRef(new Animated.Value(1)).current;
  const preRef       = useRef(null);
  const recRef       = useRef(null);
  const scanLoopRef  = useRef(null);
  const pulseLoopRef = useRef(null);
  const isRecordingRef = useRef(false);
  const isMountedRef   = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
    clearInterval(preRef.current);
    clearInterval(recRef.current);
    if (isRecordingRef.current) {
      try { cameraRef.current?.stopRecording(); } catch (_) {}
    }
  }, []);

  const startPulse = () => Animated.loop(Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
    Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
  ])).start();

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const startPreCountdown = () => {
    if (!cameraReady) return;
    Vibration.vibrate(30);
    setRecState(RS.COUNTDOWN);
    setPreCount(3);
    let c = 3;
    preRef.current = setInterval(() => {
      c -= 1;
      if (c <= 0) { clearInterval(preRef.current); startRecording(); }
      else setPreCount(c);
    }, 1000);
  };

  const startRecording = async () => {
    setRecState(RS.RECORDING);
    setRecCount(recordDuration);
    startPulse();
    isRecordingRef.current = true;
    let remaining = recordDuration;
    recRef.current = setInterval(() => {
      remaining -= 1;
      setRecCount(remaining);
      if (remaining <= 0) {
        clearInterval(recRef.current);
        if (isRecordingRef.current) {
          try { cameraRef.current?.stopRecording(); } catch (_) {}
        }
      }
    }, 1000);

    let capturedUri = null;
    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: recordDuration + 1 });
      capturedUri = result?.uri ?? null;
      setVideoUri(capturedUri);
    } catch (err) {
      console.warn('recordAsync error:', err);
    } finally {
      isRecordingRef.current = false;
      clearInterval(recRef.current);
      stopPulse();
      // Switch to picture mode so takePictureAsync works in runAICheck.
      // Give the camera 250 ms to reinitialize before we attempt a capture.
      setCameraMode('picture');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await runAICheck(capturedUri);
  };

  const runAICheck = async (_uri) => {
    if (!isMountedRef.current) return;
    setRecState(RS.CHECKING);
    scanLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    scanLoopRef.current.start();
    pulseLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(checkPulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
      Animated.timing(checkPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));
    pulseLoopRef.current.start();

    try {
      const photo  = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      const base64 = photo.base64;
      if (!base64) throw new Error('No base64');

      // Check connectivity — if offline, queue for later and skip the live call
      const netState = await NetInfo.fetch();
      const online = !!netState.isConnected && !!netState.isInternetReachable;
      if (!online) {
        await enqueueAICheck({ imageBase64: base64, submissionId: Date.now().toString() });
        if (isMountedRef.current) setAiQueued(true);
      } else {
        // 15-second timeout so a hung request doesn't block the UI forever
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await aiCheckFetch(base64, { signal: controller.signal });
          const data = await response.json();
          const rawText = data?.content?.[0]?.text || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          let result;
          try {
            result = JSON.parse(jsonMatch?.[0] || rawText);
          } catch (_) {
            throw new Error('Invalid AI response format');
          }
          if (isMountedRef.current) {
            setAiResult(result);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (err) {
      console.warn('AI check error:', err);
      if (isMountedRef.current) setAiError(true);
    } finally {
      if (scanLoopRef.current)  { scanLoopRef.current.stop();  scanLoopRef.current  = null; }
      if (pulseLoopRef.current) { pulseLoopRef.current.stop(); pulseLoopRef.current = null; }
      if (isMountedRef.current) setRecState(RS.DONE);
    }
  };

  const handleRetry = () => {
    clearInterval(preRef.current);
    clearInterval(recRef.current);
    if (isRecordingRef.current) {
      try { cameraRef.current?.stopRecording(); } catch (_) {}
      isRecordingRef.current = false;
    }
    stopPulse();
    if (scanLoopRef.current)  { scanLoopRef.current.stop();  scanLoopRef.current  = null; }
    if (pulseLoopRef.current) { pulseLoopRef.current.stop(); pulseLoopRef.current = null; }
    setCameraMode('video');
    setRecState(RS.IDLE);
    setPreCount(3);
    setRecCount(recordDuration);
    setVideoUri(null);
    setAiResult(null);
    setAiError(false);
    setAiQueued(false);
  };

  const handleSubmit = async () => {
    Vibration.vibrate(30);
    try {
      const sub = await addSubmission({
        levelId,
        videoUri,
        duration:     recordDuration,
        aiDetected:   aiResult?.detected    ?? null,
        aiType:       aiResult?.type        ?? null,
        aiConfidence: aiResult?.confidence  ?? null,
        formFeedback: aiResult?.formFeedback ?? [],
        starRating:   aiResult?.starRating   ?? null,
        formScore:    aiResult?.formScore    ?? null,
      });
      navigation.navigate('SubmissionReview', {
        levelId,
        videoUri,
        duration:     recordDuration,
        submissionId: sub.id,
        aiVerified:   aiResult?.detected === true,
        aiDetected:   aiResult?.detected  ?? null,
        formFeedback: aiResult?.formFeedback ?? [],
        starRating:   aiResult?.starRating   ?? null,
        formScore:    aiResult?.formScore    ?? null,
      });
    } catch (err) {
      console.warn('Submit error:', err);
    }
  };

  const recColor = recCount > recordDuration * 0.4 ? C.success : recCount > recordDuration * 0.15 ? C.accent : C.error;

  // Permission loading
  if (!cameraPermission || !micPermission) {
    return (
      <View style={vs.permContainer}>
        <HandstandLoader message="Checking permissions…" compact />
      </View>
    );
  }

  // Permission denied
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={[vs.permContainer, { paddingTop: insets.top }]}>
        <View style={vs.permIconWrap}>
          <Ionicons name="videocam-off-outline" size={40} color={C.textMuted} />
        </View>
        <Text style={[T.h2, { textAlign: 'center', marginTop: S.lg, marginBottom: S.sm }]}>Camera Access Required</Text>
        <Text style={[T.body, { textAlign: 'center', marginBottom: S.xl, maxWidth: 300 }]}>
          HandstandHub needs your camera and microphone to record your handstand practice.
        </Text>
        <TouchableOpacity
          style={vs.permBtn}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={G.accent} style={vs.permBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="videocam-outline" size={18} color={C.black} />
            <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Grant Camera Access</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: S.md }} onPress={() => navigation.goBack()}>
          <Text style={[T.small, { color: C.textMuted }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={vs.container}>
      {/* Live camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode={cameraMode}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Top bar */}
      <View style={[vs.topBar, { paddingTop: insets.top + S.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={vs.topBtn}>
          <Ionicons name="close" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={vs.levelPill}>
          <Text style={{ fontSize: 15 }}>{exerciseEmoji || level.icon}</Text>
          <Text style={[T.small, { color: C.white, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
            {exerciseName || `Level ${level.id} – ${level.name}`}
          </Text>
        </View>
        <TouchableOpacity style={vs.topBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={20} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* Countdown overlay */}
      {recState === RS.COUNTDOWN && (
        <View style={vs.centerOverlay}>
          <Text style={vs.bigNum}>{preCount}</Text>
          <Text style={[T.h3, { color: 'rgba(255,255,255,0.9)', marginTop: S.sm }]}>Get into position!</Text>
        </View>
      )}

      {/* Recording overlay */}
      {recState === RS.RECORDING && (
        <View style={vs.recordingOverlay}>
          <View style={vs.recPill}>
            <Animated.View style={[vs.recDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={[T.label, { color: C.white, letterSpacing: 1.5 }]}>REC</Text>
          </View>
          <Animated.Text style={[vs.recCountNum, { color: recColor, transform: [{ scale: pulseAnim }] }]}>
            {recCount}
          </Animated.Text>
          <Text style={[T.body, { color: 'rgba(255,255,255,0.85)' }]}>
            {recCount > 0 ? `Auto-stops in ${recCount}s` : 'Finishing…'}
          </Text>
        </View>
      )}

      {/* AI Checking overlay */}
      {recState === RS.CHECKING && (
        <View style={vs.checkOverlay}>
          <Animated.View style={{ transform: [{ scale: checkPulse }], alignItems: 'center', marginBottom: S.lg }}>
            <View style={vs.checkLogo}>
              <Ionicons name="scan-outline" size={38} color={C.accent} />
            </View>
          </Animated.View>
          <Text style={[T.h3, { color: C.white, textAlign: 'center', marginBottom: S.xs }]}>AI is analyzing your form…</Text>
          <Text style={[T.small, { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: S.xl }]}>
            Checking for handstand position
          </Text>
          <View style={vs.scanBox}>
            <Animated.View style={[vs.scanLine, {
              transform: [{
                translateY: scanAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 110, 0] }),
              }],
            }]} />
          </View>
        </View>
      )}

      {/* Done card */}
      {recState === RS.DONE && (
        <View style={vs.centerOverlay}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
            <View style={vs.doneCard}>
              {/* Video preview */}
              {videoUri ? (
                <Video
                  source={{ uri: videoUri }}
                  style={vs.videoPreview}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay={false}
                  isLooping
                />
              ) : (
                <Text style={{ fontSize: 44, marginBottom: S.sm }}>🎬</Text>
              )}

              <Text style={[T.h3, { marginTop: S.sm, marginBottom: S.xs }]}>{`${recordDuration} Seconds Captured!`}</Text>
              <View style={vs.okRow}>
                <Ionicons name="checkmark-circle" size={13} color={C.success} />
                <Text style={[T.cap, { color: C.success, fontWeight: '700' }]}>Recording complete</Text>
              </View>

              {/* AI passed */}
              {aiResult && aiResult.detected && (
                <View style={vs.aiBox}>
                  <Text style={[T.h4, { color: C.success, fontSize: 14 }]}>✓ Handstand Detected!</Text>
                  <View style={vs.aiTypePill}>
                    <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>
                      {aiResult.type?.replace('_', ' ').toUpperCase()} · {aiResult.confidence} confidence
                    </Text>
                  </View>
                  {/* Star rating */}
                  {aiResult.starRating > 0 && (
                    <View style={{ flexDirection: 'row', gap: 3, marginTop: S.xs }}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name={s <= aiResult.starRating ? 'star' : 'star-outline'} size={16} color={C.accent} />
                      ))}
                      {aiResult.formScore != null && (
                        <Text style={[T.cap, { color: C.accent, fontWeight: '700', marginLeft: S.xs }]}>{aiResult.formScore}% form</Text>
                      )}
                    </View>
                  )}
                  <Text style={[T.cap, { color: C.textSub, marginTop: 4, textAlign: 'center' }]}>{aiResult.message}</Text>
                  <Text style={[T.cap, { color: C.accent, marginTop: 4, fontWeight: '700' }]}>+10 Bonus XP for verified handstand!</Text>
                </View>
              )}

              {/* Form feedback cues (shown when AI detected or not) */}
              {aiResult && Array.isArray(aiResult.formFeedback) && aiResult.formFeedback.length > 0 && (
                <View style={vs.formFeedbackBox}>
                  <Text style={[T.label, { color: C.accent, marginBottom: S.xs }]}>COACHING CUES</Text>
                  {aiResult.formFeedback.map((cue, i) => (
                    <View key={i} style={vs.cueLine}>
                      <View style={[vs.cueDot, { backgroundColor: cue.includes('great') || cue.includes('good') || cue.includes('locked') ? C.success : C.accent }]} />
                      <Text style={[T.small, { flex: 1, lineHeight: 18 }]}>{cue}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* AI failed */}
              {aiResult && !aiResult.detected && (
                <View style={[vs.aiBox, vs.aiBoxFail]}>
                  <Text style={[T.h4, { color: C.error, fontSize: 14 }]}>✗ No handstand detected</Text>
                  <Text style={[T.cap, { color: C.textSub, marginTop: 4, textAlign: 'center' }]}>{aiResult.message}</Text>
                </View>
              )}

              {/* Self-assessment checklist when AI unavailable */}
              {(aiError || aiQueued) && (
                <View style={vs.selfCheckBox}>
                  <Text style={[T.label, { color: C.textMuted, marginBottom: S.sm }]}>SELF-CHECK YOUR FORM</Text>
                  {[
                    { icon: '💪', label: 'Arms fully locked (elbows straight)' },
                    { icon: '🦷', label: 'Hollow body — hips tucked, core tight' },
                    { icon: '👋', label: 'Shoulders stacked directly over wrists' },
                    { icon: '🦵', label: 'Legs together and toes pointed' },
                    { icon: '👀', label: 'Head neutral, looking between arms' },
                  ].map((item, i) => (
                    <View key={i} style={vs.cueLine}>
                      <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                      <Text style={[T.small, { flex: 1, lineHeight: 18 }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* AI error */}
              {aiError && (
                <View style={vs.aiErrorBox}>
                  <Ionicons name="warning-outline" size={14} color={C.accent} />
                  <Text style={[T.cap, { color: C.textSub, textAlign: 'center', lineHeight: 17, flex: 1 }]}>
                    AI check unavailable – submitting without verification
                  </Text>
                </View>
              )}

              {/* AI queued (offline) */}
              {aiQueued && (
                <View style={[vs.aiErrorBox, { borderColor: C.accent + '44', backgroundColor: C.accentDim }]}>
                  <Ionicons name="cloud-offline-outline" size={14} color={C.accent} />
                  <Text style={[T.cap, { color: C.accent, textAlign: 'center', lineHeight: 17, flex: 1 }]}>
                    You're offline — AI check queued. Result will appear when you reconnect.
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={vs.doneActions}>
                <TouchableOpacity style={vs.retryBtn} onPress={handleRetry}>
                  <Ionicons name="refresh" size={14} color={C.textSub} />
                  <Text style={[T.small, { color: C.textSub, fontWeight: '600' }]}>
                    {aiResult && !aiResult.detected ? 'Try Again' : 'Retry'}
                  </Text>
                </TouchableOpacity>
                {aiResult && !aiResult.detected && (
                  <TouchableOpacity style={vs.submitAnywayBtn} onPress={handleSubmit}>
                    <Text style={[T.cap, { color: C.textMuted, fontWeight: '600' }]}>Submit Anyway</Text>
                  </TouchableOpacity>
                )}
                {(!aiResult || aiResult.detected || aiError || aiQueued) && (
                  <TouchableOpacity style={vs.submitBtn} onPress={handleSubmit}>
                    <LinearGradient colors={G.accent} style={vs.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={[T.small, { color: C.black, fontWeight: '900' }]}>
                        {aiResult?.detected ? 'Submit +10 XP' : 'Submit'}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={C.black} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Idle: hint + record button */}
      {recState === RS.IDLE && (
        <>
          <View style={vs.idleHints}>
            <View style={vs.hintPill}>
              <Ionicons name="time-outline" size={12} color={C.accent} />
              <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>{`Auto-stops after ${recordDuration} seconds`}</Text>
            </View>
            <Text style={[T.cap, { color: 'rgba(255,255,255,0.5)', marginTop: S.xs, textAlign: 'center' }]}>
              🤖 AI reviews your form after recording
            </Text>
          </View>
          <View style={[vs.bottomBar, { paddingBottom: insets.bottom + S.lg }]}>
            <TouchableOpacity
              style={[vs.recordBtn, !cameraReady && { opacity: 0.4 }]}
              onPress={startPreCountdown}
              disabled={!cameraReady}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={vs.recordInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="videocam" size={28} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[T.cap, { color: 'rgba(255,255,255,0.7)', marginTop: S.sm }]}>
              {cameraReady ? 'Tap to Record' : 'Camera loading…'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const vs = StyleSheet.create({
  permContainer: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  permIconWrap:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  permBtn:       { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm, width: '100%' },
  permBtnGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md, paddingHorizontal: S.xl },
  container:     { flex: 1, backgroundColor: C.black },
  topBar:        { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md },
  topBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  levelPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: R.xl, paddingVertical: S.sm, paddingHorizontal: S.md, marginHorizontal: S.sm },
  centerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)', padding: S.lg },
  bigNum:        { fontSize: 120, fontWeight: '900', color: C.white, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  recordingOverlay:{ position: 'absolute', top: '28%', left: 0, right: 0, alignItems: 'center' },
  recPill:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: S.md, paddingVertical: 5, borderRadius: R.full, marginBottom: S.sm },
  recDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.error },
  recCountNum:   { fontSize: 100, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  checkOverlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.92)', padding: S.xl },
  checkLogo:     { width: 88, height: 88, borderRadius: 44, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 12 },
  scanBox:       { width: 200, height: 120, backgroundColor: C.accentDim, borderRadius: R.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.accent + '44' },
  scanLine:      { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: C.accent, shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6 },
  doneCard:      { backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.lg, width: '100%', maxWidth: 420, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  videoPreview:  { width: '100%', height: 190, borderRadius: R.xl, backgroundColor: C.black, marginBottom: S.sm },
  okRow:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successDim, paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.full, marginBottom: S.sm },
  aiBox:         { backgroundColor: C.successDim, borderRadius: R.lg, padding: S.md, marginVertical: S.sm, borderWidth: 1, borderColor: C.success + '44', width: '100%', alignItems: 'center', gap: 4 },
  aiBoxFail:     { backgroundColor: C.errorDim, borderColor: C.error + '44' },
  aiTypePill:      { backgroundColor: C.accentDim, paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.full, marginTop: 2 },
  aiErrorBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: S.xs, backgroundColor: C.bgCardAlt, borderRadius: R.md, padding: S.md, marginVertical: S.sm, borderWidth: 1, borderColor: C.border, width: '100%' },
  formFeedbackBox: { backgroundColor: C.bgCardAlt, borderRadius: R.lg, padding: S.md, marginVertical: S.sm, borderWidth: 1, borderColor: C.accent + '33', width: '100%' },
  selfCheckBox:    { backgroundColor: C.bgCardAlt, borderRadius: R.lg, padding: S.md, marginVertical: S.sm, borderWidth: 1, borderColor: C.border, width: '100%' },
  cueLine:         { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.xs },
  cueDot:          { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  doneActions:   { flexDirection: 'row', gap: S.sm, width: '100%', marginTop: S.sm },
  retryBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, backgroundColor: C.bgCardAlt, paddingVertical: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  submitBtn:     { flex: 2, borderRadius: R.lg, overflow: 'hidden' },
  submitGrad:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.md },
  submitAnywayBtn:{ flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCardAlt, paddingVertical: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  idleHints:     { position: 'absolute', top: '18%', left: S.lg, right: S.lg, alignItems: 'center' },
  hintPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: 7 },
  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  recordBtn:     { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  recordInner:   { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Submission Review (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'upload',  label: 'Uploading clip…',       icon: 'cloud-upload-outline',    dur: 1600 },
  { id: 'analyze', label: 'Analyzing your form…',  icon: 'analytics-outline',       dur: 2000 },
  { id: 'measure', label: 'Measuring hold time…',  icon: 'timer-outline',           dur: 1400 },
  { id: 'score',   label: 'Calculating score…',    icon: 'star-outline',            dur: 1100 },
  { id: 'queue',   label: 'Queued for AI review…', icon: 'checkmark-circle-outline',dur: 700  },
];

function SubmissionReviewScreen({ route, navigation }) {
  const { levelId = 1, aiVerified = false,
          formFeedback = [], starRating = null, formScore = null,
          duration = 15,
        } = route.params || {};
  const insets   = useSafeAreaInsets();
  const level    = EXERCISE_LEVELS.find(l => l.id === levelId) || EXERCISE_LEVELS[0];
  const { addXP, progress, completeLevelWithXP } = useContext(UserProgressContext);
  const { showPaywall, isPro, hasActiveEntitlement } = useContext(PurchaseContext);
  const baseXP   = 50;
  const bonusXP  = aiVerified ? 10 : 0;
  // Variable reward — ~30% chance of a surprise XP drop (Skinner box / intermittent reinforcement)
  const surpriseXP = useRef(Math.random() < 0.3 ? (10 + Math.floor(Math.random() * 16)) : 0).current;
  const totalXP  = baseXP + bonusXP + surpriseXP;

  const [stageIdx,      setStageIdx]      = useState(-1);
  const [allDone,       setAllDone]       = useState(false);
  const [levelJustDone, setLevelJustDone] = useState(false);
  const xpRef = useRef(false);

  const alreadyCompleted = progress.completedLevels.includes(levelId);

  // Mastery gate: require either one AI-verified submission for this level,
  // OR at least 3 total attempts (covers users without a backend set up).
  const levelSubmissions  = progress.submissions.filter(s => s.levelId === levelId);
  const hasAiVerified     = levelSubmissions.some(s => s.aiDetected === true);
  const hasEnoughAttempts = levelSubmissions.length >= 3;
  const masteryUnlocked   = hasAiVerified || hasEnoughAttempts;

  const logoScale   = useRef(new Animated.Value(0)).current;
  const doneScale   = useRef(new Animated.Value(0.85)).current;
  const doneOpacity = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef(null);

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    let idx = 0;
    const runNext = () => {
      if (idx >= STAGES.length) {
        setTimeout(() => {
          setAllDone(true);
          if (!xpRef.current) {
            xpRef.current = true;
            addXP(totalXP);
          }
          // Peak-end reward — tactile celebration at the final moment
          Vibration.vibrate(surpriseXP > 0 ? [0, 40, 70, 40, 70, 80] : [0, 35, 60, 35]);
          Animated.parallel([
            Animated.spring(doneScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.timing(doneOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start();
        }, 400);
        return;
      }
      setStageIdx(idx);
      const dur = STAGES[idx].dur;
      idx++;
      setTimeout(runNext, dur);
    };
    setTimeout(runNext, 500);
  }, []);

  const handleGeneralShare = async () => {
    try {
      await Share.share({
        message: `🤸 Just completed my Level ${levelId} (${level.name}) handstand practice with HandstandHub! #handstand #handstandtraining #calisthenics`,
        title: 'HandstandHub Practice',
      });
    } catch (_) {}
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`🤸 Just finished my Level ${levelId} handstand training session! Working towards the perfect handstand 💪 #handstand #calisthenics`);
    Linking.openURL(`whatsapp://send?text=${msg}`).catch(() => Linking.openURL(`https://wa.me/?text=${msg}`));
  };

  const handleInstagram = () => {
    Linking.openURL('instagram://').catch(() => Linking.openURL('https://www.instagram.com'));
  };

  const handleShareStory = async () => {
    try {
      if (!viewShotRef.current || !viewShotRef.current.capture) return;
      const uri = await viewShotRef.current.capture({ format: 'png', quality: 0.95 });
      await Share.share({ url: uri, message: `🤸 Level ${levelId} · ${level.name} — HandstandHub` });
    } catch (_) {}
  };

  return (
    <ScrollView
      style={[sv.container, { paddingTop: insets.top }]}
      contentContainerStyle={[sv.content, { paddingBottom: insets.bottom + S.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[C.bgCardAlt, C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }} />

      {/* Logo */}
      <Animated.View style={[sv.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <View style={sv.logoBg}>
          <Ionicons name="checkmark-circle" size={32} color={C.accent} />
        </View>
        <Text style={[T.h3, { fontWeight: '900', marginTop: S.sm }]}>HandstandHub</Text>
      </Animated.View>

      {/* Level badge */}
      <View style={sv.subInfo}>
        <View style={[sv.levelPill, { backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44' }]}>
          <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Level {levelId} · {level.name}</Text>
        </View>
        <Text style={T.small}>{duration}s practice clip captured</Text>
      </View>

      {/* Processing stages */}
      {!allDone && (
        <View style={sv.stagesBox}>
          <Text style={[T.h4, { marginBottom: S.md }]}>Processing Your Submission</Text>
          {STAGES.map((stage, i) => (
            <StageRow
              key={stage.id}
              stage={stage}
              isActive={stageIdx === i}
              isComplete={stageIdx > i}
              delay={i * 80}
            />
          ))}
          <View style={sv.loadBar}>
            <View style={[sv.loadFill, { width: stageIdx < 0 ? '0%' : `${Math.min(((stageIdx + 1) / STAGES.length) * 100, 100)}%` }]} />
          </View>
        </View>
      )}

      {/* Done section */}
      {allDone && (
        <Animated.View style={[sv.doneWrap, { transform: [{ scale: doneScale }], opacity: doneOpacity }]}>

          {/* XP earned */}
          <View style={sv.xpPill}>
            <Ionicons name="flash" size={20} color={C.black} />
            <Text style={[T.h3, { color: C.black, fontWeight: '900' }]}>+{totalXP} XP earned{aiVerified ? ` (incl. +${bonusXP} AI bonus)` : ''}!</Text>
          </View>

          {/* Surprise bonus — variable reward */}
          {surpriseXP > 0 && (
            <View style={[sv.aiBannerGreen, { backgroundColor: C.accent + '18', borderColor: C.accent + '55' }]}>
              <DiceIcon size={18} />
              <Text style={[T.small, { color: C.accent, fontWeight: '800' }]}>Lucky bonus · +{surpriseXP} surprise XP</Text>
            </View>
          )}

          {/* AI banner */}
          {aiVerified ? (
            <View style={sv.aiBannerGreen}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={[T.small, { color: C.success, fontWeight: '700' }]}>AI Verified Handstand · +{bonusXP} Bonus XP</Text>
            </View>
          ) : (
            <View style={sv.aiBannerGold}>
              <Ionicons name="time-outline" size={16} color={C.textSub} />
              <Text style={[T.small, { color: C.textSub, fontWeight: '600' }]}>Not AI Verified · Submitted for manual review</Text>
            </View>
          )}

          {/* Form feedback coaching card */}
          {Array.isArray(formFeedback) && formFeedback.length > 0 && (
            <View style={sv.formCard}>
              <View style={sv.formCardHeader}>
                <Text style={[T.label, { color: C.accent }]}>COACHING CUES</Text>
                {starRating != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= starRating ? 'star' : 'star-outline'} size={13} color={C.accent} />
                    ))}
                    {formScore != null && (
                      <Text style={[T.cap, { color: C.accent, fontWeight: '700', marginLeft: 4 }]}>{formScore}%</Text>
                    )}
                  </View>
                )}
              </View>
              {formFeedback.map((cue, i) => (
                <View key={i} style={sv.cueRow}>
                  <View style={[sv.cueDot, { backgroundColor: cue.includes('great') || cue.includes('good') || cue.includes('locked') || cue.includes('fully') ? C.success : C.accent }]} />
                  <Text style={[T.small, { flex: 1, lineHeight: 19 }]}>{cue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Info cards */}
          <View style={sv.infoRow}>
            {[
              { icon: 'time-outline',     label: 'Review Time', val: '24–48 hrs'      },
              { icon: 'videocam-outline', label: 'Clip Length', val: `${duration}s`   },
              { icon: 'trophy-outline',   label: 'Level',       val: `#${levelId}`    },
            ].map(item => (
              <View key={item.label} style={sv.infoCard}>
                <Ionicons name={item.icon} size={16} color={C.accent} />
                <Text style={T.cap}>{item.label}</Text>
                <Text style={[T.h4, { fontWeight: '900', fontSize: 13 }]}>{item.val}</Text>
              </View>
            ))}
          </View>

          {/* Share section */}
          <View style={sv.shareSection}>
            <Text style={[T.label, { marginBottom: S.sm }]}>SHARE YOUR PRACTICE</Text>
            <TouchableOpacity
              style={[sv.shareBtn, { backgroundColor: C.accent, borderColor: C.accent, flexDirection: 'row', marginBottom: S.sm, paddingVertical: S.md + 2 }]}
              onPress={handleShareStory}
              activeOpacity={0.85}
            >
              <SparkleIcon size={18} color={C.black} />
              <Text style={[T.h4, { color: C.black, fontSize: 14, marginLeft: 8 }]}>Share as Story (9:16)</Text>
            </TouchableOpacity>
            <View style={sv.shareRow}>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: '#25D366' + '18', borderColor: '#25D366' + '44' }]} onPress={handleWhatsApp} activeOpacity={0.8}>
                <WhatsAppIcon size={22} />
                <Text style={[T.cap, { color: '#25D366', fontWeight: '700' }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: '#E1306C' + '18', borderColor: '#E1306C' + '44' }]} onPress={handleInstagram} activeOpacity={0.8}>
                <InstagramIcon size={22} />
                <Text style={[T.cap, { color: '#E1306C', fontWeight: '700' }]}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]} onPress={handleGeneralShare} activeOpacity={0.8}>
                <ShareIcon size={22} />
                <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Off-screen 9:16 shareable card */}
          <View style={{ position: 'absolute', top: -10000, left: 0, opacity: 1 }} pointerEvents="none">
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
              <View style={{ width: 360, height: 640, backgroundColor: C.bg, padding: 32, justifyContent: 'space-between' }}>
                <LinearGradient colors={[C.accent + '28', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} />
                <View>
                  <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>HANDSTANDHUB</Text>
                  <Text style={{ color: C.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Session Complete</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <HandstandFigure size={96} />
                  <View style={{ backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginTop: 10 }}>
                    <Text style={{ color: C.black, fontWeight: '900', fontSize: 14 }}>LEVEL {levelId} · {level.name.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>HELD</Text>
                    <Text style={{ color: C.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{duration}s</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>XP</Text>
                    <Text style={{ color: C.accent, fontSize: 28, fontWeight: '900', marginTop: 4 }}>+{totalXP}</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>STREAK</Text>
                    <Text style={{ color: C.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>🔥{progress.streak || 0}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>Train with HandstandHub</Text>
                </View>
              </View>
            </ViewShot>
          </View>

          {/* Complete Level button — gated by mastery */}
          {!alreadyCompleted && !levelJustDone && (
            masteryUnlocked ? (
              <TouchableOpacity
                style={sv.completeLevelBtn}
                activeOpacity={0.85}
                onPress={() => {
                  Vibration.vibrate(30);
                  completeLevelWithXP(levelId, level.xpReward);
                  setLevelJustDone(true);
                  // No upgrade prompt — every user in the app has already paid
                  // (or is in trial). Past contextual paywalls are dead code.
                }}
              >
                <LinearGradient colors={G.success} style={sv.completeLevelGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={{ fontSize: 16 }}>{level.icon}</Text>
                  <Text style={[T.h4, { color: C.white, fontSize: 14 }]}>Complete Level {levelId}</Text>
                  <Text style={[T.cap, { color: 'rgba(255,255,255,0.75)' }]}>+{level.xpReward} XP</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={sv.masteryGate}>
                <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.small, { color: C.text, fontWeight: '700', marginBottom: 2 }]}>
                    Complete Level {levelId} — Locked
                  </Text>
                  {hasAiVerified ? null : (
                    <Text style={T.cap}>
                      {hasEnoughAttempts
                        ? 'Record one more session to unlock'
                        : `${levelSubmissions.length}/3 attempts · or get AI-verified to unlock early`}
                    </Text>
                  )}
                </View>
              </View>
            )
          )}
          {levelJustDone && (
            <View style={sv.levelDoneRow}>
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
              <Text style={[T.h4, { color: C.success, fontSize: 14 }]}>Level {levelId} Complete! 🎉</Text>
            </View>
          )}

          {/* Navigation actions */}
          <View style={sv.actions}>
            <TouchableOpacity
              style={sv.againBtn}
              onPress={() => { try { navigation.navigate('VideoSubmission', { levelId }); } catch (e) {} }}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam-outline" size={14} color={C.accent} />
              <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Record Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sv.homeBtn} onPress={() => navigation.navigate('Main')} activeOpacity={0.8}>
              <LinearGradient colors={G.accent} style={sv.homeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="home" size={14} color={C.black} />
                <Text style={[T.small, { color: C.black, fontWeight: '900' }]}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const sv = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg },
  content:          { alignItems: 'center', padding: S.lg },
  logoWrap:         { alignItems: 'center', marginTop: S.lg, marginBottom: S.lg },
  logoBg:           { alignItems: 'center', justifyContent: 'center' },
  subInfo:          { alignItems: 'center', marginBottom: S.xl },
  levelPill:        { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.full, marginBottom: S.sm },
  stagesBox:        { width: '100%', backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.lg, borderWidth: 1, borderColor: C.border },
  loadBar:          { marginTop: S.md, height: 4, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  loadFill:         { height: '100%', backgroundColor: C.accent, borderRadius: R.full },
  doneWrap:         { width: '100%', alignItems: 'center' },
  xpPill:           { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.accent, paddingHorizontal: S.lg, paddingVertical: S.md, borderRadius: R.full, marginBottom: S.md, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  aiBannerGreen:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, width: '100%', borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: S.sm, marginBottom: S.md, backgroundColor: C.successDim, borderWidth: 1, borderColor: C.success + '44' },
  aiBannerGold:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, width: '100%', borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: S.sm, marginBottom: S.md, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  formCard:         { width: '100%', backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.accent + '33' },
  formCardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  cueRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.xs },
  cueDot:           { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  infoRow:          { flexDirection: 'row', gap: S.sm, width: '100%', marginBottom: S.lg },
  infoCard:         { flex: 1, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  shareSection:     { width: '100%', marginBottom: S.lg },
  shareRow:         { flexDirection: 'row', gap: S.sm },
  shareBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: S.md, borderRadius: R.lg, borderWidth: 1 },
  completeLevelBtn: { width: '100%', borderRadius: R.xl, overflow: 'hidden', marginBottom: S.md },
  completeLevelGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md },
  masteryGate:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, width: '100%', backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.border },
  levelDoneRow:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.successDim, borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.sm, marginBottom: S.md, width: '100%', justifyContent: 'center' },
  actions:          { flexDirection: 'row', gap: S.sm, width: '100%' },
  againBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, backgroundColor: C.bgCard, paddingVertical: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.accent + '44' },
  homeBtn:          { flex: 2, borderRadius: R.lg, overflow: 'hidden' },
  homeBtnGrad:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.md },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Profile (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "The body achieves what the mind believes.", author: "Unknown" },
  { text: "Strength doesn't come from what you can do. It comes from overcoming things you once thought you couldn't.", author: "Rikki Rogers" },
  { text: "Every rep is a step closer to who you want to become.", author: "Unknown" },
  { text: "Pain is temporary. Pride is forever.", author: "Unknown" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Champions aren't made in gyms. They are made from something deep inside them.", author: "Muhammad Ali" },
  { text: "The handstand is a metaphor for life: balance comes from relentless practice.", author: "Unknown" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Discipline is doing what needs to be done, even when you don't want to.", author: "Unknown" },
  { text: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
];

function getDailyQuote() {
  const day = new Date().getDate() + new Date().getMonth() * 31;
  return QUOTES[day % QUOTES.length];
}

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { progress, loading, saveUserName, onReset,
          notifSettings, notifPermission, saveNotifSettings, enableNotifications,
          syncStatus,
        } = useContext(UserProgressContext);
  const { authUser, isAuthenticated, signOut, updateDisplayName,
          updatePassword, deleteAccount,
        } = useContext(AuthContext);
  const { isPro, isInTrial, trialDaysRemaining, subscriptionExpiresAt, showPaywall } = useContext(PurchaseContext);

  const [editVisible,      setEditVisible]      = useState(false);
  const [nameInput,        setNameInput]        = useState('');
  const [notifVisible,     setNotifVisible]     = useState(false);
  const [notifHour,        setNotifHour]        = useState(String(DEFAULT_NOTIF_SETTINGS.reminderHour));
  const [notifMinute,      setNotifMinute]      = useState(String(DEFAULT_NOTIF_SETTINGS.reminderMinute).padStart(2, '0'));
  const [pwVisible,        setPwVisible]        = useState(false);
  const [newPw,            setNewPw]            = useState('');
  const [confirmPw,        setConfirmPw]        = useState('');
  const [pwLoading,        setPwLoading]        = useState(false);
  const [pwError,          setPwError]          = useState('');
  const [pwSuccess,        setPwSuccess]        = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUri,       setAvatarUri]       = useState(null);
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(20)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg,   setToastMsg]   = useState('Saved!');

  const quote = getDailyQuote();
  const level = EXERCISE_LEVELS.find(l => l.id === Math.min(progress.currentLevel, EXERCISE_LEVELS.length)) || EXERCISE_LEVELS[0];

  useFocusEffect(useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    // Load saved avatar URI
    AsyncStorage.getItem(AVATAR_KEY).then(uri => { if (uri) setAvatarUri(uri); });
    return () => { fadeAnim.setValue(0); slideAnim.setValue(20); };
  }, []));

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Permission needed to pick a photo');
      return;
    }
    setAvatarUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        await AsyncStorage.setItem(AVATAR_KEY, uri);
        setAvatarUri(uri);
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarLongPress = () => {
    if (!avatarUri) return;
    Alert.alert('Profile Photo', 'Remove your photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove Photo', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(AVATAR_KEY);
          setAvatarUri(null);
        },
      },
    ]);
  };

  const openEdit = () => { setNameInput(progress.userName || ''); setEditVisible(true); };

  const showToast = () => {
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const saveName = async () => {
    const trimmed = cleanDisplayName(nameInput);
    if (trimmed.length > 0) {
      await saveUserName(trimmed);
      if (isAuthenticated) {
        try { await updateDisplayName(trimmed); } catch (_) {}
      }
      setToastMsg('Name saved!');
      showToast();
    }
    setEditVisible(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Log Out',
      'Your progress is saved to the cloud. Log back in any time to restore it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
            try { await signOut(); } catch (_) {}
            if (onReset) onReset();
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await updatePassword(newPw);
      setPwSuccess(true);
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => { setPwVisible(false); setPwSuccess(false); }, 1800);
    } catch (e) {
      setPwError(friendlyAuthError(e));
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all progress, and all training data. This CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: async () => {
            try {
              await deleteAccount();
            } catch (_) {}
            if (onReset) onReset(); // root handleReset clears all keys
          },
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress?',
      'This will delete all your local XP, levels, submissions and streak. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
            if (onReset) onReset(); // root handleReset clears all keys and returns to quiz
          },
        },
      ],
    );
  };

  const displayName = authUser?.display_name || progress.userName || '';
  const initials = displayName
    ? displayName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  const joinDate = progress.joinDate
    ? new Date(progress.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg }}>
        <HandstandLoader message="Getting things ready…" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Atmospheric background ── */}
      <ImageBackground
        source={require('./assets/hero-anyone-can.jpg')}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        imageStyle={{ resizeMode: 'cover', opacity: 0.35, transform: [{ scale: 1.2 }, { translateX: -40 }] }}
      />
      {/* Layer 1: heavy base darken */}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,11,0.85)' }} pointerEvents="none" />
      {/* Layer 2: vertical gradient */}
      <LinearGradient
        colors={['rgba(10,10,11,0.95)', 'rgba(10,10,11,0.7)', 'rgba(10,10,11,0.98)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      {/* Layer 3: bottom black fade */}
      <LinearGradient
        colors={['transparent', '#0A0A0B']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      {/* Layer 4: top black fade — keeps header clean */}
      <LinearGradient
        colors={['#0A0A0B', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      {/* Layer 5: subtle lime tint */}
      <LinearGradient
        colors={['rgba(215,255,61,0.05)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      {/* Content sits above all background layers */}
      <View style={{ flex: 1, zIndex: 10 }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[pf.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={[T.label, { color: C.accent }]}>MY ACCOUNT</Text>
            <Text style={[T.h1, { fontSize: 32, fontWeight: '900', textTransform: 'uppercase' }]}>Profile</Text>
          </View>
          <TouchableOpacity style={pf.editIcon} onPress={openEdit}>
            <Ionicons name="pencil-outline" size={18} color={C.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* Pro status banner */}
        {isPro() ? (
          <Animated.View style={[{ opacity: fadeAnim, marginHorizontal: S.md, marginBottom: S.sm }]}>
            <View style={pf.proBanner}>
              <View style={pf.proBannerIconWrap}>
                <Ionicons name="star" size={16} color={C.black} />
              </View>
              <Text style={[T.cap, { color: C.accent, fontWeight: '800', flex: 1 }]}>
                {isInTrial() ? 'PRO TRIAL ACTIVE' : 'HANDSTANDHUB PRO'}
              </Text>
              <Text style={[T.small, { color: C.textSub }]}>
                {isInTrial()
                  ? `${trialDaysRemaining()} day${trialDaysRemaining() !== 1 ? 's' : ''} left`
                  : subscriptionExpiresAt()
                    ? `Renews ${new Date(subscriptionExpiresAt()).toLocaleDateString()}`
                    : 'Active'}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[{ opacity: fadeAnim, marginHorizontal: S.md, marginBottom: S.sm }]}>
            <TouchableOpacity onPress={() => showPaywall('general', '')} activeOpacity={0.85}>
              <View style={pf.upgradeRow}>
                <Ionicons name="star-outline" size={16} color={C.accent} />
                <Text style={[T.cap, { color: C.accent, flex: 1 }]}>Free plan · Upgrade to Pro for all features</Text>
                <Ionicons name="chevron-forward" size={14} color={C.accent} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Avatar hero */}
        <Animated.View style={[pf.avatarSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={pf.avatarRing}>
            <TouchableOpacity
              onPress={pickAvatar}
              onLongPress={handleAvatarLongPress}
              activeOpacity={0.85}
              style={pf.avatarWrap}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[pf.avatarCircle, { overflow: 'hidden' }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[pf.avatarCircle, { backgroundColor: '#0A0A0B', borderWidth: 1.5, borderColor: '#D7FF3D44', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
                  {initials
                    ? <Text style={[pf.avatarInitials, { color: C.accent }]}>{initials}</Text>
                    : <HandstandFigure size={100} />
                  }
                </View>
              )}
              <View style={pf.avatarEditBadge}>
                {avatarUploading
                  ? <ActivityIndicator size="small" color={C.black} />
                  : <Ionicons name="camera-outline" size={13} color={C.black} />
                }
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[T.h2, { marginTop: S.md, textAlign: 'center' }]}>
            {authUser?.display_name || progress.userName || 'Your Name'}
          </Text>

          {/* Email row (authenticated users) */}
          {isAuthenticated && authUser?.email ? (
            <Text style={[T.cap, { color: C.textMuted, marginTop: 2 }]}>{authUser.email}</Text>
          ) : null}

          <TouchableOpacity onPress={openEdit} activeOpacity={0.75} style={pf.editNameBtn}>
            <Ionicons name="pencil-outline" size={12} color={C.accent} />
            <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>Edit Name</Text>
          </TouchableOpacity>

          {/* Sync status chip */}
          {isAuthenticated && (
            <View style={[pf.syncChip, {
              backgroundColor: syncStatus === 'synced' ? C.successDim : syncStatus === 'syncing' ? C.accentDim : syncStatus === 'error' ? C.errorDim : C.bgCardAlt,
              borderColor:     syncStatus === 'synced' ? C.success + '44' : syncStatus === 'syncing' ? C.accent + '44' : syncStatus === 'error' ? C.error + '44' : C.border,
            }]}>
              <Ionicons
                name={syncStatus === 'synced' ? 'cloud-done-outline' : syncStatus === 'syncing' ? 'sync-outline' : syncStatus === 'error' ? 'cloud-offline-outline' : 'cloud-outline'}
                size={11}
                color={syncStatus === 'synced' ? C.success : syncStatus === 'syncing' ? C.accent : syncStatus === 'error' ? C.error : C.textMuted}
              />
              <Text style={[T.cap, { color: syncStatus === 'synced' ? C.success : syncStatus === 'syncing' ? C.accent : syncStatus === 'error' ? C.error : C.textMuted }]}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Sync failed' : 'Cloud backup'}
              </Text>
            </View>
          )}

          {/* Level chip */}
          <View style={[pf.levelChip, { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]}>
            <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>LEVEL {level.id} · {level.name.toUpperCase()}</Text>
          </View>
        </Animated.View>

        {/* Performance Section — modern stat cards */}
          <View style={{ marginHorizontal: S.md, marginTop: S.lg }}>
            <Text style={[T.h3, { marginBottom: S.md }]}>Performance</Text>

            <View style={{ flexDirection: 'row', gap: S.sm }}>
              {/* Stat 1 — Total Sessions */}
              <View style={profileStatCard.card}>
                <View style={profileStatCard.iconWrap}>
                  <Ionicons name="trending-up" size={16} color={C.text} />
                </View>
                <Text style={profileStatCard.label}>Sessions</Text>
                <Text style={profileStatCard.value}>{progress.submissions?.length || 0}</Text>
              </View>

              {/* Stat 2 — Current Streak (lime only when active) */}
              {(() => {
                const active = (progress.streak || 0) > 0;
                return (
                  <View style={[profileStatCard.card, active && profileStatCard.cardHighlight]}>
                    <FlameIcon size={24} active={active} />
                    <Text style={[profileStatCard.label, active && { color: 'rgba(0,0,0,0.6)' }]}>Day Streak</Text>
                    <Text style={[profileStatCard.value, active && { color: C.black }]}>{progress.streak || 0}</Text>
                  </View>
                );
              })()}

              {/* Stat 3 — Current Level */}
              <View style={profileStatCard.card}>
                <View style={profileStatCard.iconWrap}>
                  <Ionicons name="trophy" size={16} color={C.text} />
                </View>
                <Text style={profileStatCard.label}>Level</Text>
                <Text style={profileStatCard.value}>{progress.currentLevel || 1}</Text>
              </View>
            </View>

            {/* Chart placeholder — will hold the progress chart */}
            <View style={profileStatCard.chartBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm }}>
                <Text style={[T.cap, { color: C.textSub }]}>Total Average</Text>
                <Text style={[T.h3, { color: C.accent }]}>{progress.submissions?.length || 0} sessions</Text>
              </View>
              <View style={profileStatCard.chartPlaceholder}>
                <Ionicons name="bar-chart-outline" size={32} color={C.textMuted} />
                <Text style={[T.small, { color: C.textMuted, marginTop: 6 }]}>Progress chart coming soon</Text>
              </View>
            </View>
          </View>

        {/* Consecutive streaks row */}
        <Animated.View style={[pf.streakRow, { opacity: fadeAnim }]}>
          <View style={pf.streakItem}>
            <Text style={[T.num, { color: C.accent, fontSize: 24 }]}>{progress.streak}</Text>
            <Text style={T.cap}>Streak Days</Text>
          </View>
          <View style={pf.streakDivider} />
          <View style={pf.streakItem}>
            <Text style={[T.num, { color: C.accent, fontSize: 24 }]}>
              {(() => {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const monday = new Date(now);
                monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
                monday.setHours(0, 0, 0, 0);
                return progress.submissions.filter(
                  s => new Date(s.date) >= monday
                ).length;
              })()}
            </Text>
            <Text style={T.cap}>This Week</Text>
          </View>
        </Animated.View>

        {/* Member since */}
        <Animated.View style={[pf.infoRow, { opacity: fadeAnim }]}>
          <View style={pf.infoIcon}>
            <Ionicons name="calendar-outline" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.cap}>Member since</Text>
            <Text style={[T.h4, { fontSize: 13 }]}>{joinDate}</Text>
          </View>
        </Animated.View>

        {/* Motivational quote – Movemate style with orange quotes */}
        <Animated.View style={[pf.quoteCard, { opacity: fadeAnim }]}>
          <Text style={pf.quoteMarkLeft}>"</Text>
          <Text style={[T.body, { fontStyle: 'italic', lineHeight: 22, color: C.text, flex: 1 }]}>{quote.text}</Text>
          <Text style={pf.quoteMarkRight}>"</Text>
          <Text style={[T.cap, { marginTop: S.sm, color: C.accent }]}>— {quote.author}</Text>
        </Animated.View>

        {/* Submission history */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: S.lg }}>
          <View style={pf.historyHeader}>
            <Text style={T.h4}>Submission History</Text>
            <Text style={[T.cap, { color: C.textMuted }]}>{progress.submissions.length} total</Text>
          </View>

          {progress.submissions.length === 0 ? (
            <View style={pf.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: S.sm }}>🎥</Text>
              <Text style={[T.small, { textAlign: 'center', color: C.textSub }]}>
                No submissions yet.{'\n'}Record your first handstand practice!
              </Text>
            </View>
          ) : (
            progress.submissions.map((sub, i) => (
              <View key={sub.id || i} style={pf.subRow}>
                <View style={[pf.subDot, { backgroundColor: sub.aiDetected === true ? C.success : C.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.small, { color: C.text, fontWeight: '600' }]}>Level {sub.levelId} Practice</Text>
                  <Text style={T.cap}>{new Date(sub.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                {sub.aiDetected === true ? (
                  <View style={[pf.subBadge, { backgroundColor: C.successDim, borderColor: C.success + '44', borderWidth: 1 }]}>
                    <Text style={[T.cap, { color: C.success, fontWeight: '700' }]}>AI Verified</Text>
                  </View>
                ) : sub.aiDetected === false ? (
                  <View style={[pf.subBadge, { backgroundColor: C.bgCardAlt }]}>
                    <Text style={[T.cap, { color: C.textMuted, fontWeight: '700' }]}>Unverified</Text>
                  </View>
                ) : (
                  <View style={pf.subBadge}>
                    <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>Pending</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </Animated.View>

        {/* Notifications settings card */}
        <Animated.View style={[{ opacity: fadeAnim, marginHorizontal: S.md, marginTop: S.lg }]}>
          <Text style={[T.h4, { marginBottom: S.sm }]}>Notifications</Text>

          {/* Denied banner */}
          {notifPermission === 'denied' && (
            <View style={[pf.notifBanner, { backgroundColor: C.errorDim, borderColor: C.error + '44' }]}>
              <Ionicons name="notifications-off-outline" size={16} color={C.error} />
              <Text style={[T.small, { flex: 1, color: C.error }]}>
                Notifications are blocked. Enable them in your device Settings → HandstandHub.
              </Text>
            </View>
          )}

          {/* Main toggle row */}
          <View style={pf.notifCard}>
            <View style={[pf.notifIcon, { backgroundColor: notifSettings.enabled ? C.accentDim : C.bgCardAlt }]}>
              <Ionicons name={notifSettings.enabled ? 'notifications' : 'notifications-outline'} size={18} color={notifSettings.enabled ? C.accent : C.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h4}>Daily Reminder</Text>
              <Text style={T.cap}>
                {notifSettings.enabled
                  ? `${String(notifSettings.reminderHour).padStart(2,'0')}:${String(notifSettings.reminderMinute).padStart(2,'0')} every day`
                  : 'Off'}
              </Text>
            </View>
            <TouchableOpacity
              style={[pf.notifToggle, notifSettings.enabled && { backgroundColor: C.accent }]}
              onPress={async () => {
                if (!notifSettings.enabled) {
                  await enableNotifications();
                } else {
                  await saveNotifSettings({ enabled: false });
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[pf.notifThumb, notifSettings.enabled && { transform: [{ translateX: 20 }] }]} />
            </TouchableOpacity>
          </View>

          {notifSettings.enabled && (
            <>
              {/* Reminder time picker trigger */}
              <TouchableOpacity
                style={pf.notifRow}
                onPress={() => {
                  setNotifHour(String(notifSettings.reminderHour));
                  setNotifMinute(String(notifSettings.reminderMinute).padStart(2, '0'));
                  setNotifVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={15} color={C.textMuted} />
                <Text style={[T.small, { flex: 1, color: C.text }]}>Reminder time</Text>
                <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>
                  {String(notifSettings.reminderHour).padStart(2,'0')}:{String(notifSettings.reminderMinute).padStart(2,'0')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
              </TouchableOpacity>

              {/* Streak reminder toggle */}
              <TouchableOpacity
                style={pf.notifRow}
                onPress={() => saveNotifSettings({ streakEnabled: !notifSettings.streakEnabled })}
                activeOpacity={0.8}
              >
                <Ionicons name="flame-outline" size={15} color={C.textMuted} />
                <Text style={[T.small, { flex: 1, color: C.text }]}>Streak reminder</Text>
                <View style={[pf.notifToggleSmall, notifSettings.streakEnabled && { backgroundColor: C.accent }]}>
                  <View style={[pf.notifThumbSmall, notifSettings.streakEnabled && { transform: [{ translateX: 14 }] }]} />
                </View>
              </TouchableOpacity>

              {/* Weekly summary toggle */}
              <TouchableOpacity
                style={pf.notifRow}
                onPress={() => saveNotifSettings({ weeklyEnabled: !notifSettings.weeklyEnabled })}
                activeOpacity={0.8}
              >
                <Ionicons name="bar-chart-outline" size={15} color={C.textMuted} />
                <Text style={[T.small, { flex: 1, color: C.text }]}>Weekly summary (Sunday)</Text>
                <View style={[pf.notifToggleSmall, notifSettings.weeklyEnabled && { backgroundColor: C.accent }]}>
                  <View style={[pf.notifThumbSmall, notifSettings.weeklyEnabled && { transform: [{ translateX: 14 }] }]} />
                </View>
              </TouchableOpacity>

              {/* Milestone celebrations toggle */}
              <TouchableOpacity
                style={pf.notifRow}
                onPress={() => saveNotifSettings({ milestoneEnabled: !notifSettings.milestoneEnabled })}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy-outline" size={15} color={C.textMuted} />
                <Text style={[T.small, { flex: 1, color: C.text }]}>Milestone celebrations</Text>
                <View style={[pf.notifToggleSmall, notifSettings.milestoneEnabled && { backgroundColor: C.accent }]}>
                  <View style={[pf.notifThumbSmall, notifSettings.milestoneEnabled && { transform: [{ translateX: 14 }] }]} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Reminder time edit modal */}
        <Modal visible={notifVisible} transparent animationType="fade" onRequestClose={() => setNotifVisible(false)} statusBarTranslucent>
          <KeyboardAvoidingView style={pf.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setNotifVisible(false)} />
            <View style={pf.modalBox}>
              <View style={pf.modalHeader}>
                <View style={pf.modalIconBg}>
                  <Ionicons name="time-outline" size={20} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h3, { marginBottom: 2 }]}>Reminder Time</Text>
                  <Text style={T.small}>Set your daily training reminder</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', marginVertical: S.md }}>
                <TextInput
                  style={[pf.nameInput, { width: 72, textAlign: 'center', fontSize: 22, fontWeight: '700' }]}
                  value={notifHour}
                  onChangeText={t => setNotifHour(t.replace(/[^0-9]/g,'').slice(0,2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="08"
                  placeholderTextColor={C.textMuted}
                />
                <Text style={[T.h2, { color: C.accent }]}>:</Text>
                <TextInput
                  style={[pf.nameInput, { width: 72, textAlign: 'center', fontSize: 22, fontWeight: '700' }]}
                  value={notifMinute}
                  onChangeText={t => setNotifMinute(t.replace(/[^0-9]/g,'').slice(0,2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={C.textMuted}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
                <TouchableOpacity style={pf.modalCancel} onPress={() => setNotifVisible(false)} activeOpacity={0.8}>
                  <Text style={[T.small, { color: C.textSub, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={pf.modalSave}
                  onPress={async () => {
                    const h = Math.min(23, Math.max(0, parseInt(notifHour,  10) || 0));
                    const min = Math.min(59, Math.max(0, parseInt(notifMinute, 10) || 0));
                    await saveNotifSettings({ reminderHour: h, reminderMinute: min });
                    setNotifVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={G.accent} style={pf.modalSaveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark" size={14} color={C.black} />
                    <Text style={[T.small, { color: C.black, fontWeight: '800' }]}>Save Time</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Account actions (authenticated users) */}
        {isAuthenticated && (
          <Animated.View style={[{ opacity: fadeAnim, marginHorizontal: S.md, marginTop: S.lg, gap: S.sm }]}>
            <Text style={[T.h4, { marginBottom: S.xs }]}>Account</Text>

            {/* Change Password */}
            <TouchableOpacity style={pf.accountRow} onPress={() => { setPwError(''); setPwSuccess(false); setPwVisible(true); }} activeOpacity={0.8}>
              <View style={pf.accountIcon}><Ionicons name="lock-closed-outline" size={16} color={C.accent} /></View>
              <Text style={[T.small, { flex: 1, color: C.text }]}>Change Password</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity style={[pf.accountRow, { borderColor: '#FF6B6B44' }]} onPress={handleSignOut} activeOpacity={0.8}>
              <View style={[pf.accountIcon, { backgroundColor: 'rgba(255,107,107,0.12)' }]}><Ionicons name="log-out-outline" size={16} color="#FF6B6B" /></View>
              <Text style={[T.small, { flex: 1, color: '#FF6B6B', fontWeight: '700' }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity style={[pf.accountRow, { borderColor: C.error + '44' }]} onPress={handleDeleteAccount} activeOpacity={0.8}>
              <View style={[pf.accountIcon, { backgroundColor: C.errorDim }]}><Ionicons name="trash-outline" size={16} color={C.error} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[T.small, { color: C.error, fontWeight: '700' }]}>Delete Account</Text>
                <Text style={[T.cap, { color: C.textMuted }]}>Permanently removes all your data</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Change Password Modal */}
        <Modal visible={pwVisible} transparent animationType="fade" onRequestClose={() => setPwVisible(false)} statusBarTranslucent>
          <KeyboardAvoidingView style={pf.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPwVisible(false)} />
            <View style={pf.modalBox}>
              <View style={pf.modalHeader}>
                <View style={pf.modalIconBg}><Ionicons name="lock-closed-outline" size={20} color={C.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h3, { marginBottom: 2 }]}>Change Password</Text>
                  <Text style={T.small}>Choose a strong password (min 8 chars)</Text>
                </View>
              </View>
              {pwSuccess ? (
                <View style={{ alignItems: 'center', paddingVertical: S.lg }}>
                  <Ionicons name="checkmark-circle" size={44} color={C.success} />
                  <Text style={[T.h4, { color: C.success, marginTop: S.sm }]}>Password updated!</Text>
                </View>
              ) : (
                <>
                  <TextInput style={pf.nameInput} value={newPw} onChangeText={t => { setNewPw(t); setPwError(''); }}
                    placeholder="New password" placeholderTextColor={C.textMuted} secureTextEntry autoFocus />
                  <TextInput style={[pf.nameInput, { marginTop: S.sm }]} value={confirmPw} onChangeText={t => { setConfirmPw(t); setPwError(''); }}
                    placeholder="Confirm new password" placeholderTextColor={C.textMuted} secureTextEntry />
                  {pwError ? <Text style={{ color: C.error, fontSize: 12, marginTop: S.xs }}>{pwError}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
                    <TouchableOpacity style={pf.modalCancel} onPress={() => setPwVisible(false)} activeOpacity={0.8}>
                      <Text style={[T.small, { color: C.textSub, fontWeight: '600' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={pf.modalSave} onPress={handleChangePassword} activeOpacity={0.85}>
                      <LinearGradient colors={G.accent} style={pf.modalSaveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {pwLoading
                          ? <ActivityIndicator color={C.black} size="small" />
                          : <><Ionicons name="checkmark" size={14} color={C.black} /><Text style={[T.small, { color: C.black, fontWeight: '800' }]}>Update</Text></>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Reset (local only) */}
        <Animated.View style={[{ opacity: fadeAnim, marginHorizontal: S.md, marginTop: S.xl }]}>
          <TouchableOpacity style={pf.resetBtn} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="warning-outline" size={16} color={C.error} />
            <Text style={[T.small, { color: C.error, fontWeight: '700' }]}>Reset Local Progress</Text>
          </TouchableOpacity>
          <Text style={[T.cap, { textAlign: 'center', marginTop: S.xs }]}>Clears local data only — cloud backup is unaffected</Text>
        </Animated.View>

        {/* Edit Name Modal */}
        <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)} statusBarTranslucent>
          <KeyboardAvoidingView style={pf.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditVisible(false)} />
            <View style={pf.modalBox}>
              <View style={pf.modalHeader}>
                <View style={pf.modalIconBg}>
                  <Ionicons name="person-outline" size={20} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h3, { marginBottom: 2 }]}>Edit Name</Text>
                  <Text style={T.small}>What should we call you?</Text>
                </View>
              </View>
              <TextInput
                style={pf.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={C.textMuted}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <Text style={[T.cap, { textAlign: 'right', marginTop: S.xs, color: nameInput.length >= 28 ? C.accent : C.textMuted }]}>
                {nameInput.length}/30
              </Text>
              <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
                <TouchableOpacity style={pf.modalCancel} onPress={() => setEditVisible(false)} activeOpacity={0.8}>
                  <Text style={[T.small, { color: C.textSub, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={pf.modalSave} onPress={saveName} activeOpacity={0.85}>
                  <LinearGradient colors={G.accent} style={pf.modalSaveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark" size={14} color={C.black} />
                    <Text style={[T.small, { color: C.black, fontWeight: '800' }]}>Save Name</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>

      {/* Toast */}
      <Animated.View pointerEvents="none" style={[pf.toast, { opacity: toastOpacity, bottom: insets.bottom + 80 }]}>
        <Ionicons name="checkmark-circle" size={15} color={C.white} />
        <Text style={[T.small, { color: C.white, fontWeight: '700' }]}>{toastMsg}</Text>
      </Animated.View>
      </View>{/* end zIndex:10 content wrapper */}
    </View>
  );
}

const profileStatCard = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  cardHighlight: {
    backgroundColor: C.accent,
    borderColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  chartBox: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: S.md,
    marginTop: S.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  chartPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgDeep,
    borderRadius: 12,
  },
});

const pf = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  editIcon:       { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  avatarSection:  { alignItems: 'center', paddingVertical: S.lg },
  avatarRing:     { width: 118, height: 118, borderRadius: 59, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarWrap:     { position: 'relative', width: 108, height: 108 },
  avatarCircle:   { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 40, fontWeight: '900', color: C.accent },
  avatarEditBadge:{ position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  editNameBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: S.sm, paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.full, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44' },
  levelChip:      { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginTop: S.sm, paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.full, borderWidth: 1 },
  streakRow:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: S.md, marginTop: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  streakItem:     { flex: 1, alignItems: 'center', paddingVertical: S.md },
  streakDivider:  { width: 1, height: '60%', backgroundColor: C.border },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginHorizontal: S.md, marginTop: S.sm, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border },
  infoIcon:       { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  quoteCard:      { marginHorizontal: S.md, marginTop: S.md, backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.lg, borderWidth: 1, borderColor: C.border, position: 'relative', overflow: 'hidden' },
  quoteMarkLeft:  { fontSize: 52, fontWeight: '900', color: C.accent, lineHeight: 52, marginBottom: -S.sm, opacity: 0.5 },
  quoteMarkRight: { fontSize: 52, fontWeight: '900', color: C.accent, lineHeight: 30, textAlign: 'right', opacity: 0.5 },
  historyHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: S.md, marginBottom: S.sm },
  emptyBox:       { marginHorizontal: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.xl, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  subRow:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: S.md, paddingVertical: S.sm, gap: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  subDot:         { width: 8, height: 8, borderRadius: 4 },
  subBadge:       { backgroundColor: C.accentDim, paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.full },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: S.lg },
  modalBox:       { backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.lg, width: '100%', borderWidth: 1, borderColor: C.border },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md },
  modalIconBg:    { width: 42, height: 42, borderRadius: R.lg, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  nameInput:      { backgroundColor: C.bgCardAlt, borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: S.md, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border },
  modalCancel:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCardAlt, borderRadius: R.lg, paddingVertical: S.md, borderWidth: 1, borderColor: C.border },
  modalSave:      { flex: 2, borderRadius: R.lg, overflow: 'hidden' },
  modalSaveGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.md },
  syncChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: S.xs, paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.full, borderWidth: 1 },
  accountRow:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  accountIcon:    { width: 34, height: 34, borderRadius: R.lg, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  proBanner:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.lg, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.accent + '44' },
  proBannerIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  upgradeRow:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.accentDim, paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.lg, borderWidth: 1, borderColor: C.accent + '44' },
  resetBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.errorDim, borderRadius: R.lg, paddingVertical: S.md, borderWidth: 1, borderColor: C.error + '40' },
  toast:          { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.success, paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.full, elevation: 8, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
  // Notification styles
  notifBanner:    { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, padding: S.sm, borderRadius: R.lg, borderWidth: 1, marginBottom: S.sm },
  notifCard:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  notifIcon:      { width: 38, height: 38, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
  notifToggle:    { width: 46, height: 26, borderRadius: 13, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 3 },
  notifThumb:     { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
  notifToggleSmall:{ width: 36, height: 20, borderRadius: 10, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 3 },
  notifThumbSmall: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.white },
  notifRow:       { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, marginBottom: S.xs, borderWidth: 1, borderColor: C.border },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Onboarding (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING QUIZ
// Steps: 0=Welcome, 1-15=Quiz questions, 16=Calculating, 17=Target date, 18=Social proof
// ─────────────────────────────────────────────────────────────────────────────
// qIndex 6 = frustrations, qIndex 14 = injuries — both multi-select
const MULTI_SELECT_Q = new Set([6, 14]);

// Quiz option with haptic + spring pop — emotional micro-interaction
function AnimatedQuizOption({ option, selected, onPress }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      tension: 180, friction: 7,
      useNativeDriver: true,
    }).start();
  }, [selected, checkScale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <TouchableOpacity
        style={[ob.optionCard, selected && ob.optionCardSelected]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Text style={[ob.optionText, selected && { color: C.black }]}>{option}</Text>
        {selected && (
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark-circle" size={20} color={C.black} />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function OnboardingQuiz({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [step,          setStep]          = useState(0);
  // Multi-select questions start as [], single-select start as null
  const [answers,       setAnswers]       = useState(
    Array.from({ length: 15 }, (_, i) => MULTI_SELECT_Q.has(i) ? [] : null)
  );
  const [assignedLevel, setAssignedLevel] = useState(1);
  const [calcStep,      setCalcStep]      = useState(0); // 0,1,2 during calculating screen
  const [targetDate,    setTargetDate]    = useState(null);
  const [goalWeeks,     setGoalWeeks]     = useState(8);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;
  const calcSpin  = useRef(new Animated.Value(0)).current;
  // Gentle breathing loop for the welcome hero — makes it feel alive
  const heroBreath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroBreath, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(heroBreath, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [heroBreath]);
  const heroScale = heroBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const haloOpacity = heroBreath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const animateTo = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const selectAnswer = (qIndex, option) => {
    const next = [...answers];
    if (MULTI_SELECT_Q.has(qIndex)) {
      const current = Array.isArray(next[qIndex]) ? next[qIndex] : [];
      const isExclusive = (o) => o === 'None' || o === 'Nothing — I feel solid';
      if (isExclusive(option)) {
        next[qIndex] = current.includes(option) ? [] : [option];
      } else {
        const cleaned = current.filter(o => !isExclusive(o));
        next[qIndex] = cleaned.includes(option)
          ? cleaned.filter(o => o !== option)
          : [...cleaned, option];
      }
    } else {
      next[qIndex] = option;
    }
    setAnswers(next);
  };

  // Returns true when the current quiz step has a valid answer
  const stepHasAnswer = (s) => {
    if (s < 1 || s > 15) return true;
    const qi = s - 1;
    const ans = answers[qi];
    return MULTI_SELECT_Q.has(qi) ? (Array.isArray(ans) && ans.length > 0) : ans !== null;
  };

  // Weeks to goal based on the user's chosen end-goal (answers[13])
  const weeksForGoal = (goalAns) => {
    switch (goalAns) {
      case '10-second hold':     return 4;
      case '30-second hold':     return 8;
      case '1-minute hold':      return 16;
      case 'Press to handstand': return 20;
      case 'Walking on hands':   return 24;
      default:                   return 8;
    }
  };

  // Called after last quiz question (step 15) — saves answers, runs the plan-reveal sequence
  const handleQuizFinish = async () => {
    const level = assignLevel(answers);
    setAssignedLevel(level);
    try {
      await sensitiveStore.set(QUIZ_ANSWERS_KEY, JSON.stringify(answers));
      await AsyncStorage.setItem(QUIZ_LEVEL_KEY,   String(level));
    } catch (e) { console.warn('Quiz finish: save answers failed', e); }
    const weeks = weeksForGoal(answers[13]);
    setGoalWeeks(weeks);
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    setTargetDate(d);
    try {
      await AsyncStorage.setItem('@handstandai_target_date', d.toISOString());
      await AsyncStorage.setItem('@handstandai_goal_weeks', String(weeks));
    } catch (_) {}

    // Step 16 — Calculating screen (6 seconds, 3 rotating status lines)
    animateTo(16);
    setCalcStep(0);
    Animated.loop(
      Animated.timing(calcSpin, { toValue: 1, duration: 1400, useNativeDriver: true })
    ).start();
    setTimeout(() => setCalcStep(1), 2000);
    setTimeout(() => setCalcStep(2), 4000);
    // After the calculating sequence, advance to the target-date reveal (step 17)
    setTimeout(() => {
      calcSpin.stopAnimation();
      animateTo(17);
    }, 6000);
  };

  // Derived values
  const qIndex      = step >= 1 && step <= 15 ? step - 1 : null;
  const currentQ    = qIndex !== null ? QUIZ_QUESTIONS[qIndex] : null;
  const currentAns  = qIndex !== null ? answers[qIndex] : null;
  const isMulti     = qIndex !== null && MULTI_SELECT_Q.has(qIndex);
  const hasAnswer   = stepHasAnswer(step);
  const showBar     = step >= 1 && step <= 15;
  const barProgress = showBar ? step / 15 : 0;
  const celebLevel  = EXERCISE_LEVELS.find(l => l.id === Math.min(assignedLevel, EXERCISE_LEVELS.length));

  const backDest = () => {
    if (step >= 1 && step <= 15) return step - 1; // Q1 → welcome (0), Q2-Q15 → prev Q
    return null;
  };
  const showBack = step >= 1 && step <= 15;

  return (
    <KeyboardAvoidingView
      style={[ob.container, { paddingTop: insets.top, paddingBottom: insets.bottom + S.xxl + S.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[C.bg, '#0D0D0F', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <View style={ob.deco1} />
      <View style={ob.deco2} />
      <View style={ob.deco3} />

      {/* Back arrow — steps 1-9 */}
      {showBack && (
        <TouchableOpacity
          onPress={() => animateTo(backDest())}
          style={ob.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={C.textSub} />
        </TouchableOpacity>
      )}

      {/* Progress bar — steps 1-7 */}
      {showBar && (
        <View style={ob.progressWrap}>
          <View style={ob.progressTrack}>
            <View style={[ob.progressFill, { width: `${barProgress * 100}%` }]} />
          </View>
          <Text style={[T.cap, { marginTop: 6, alignSelf: 'flex-end', color: C.accent, fontWeight: '800', letterSpacing: 1 }]}>QUESTION {step} OF 15</Text>
        </View>
      )}

      {/* Real-time unlocks panel — shows what the user's answers have unlocked */}
      {showBar && step >= 2 && deriveUnlocks(answers).length > 0 && (
        <View style={ob.unlocksPanel}>
          <Text style={[T.cap, { color: C.textMuted, marginBottom: 6, letterSpacing: 0.5, fontWeight: '800' }]}>
            YOUR PLAN SO FAR
          </Text>
          {deriveUnlocks(answers).slice(-3).map((u, i) => (
            <View key={`unlock-${i}-${u}`} style={ob.unlockChip}>
              <Ionicons name="checkmark-circle" size={14} color={C.accent} />
              <Text style={ob.unlockText} numberOfLines={1}>{u}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Step content */}
      <Animated.View style={[ob.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* STEP 0 – Welcome */}
        {step === 0 && (
          <View style={ob.slide}>
            <Animated.View style={[ob.heroGlow, { opacity: haloOpacity }]}>
              <Animated.View style={[ob.heroIcon, { transform: [{ scale: heroScale }] }]}>
                <HandstandFigure size={140} />
              </Animated.View>
            </Animated.View>

            <Text style={[T.label, { color: C.accent, marginTop: S.xl, marginBottom: S.xs, letterSpacing: 3 }]}>HANDSTANDHUB</Text>
            <Text style={[T.h1, { fontSize: 28, textAlign: 'center', lineHeight: 34, marginBottom: S.sm, fontWeight: '800' }]}>
              Your first freestanding{'\n'}
              <Text style={{ color: C.accent }}>handstand in 8 weeks.</Text>
            </Text>
            <Text style={[T.body, { color: C.textSub, textAlign: 'center', maxWidth: 300, lineHeight: 23, marginBottom: S.xl }]}>
              A plan built around your level — not a generic routine.
            </Text>

            <View style={ob.heroFeatures}>
              <View style={ob.heroFeatureRow}>
                <View style={ob.heroFeatureDot} />
                <Text style={[T.body, { color: C.text, fontWeight: '600', fontSize: 15 }]}>AI form feedback on every rep</Text>
              </View>
              <View style={ob.heroFeatureRow}>
                <View style={ob.heroFeatureDot} />
                <Text style={[T.body, { color: C.text, fontWeight: '600', fontSize: 15 }]}>Adapts to your weak spots weekly</Text>
              </View>
              <View style={ob.heroFeatureRow}>
                <View style={ob.heroFeatureDot} />
                <Text style={[T.body, { color: C.text, fontWeight: '600', fontSize: 15 }]}>Built from 1,400+ inversion drills</Text>
              </View>
            </View>
          </View>
        )}

        {/* STEPS 1-15 – Quiz questions */}
        {step >= 1 && step <= 15 && currentQ && (
          <View style={ob.slide}>
            <Text style={[T.h2, { textAlign: 'center', marginBottom: isMulti ? S.xs : S.lg, lineHeight: 36 }]}>
              {currentQ.question}
            </Text>
            {isMulti && (
              <Text style={[T.cap, { color: C.textMuted, marginBottom: S.md }]}>Select all that apply</Text>
            )}
            <View style={{ width: '100%', gap: S.sm }}>
              {currentQ.options.map(option => {
                const selected = isMulti
                  ? (Array.isArray(currentAns) && currentAns.includes(option))
                  : currentAns === option;
                return (
                  <AnimatedQuizOption
                    key={option}
                    option={option}
                    selected={selected}
                    onPress={() => selectAnswer(qIndex, option)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 16 – Calculating (animated) */}
        {step === 16 && (
          <View style={[ob.slide, { justifyContent: 'center', paddingTop: S.xxl }]}>
            <Animated.View style={{
              width: 110, height: 110, borderRadius: 55,
              borderWidth: 3, borderColor: C.accent + '55', borderTopColor: C.accent,
              transform: [{ rotate: calcSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
              alignItems: 'center', justifyContent: 'center',
            }}>
              <HandstandFigure size={120} />
            </Animated.View>
            <Text style={[T.label, { color: C.accent, marginTop: S.xl, letterSpacing: 2 }]}>BUILDING YOUR PLAN</Text>
            <Text style={[T.h2, { textAlign: 'center', marginTop: S.sm, lineHeight: 30 }]}>
              {calcStep === 0 && 'Analyzing your 15 answers…'}
              {calcStep === 1 && `Matching ${30 + deriveUnlocks(answers).length * 4} drills…`}
              {calcStep === 2 && `Structuring your ${goalWeeks}-week plan…`}
            </Text>
          </View>
        )}

        {/* STEP 17 – Target date reveal */}
        {step === 17 && (
          <View style={[ob.slide, { justifyContent: 'center', paddingTop: S.xl }]}>
            <Text style={[T.label, { color: C.accent, letterSpacing: 2, marginBottom: S.xs }]}>YOUR TARGET DATE</Text>
            <Text style={[T.h1, { textAlign: 'center', fontSize: 26, lineHeight: 34, marginBottom: S.xs, maxWidth: 340 }]}>
              You'll hit your goal on
            </Text>
            <Text style={[T.h1, { textAlign: 'center', fontSize: 34, color: C.accent, marginBottom: S.lg }]}>
              {targetDate ? targetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
            </Text>
            {/* Mini projection graph — week-by-week wall-hold seconds */}
            <View style={ob.projGraph}>
              {Array.from({ length: Math.min(goalWeeks, 12) }).map((_, i) => {
                const h = 10 + ((i + 1) / Math.min(goalWeeks, 12)) * 70;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 90 }}>
                    <View style={{ width: '60%', height: h, backgroundColor: C.accent, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.3 + (i / 12) * 0.7 }} />
                  </View>
                );
              })}
            </View>
            <Text style={[T.cap, { color: C.textMuted, marginTop: S.sm }]}>
              Projected wall-hold seconds, week by week
            </Text>
            <View style={ob.levelStamp}>
              <Text style={[T.cap, { color: C.textSub, letterSpacing: 1 }]}>STARTING POINT</Text>
              <Text style={[T.h3, { color: C.accent, marginTop: 2 }]}>Level {assignedLevel} — {celebLevel?.name || 'Beginner'}</Text>
            </View>
          </View>
        )}

        {/* STEP 18 – Social proof */}
        {step === 18 && (
          <View style={[ob.slide, { justifyContent: 'center', paddingTop: S.xl }]}>
            <Text style={[T.label, { color: C.accent, letterSpacing: 2, marginBottom: S.sm }]}>YOU'RE NOT ALONE</Text>
            <Text style={[T.h1, { textAlign: 'center', fontSize: 28, lineHeight: 34, marginBottom: S.xs }]}>
              Over <Text style={{ color: C.accent }}>4,200 people</Text> started{'\n'}where you are.
            </Text>
            <Text style={[T.body, { color: C.textSub, textAlign: 'center', marginBottom: S.lg, maxWidth: 300 }]}>
              Real stories from this level:
            </Text>
            <View style={ob.proofCard}>
              <View style={ob.proofAvatar}><Avatar2 size={44} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { color: C.text, fontWeight: '700' }]}>Maya, 28</Text>
                <Text style={[T.cap, { color: C.textSub, lineHeight: 18 }]}>"Hit my first 10-sec freestanding in week 6."</Text>
              </View>
            </View>
            <View style={ob.proofCard}>
              <View style={ob.proofAvatar}><Avatar1 size={44} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { color: C.text, fontWeight: '700' }]}>Daniel, 35</Text>
                <Text style={[T.cap, { color: C.textSub, lineHeight: 18 }]}>"The wrist prep alone saved my training."</Text>
              </View>
            </View>
            <View style={ob.proofCard}>
              <View style={ob.proofAvatar}><Avatar3 size={44} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { color: C.text, fontWeight: '700' }]}>Noa, 22</Text>
                <Text style={[T.cap, { color: C.textSub, lineHeight: 18 }]}>"30-sec hold in 9 weeks. The plan really adapts."</Text>
              </View>
            </View>
          </View>
        )}

      </Animated.View>

      {/* CTA buttons */}
      <View style={ob.btnRow}>
        {step === 0 && (
          <TouchableOpacity style={ob.primaryBtn} onPress={() => animateTo(1)} activeOpacity={0.85}>
            <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>SHOW ME MY PLAN</Text>
              <Ionicons name="arrow-forward" size={18} color={C.black} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step >= 1 && step <= 14 && (
          <>
            <TouchableOpacity
              style={[ob.primaryBtn, !hasAnswer && { opacity: 0.4 }]}
              onPress={() => hasAnswer && animateTo(step + 1)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>NEXT</Text>
                <Ionicons name="arrow-forward" size={18} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={ob.backLink} onPress={() => animateTo(backDest())} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={14} color={C.textSub} />
              <Text style={[T.cap, { color: C.textSub, fontWeight: '700', marginLeft: 6 }]}>Back</Text>
            </TouchableOpacity>
          </>
        )}
        {step === 15 && (
          <>
            <TouchableOpacity
              style={[ob.primaryBtn, !hasAnswer && { opacity: 0.4 }]}
              onPress={() => hasAnswer && handleQuizFinish()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>FINISH</Text>
                <Ionicons name="checkmark" size={18} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={ob.backLink} onPress={() => animateTo(backDest())} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={14} color={C.textSub} />
              <Text style={[T.cap, { color: C.textSub, fontWeight: '700', marginLeft: 6 }]}>Back</Text>
            </TouchableOpacity>
          </>
        )}
        {/* step 16: no button — auto-advances to step 17 */}
        {step === 17 && (
          <TouchableOpacity style={ob.primaryBtn} onPress={() => animateTo(18)} activeOpacity={0.85}>
            <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>SEE HOW WE'LL GET YOU THERE</Text>
              <Ionicons name="arrow-forward" size={18} color={C.black} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 18 && (
          <TouchableOpacity style={ob.primaryBtn} onPress={() => onComplete(assignedLevel)} activeOpacity={0.85}>
            <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>START MY FIRST DRILL</Text>
              <Ionicons name="arrow-forward" size={18} color={C.black} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const ob = StyleSheet.create({
  container:          { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  deco1:              { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: C.accent + '08', top: -80, right: -80 },
  deco2:              { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.accent + '05', bottom: 80, left: -60 },
  deco3:              { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: C.accent + '06', top: '40%', right: -30 },
  backBtn:            { position: 'absolute', top: 0, left: S.lg, zIndex: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  progressWrap:       { width: '100%', paddingHorizontal: S.lg, paddingTop: S.sm },
  progressTrack:      { width: '100%', height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  progressFill:       { height: 4, backgroundColor: C.accent, borderRadius: 2 },
  content:            { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: S.lg },
  slide:              { alignItems: 'center', width: '100%' },
  logoBg:             { alignItems: 'center', justifyContent: 'center' },
  heroBullets:        { width: '100%', maxWidth: 340, gap: 10, paddingHorizontal: S.sm },
  heroBulletRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroGlow:           { width: 140, height: 140, borderRadius: 70, backgroundColor: C.accent + '0D', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 0 },
  heroIcon:           { alignItems: 'center', justifyContent: 'center' },
  heroFeatures:       { width: '100%', maxWidth: 320, gap: 14 },
  heroFeatureRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroFeatureDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  unlocksPanel:       { width: '100%', paddingHorizontal: S.lg, paddingTop: S.sm, gap: 6 },
  unlockChip:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent + '14', borderWidth: 1, borderColor: C.accent + '33', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  unlockText:         { color: C.text, fontSize: 12, fontWeight: '700', flex: 1 },
  projGraph:          { flexDirection: 'row', alignItems: 'flex-end', width: '100%', height: 100, gap: 4, paddingHorizontal: S.sm },
  levelStamp:         { marginTop: S.lg, paddingVertical: S.sm, paddingHorizontal: S.md, borderRadius: R.xl, borderWidth: 1, borderColor: C.accent + '55', backgroundColor: C.accent + '10', alignItems: 'center' },
  proofCard:          { flexDirection: 'row', alignItems: 'center', gap: S.sm, width: '100%', padding: S.sm, borderRadius: R.xl, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  proofAvatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '33' },
  optionCard:         { width: '100%', padding: S.md + 2, borderRadius: R.xl, backgroundColor: C.bgCard, borderWidth: 2, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  optionCardSelected: { backgroundColor: C.accent, borderColor: C.accent },
  optionText:         { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  levelPill:          { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.md, marginBottom: S.sm, borderWidth: 2, borderColor: C.border, width: '100%' },
  nameInput:          { width: '100%', backgroundColor: C.bgCard, borderRadius: R.xl, paddingHorizontal: S.md, paddingVertical: S.md, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border, textAlign: 'center' },
  btnRow:             { width: '100%', paddingHorizontal: S.lg, alignItems: 'center', gap: S.sm, marginBottom: S.xl, marginTop: S.lg },
  primaryBtn:         { width: '100%', borderRadius: R.xxl, overflow: 'hidden' },
  primaryGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
  skipBtn:            { paddingVertical: S.sm, alignItems: 'center' },
  backLink:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: S.sm, paddingHorizontal: S.md, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3 – PROGRESS CHARTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Legacy pure-RN chart components (used in existing sections) ──────────────
function BarChart({ data, color = C.accent, maxValue, height: chartH = 100 }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: chartH }}>
      {data.map((item, i) => {
        const ratio = item.value / max;
        const barH  = Math.max(ratio * chartH, item.value > 0 ? 4 : 0);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: chartH }}>
            <View style={{
              width: '100%', height: barH,
              backgroundColor: item.isHighlight ? C.accent : color,
              borderRadius: 4,
              opacity: item.value === 0 ? 0.15 : 1,
            }} />
            <Text style={[T.cap, { fontSize: 9, marginTop: 3, color: C.textMuted }]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// LineChart: renders a polyline from a data array of { label, value } objects
function LineChart({ data, color = C.accent, height: chartH = 100 }) {
  const max    = Math.max(...data.map(d => d.value), 1);
  const pts    = data.length;
  const segW   = (width - S.md * 2 - S.lg * 2) / Math.max(pts - 1, 1);

  return (
    <View style={{ height: chartH + 20 }}>
      <View style={{ height: chartH, position: 'relative' }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map(ratio => (
          <View key={ratio} style={{
            position: 'absolute', left: 0, right: 0,
            top: (1 - ratio) * chartH,
            height: 1, backgroundColor: C.border,
          }} />
        ))}
        {/* Connecting lines between points */}
        {data.slice(0, -1).map((item, i) => {
          const x1 = i * segW;
          const y1 = (1 - item.value / max) * chartH;
          const x2 = (i + 1) * segW;
          const y2 = (1 - data[i + 1].value / max) * chartH;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return (
            <View key={i} style={{
              position: 'absolute',
              left: x1, top: y1,
              width: len, height: 2,
              backgroundColor: color,
              transformOrigin: '0 1',
              transform: [{ rotate: `${angle}deg` }],
              opacity: 0.7,
            }} />
          );
        })}
        {/* Data points */}
        {data.map((item, i) => {
          const x = i * segW - 5;
          const y = (1 - item.value / max) * chartH - 5;
          return (
            <View key={i} style={{
              position: 'absolute', left: x, top: y,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: color,
              borderWidth: 2, borderColor: C.bg,
            }} />
          );
        })}
      </View>
      {/* X labels */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {data.map((item, i) => (
          <Text key={i} style={[T.cap, { fontSize: 9, color: C.textMuted, width: segW, textAlign: 'center' }]}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Heatmap: 12-week contribution grid like GitHub
function ContribHeatmap({ submissions }) {
  const today    = new Date();
  const WEEKS    = 12;
  const DAYS     = 7;
  const total    = WEEKS * DAYS;
  const cells    = [];

  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const count = submissions.filter(s => s.date && s.date.startsWith(key)).length;
    cells.push({ key, count, label: d.toDateString().slice(0, 3) });
  }

  const cellSize = Math.floor((width - S.md * 2 - S.lg * 2 - (WEEKS - 1) * 3) / WEEKS);

  const rows = [];
  for (let day = 0; day < DAYS; day++) {
    const row = [];
    for (let week = 0; week < WEEKS; week++) {
      row.push(cells[week * DAYS + day]);
    }
    rows.push(row);
  }

  return (
    <View>
      {rows.map((row, di) => (
        <View key={di} style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
          {row.map((cell, wi) => (
            <View
              key={wi}
              style={{
                width: cellSize, height: cellSize, borderRadius: 2,
                backgroundColor: cell?.count > 2 ? C.accent
                  : cell?.count > 0 ? C.accent + '66'
                  : C.bgCardAlt,
              }}
            />
          ))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm }}>
        <Text style={[T.cap, { color: C.textMuted }]}>Less</Text>
        {['#21262D', C.accent + '44', C.accent + '88', C.accent].map(bg => (
          <View key={bg} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: bg }} />
        ))}
        <Text style={[T.cap, { color: C.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

// ── Data helpers for progress charts ─────────────────────────────────────────
function getLast12Weeks() {
  const weeks = [];
  const now = new Date();
  for (let w = 11; w >= 0; w--) {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7);
    monday.setHours(0, 0, 0, 0);
    const end = new Date(monday);
    end.setDate(monday.getDate() + 7);
    const mm = monday.getMonth() + 1;
    const dd = monday.getDate();
    weeks.push({ start: monday, end, label: w === 0 ? 'Now' : `${mm}/${dd}` });
  }
  return weeks;
}

function getBestHoldPerWeek(timerHistory, weeks) {
  return weeks.map(week => {
    const holds = timerHistory.filter(h => {
      const d = new Date(h.date);
      return d >= week.start && d < week.end;
    });
    const best = holds.length > 0 ? Math.max(...holds.map(h => h.duration)) : 0;
    return { value: best, label: week.label };
  });
}

function getTotalMinutesPerWeek(sessions, weeks) {
  return weeks.map(week => {
    const count = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= week.start && d < week.end;
    }).length;
    return { value: count * 20, label: week.label };
  });
}

function getMonthlyHoldProgress(timerHistory) {
  if (timerHistory.length < 2) return [];
  const sorted = [...timerHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();
  const months = [];
  for (let m = 5; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
    const holds = sorted.filter(h => { const d = new Date(h.date); return d >= start && d < end; });
    if (holds.length > 0) {
      months.push({
        label: start.toLocaleString('default', { month: 'short' }),
        best:  Math.max(...holds.map(h => h.duration)),
        avg:   Math.round(holds.reduce((s, h) => s + h.duration, 0) / holds.length),
        count: holds.length,
      });
    }
  }
  return months;
}

function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { progress } = useContext(UserProgressContext);
  const { isPro, hasActiveEntitlement } = useContext(PurchaseContext);
  const { computeForgivingStreak } = useContext(MilestoneContext);
  const { earned: earnedBadges } = useContext(BadgeContext);
  const { streak: forgivingStreak, frozen } = computeForgivingStreak(progress);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef(null);

  const [timerHistory, setTimerHistory] = useState([]);
  const [sharing, setSharing] = useState(false);

  useFocusEffect(useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    loadVoiceHistory().then(setTimerHistory);
    return () => fadeAnim.setValue(0);
  }, []));

  const { submissions, completedLevels, totalXP, joinDate } = progress;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSessions = submissions?.length ?? 0;
  const longestHold   = timerHistory.length > 0 ? Math.max(...timerHistory.map(h => h.duration)) : 0;
  const daysSinceJoin = joinDate
    ? Math.max(1, Math.floor((new Date() - new Date(joinDate)) / 86400000))
    : 1;
  const avgPerWeek = (totalSessions / (daysSinceJoin / 7)).toFixed(1);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const weeks12         = getLast12Weeks();
  const holdPerWeek     = getBestHoldPerWeek(timerHistory, weeks12);
  const minsPerWeek     = getTotalMinutesPerWeek(submissions, weeks12);
  const monthlyProgress = getMonthlyHoldProgress(timerHistory);

  const chartW = width - S.md * 2 - S.lg * 2;

  const giftedHoldData = holdPerWeek.map((w, i) => ({
    value: w.value,
    label: i % 3 === 0 ? w.label : '',
  }));

  const giftedMinsData = minsPerWeek.map((w, i) => ({
    value: w.value,
    label: i % 3 === 0 ? w.label : '',
    frontColor: w.value > 0 ? C.accent : C.bgCardElevated,
  }));

  // ── Legacy weekly bar chart data (last 8 weeks) ────────────────────────────
  const weeklyData = (() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, idx) => {
      const w      = 7 - idx;
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);
      const count = submissions.filter(s => {
        const d = new Date(s.date);
        return d >= monday && d < sunday;
      }).length;
      const mm = monday.getMonth() + 1;
      const dd = monday.getDate();
      return { label: w === 0 ? 'Now' : `${mm}/${dd}`, value: count, isHighlight: w === 0 };
    });
  })();

  const bestWeek     = Math.max(...weeklyData.map(w => w.value), 0);
  const levelTimeline = EXERCISE_LEVELS.map(l => ({ level: l, done: completedLevels.includes(l.id) }));

  // ── Empty state ────────────────────────────────────────────────────────────
  const isEmpty = totalSessions === 0 && timerHistory.length === 0 && completedLevels.length === 0;

  // ── Share handler ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!viewShotRef.current) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture();
      await Share.share({ url: uri, message: 'My handstand progress with HandstandHub 🔥' });
    } catch (_) {
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.92 }}>
          <Animated.View style={{ opacity: fadeAnim, backgroundColor: C.bg }}>

            {/* Header */}
            <View style={pg.header}>
              <Text style={[T.label, { color: C.accent }]}>YOUR JOURNEY SO FAR</Text>
              <Text style={[T.h2, { fontSize: 32, fontWeight: '900', textTransform: 'uppercase' }]}>PROGRESS</Text>
            </View>

            {/* ── TOP STATS (horizontal scroll) ───────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: S.md, gap: S.sm, paddingBottom: S.sm }}
            >
              {[
                { icon: 'barbell-outline',                                    val: totalSessions,                       label: 'TOTAL\nSESSIONS' },
                { icon: frozen ? 'snow-outline' : 'flame-outline',            val: `${forgivingStreak}d`,               label: 'CURRENT\nSTREAK'  },
                { icon: 'timer-outline',                                       val: longestHold > 0 ? `${longestHold}s` : '—', label: 'LONGEST\nHOLD' },
                { icon: 'trophy-outline',                                      val: completedLevels.length,             label: 'LEVELS\nDONE'     },
                { icon: 'star-outline',                                        val: totalXP,                            label: 'TOTAL\nXP'        },
              ].map(s => (
                <View key={s.label} style={pg.statCard}>
                  <Ionicons name={s.icon} size={20} color={C.accent} />
                  <Text style={pg.statNum}>{s.val}</Text>
                  <Text style={pg.statLabel}>{s.label}</Text>
                </View>
              ))}
            </ScrollView>

            {isEmpty ? (
              /* ── EMPTY STATE ──────────────────────────────────────────────── */
              <View style={pg.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: S.md }}>📊</Text>
                <Text style={[T.h3, { textAlign: 'center', marginBottom: S.sm }]}>Nothing here yet</Text>
                <Text style={[T.body, { textAlign: 'center', color: C.textMuted }]}>
                  Your progress will appear here once you start training!
                </Text>
              </View>
            ) : (<>

              {/* ── GRAPH A: Best Hold Per Week ──────────────────────────── */}
              <View style={pg.chartCard}>
                <View style={pg.chartHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h4}>Best Hold Per Week</Text>
                    <Text style={[T.cap, { color: C.textMuted, marginTop: 2 }]}>Your longest handstand each week</Text>
                  </View>
                  {longestHold > 0 && (
                    <View style={pg.pillBadge}>
                      <Text style={pg.pillText}>Best: {longestHold}s</Text>
                    </View>
                  )}
                </View>
                {timerHistory.length === 0 ? (
                  <View style={pg.emptyChart}>
                    <Text style={[T.small, { color: C.textMuted, textAlign: 'center' }]}>
                      Use the Hold Timer to see your best holds here
                    </Text>
                  </View>
                ) : (
                  <GiftedLineChart
                    data={giftedHoldData}
                    width={chartW}
                    height={140}
                    color={C.accent}
                    thickness={2.5}
                    curved
                    hideDataPoints={false}
                    dataPointsColor={C.accent}
                    dataPointsRadius={5}
                    areaChart
                    startFillColor={C.accent + '44'}
                    endFillColor="transparent"
                    startOpacity={0.35}
                    endOpacity={0}
                    backgroundColor={C.bgCard}
                    xAxisColor={C.border}
                    yAxisColor={C.border}
                    yAxisTextStyle={{ color: C.textMuted, fontSize: 9 }}
                    xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 8 }}
                    noOfSections={4}
                    yAxisSuffix="s"
                    isAnimated
                    animationDuration={800}
                    rulesColor={C.border}
                    rulesType="solid"
                    initialSpacing={8}
                    endSpacing={8}
                  />
                )}
              </View>

              {/* ── GRAPH B: Total Practice Minutes Per Week ─────────────── */}
              <View style={pg.chartCard}>
                <View style={pg.chartHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h4}>Weekly Practice Time</Text>
                    <Text style={[T.cap, { color: C.textMuted, marginTop: 2 }]}>Total minutes trained</Text>
                  </View>
                  {totalSessions > 0 && (
                    <View style={pg.pillBadge}>
                      <Text style={pg.pillText}>{avgPerWeek} sess/wk</Text>
                    </View>
                  )}
                </View>
                {totalSessions === 0 ? (
                  <View style={pg.emptyChart}>
                    <Text style={[T.small, { color: C.textMuted, textAlign: 'center' }]}>
                      Complete sessions to track your training time
                    </Text>
                  </View>
                ) : (
                  <GiftedBarChart
                    data={giftedMinsData}
                    width={chartW}
                    height={140}
                    barWidth={Math.max(10, Math.floor(chartW / 18))}
                    spacing={Math.max(3, Math.floor(chartW / 24))}
                    roundedTop
                    noOfSections={4}
                    xAxisColor={C.border}
                    yAxisColor={C.border}
                    yAxisTextStyle={{ color: C.textMuted, fontSize: 9 }}
                    xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 8 }}
                    yAxisSuffix="m"
                    isAnimated
                    animationDuration={800}
                    rulesColor={C.border}
                    backgroundColor={C.bgCard}
                    initialSpacing={6}
                    frontColor={C.accent}
                  />
                )}
              </View>

              {/* ── GRAPH C: Month-over-Month Hold Progress ──────────────── */}
              <View style={pg.chartCard}>
                <View style={pg.chartHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h4}>Top Improvements</Text>
                    <Text style={[T.cap, { color: C.textMuted, marginTop: 2 }]}>Monthly hold time growth</Text>
                  </View>
                </View>
                {monthlyProgress.length < 2 ? (
                  <View style={pg.emptyChart}>
                    <Text style={[T.small, { color: C.textMuted, textAlign: 'center' }]}>
                      Keep training for 2+ months to see improvements here!
                    </Text>
                  </View>
                ) : (() => {
                  const allBest    = Math.max(...monthlyProgress.map(m => m.best), 1);
                  const first      = monthlyProgress[0];
                  const last       = monthlyProgress[monthlyProgress.length - 1];
                  const overallPct = first.best > 0 ? Math.round(((last.best - first.best) / first.best) * 100) : 0;
                  return (
                    <View>
                      {overallPct !== 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md }}>
                          <Ionicons
                            name={overallPct > 0 ? 'trending-up' : 'trending-down'}
                            size={18}
                            color={overallPct > 0 ? C.success : C.error}
                          />
                          <Text style={{ color: overallPct > 0 ? C.success : C.error, fontWeight: '700', fontSize: 14 }}>
                            {overallPct > 0 ? '+' : ''}{overallPct}% overall improvement
                          </Text>
                        </View>
                      )}
                      {monthlyProgress.map((m, idx) => {
                        const barRatio = m.best / allBest;
                        const delta    = idx > 0 ? m.best - monthlyProgress[idx - 1].best : 0;
                        const isLatest = idx === monthlyProgress.length - 1;
                        return (
                          <View key={m.label} style={{ marginBottom: S.md }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={[T.small, { fontWeight: '700', color: isLatest ? C.accent : C.text }]}>{m.label}</Text>
                              <View style={{ flexDirection: 'row', gap: S.sm, alignItems: 'center' }}>
                                {idx > 0 && delta !== 0 && (
                                  <Text style={{ fontSize: 10, color: delta > 0 ? C.success : C.error, fontWeight: '700' }}>
                                    {delta > 0 ? '+' : ''}{delta}s
                                  </Text>
                                )}
                                <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>{m.best}s best</Text>
                                <Text style={[T.cap, { color: C.textMuted }]}>{m.count} holds</Text>
                              </View>
                            </View>
                            <View style={{ height: 8, backgroundColor: C.bgCardAlt, borderRadius: 4, overflow: 'hidden' }}>
                              <View style={{
                                width: `${Math.round(barRatio * 100)}%`,
                                height: '100%',
                                backgroundColor: isLatest ? C.accent : C.accent + '88',
                                borderRadius: 4,
                              }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}
              </View>

              {/* ── Activity heatmap ─────────────────────────────────────── */}
              <View style={pg.chartCard}>
                <View style={pg.chartHeader}>
                  <Text style={T.h4}>Training Activity</Text>
                  <Text style={[T.cap, { color: C.accent }]}>Last 12 weeks</Text>
                </View>
                <ContribHeatmap submissions={submissions} />
              </View>

              {/* ── Sessions per week (legacy bar chart) ──────────────────── */}
              <View style={pg.chartCard}>
                <View style={pg.chartHeader}>
                  <Text style={T.h4}>Sessions per Week</Text>
                  <Text style={[T.cap, { color: C.accent }]}>Last 8 weeks · Best: {bestWeek}</Text>
                </View>
                <BarChart data={weeklyData} color={C.accent} height={90} />
              </View>

              {/* ── Form score trend ─────────────────────────────────────── */}
              {(() => {
                const scored = submissions.filter(s => s.formScore != null).slice(0, 8).reverse();
                if (scored.length < 2) return null;
                const formData      = scored.map((s, i) => ({ label: `#${i + 1}`, value: s.formScore }));
                const latestScore   = scored[scored.length - 1]?.formScore ?? 0;
                const earliestScore = scored[0]?.formScore ?? 0;
                const delta         = latestScore - earliestScore;
                return (
                  <View style={pg.chartCard}>
                    <View style={pg.chartHeader}>
                      <Text style={T.h4}>Form Score</Text>
                      <Text style={[T.cap, { color: delta >= 0 ? C.success : C.error, fontWeight: '700' }]}>
                        {delta >= 0 ? '+' : ''}{delta}% vs first
                      </Text>
                    </View>
                    <LineChart data={formData} color={C.success} height={80} />
                    <Text style={[T.cap, { marginTop: S.sm, color: C.textMuted }]}>
                      Latest: {latestScore}% · Based on {scored.length} AI sessions
                    </Text>
                  </View>
                );
              })()}

              {/* ── Level progression timeline ────────────────────────────── */}
              <View style={pg.section}>
                <Text style={[T.h4, { marginBottom: S.sm }]}>Level Progression</Text>
                {levelTimeline.map((item, i) => (
                  <View key={item.level.id} style={pg.timelineRow}>
                    <View style={[pg.timelineDot, {
                      backgroundColor: item.done ? C.accent : C.bgCardAlt,
                      borderColor:     item.done ? C.accent : C.border,
                    }]}>
                      {item.done && <Ionicons name="checkmark" size={11} color={C.black} />}
                    </View>
                    {i < levelTimeline.length - 1 && (
                      <View style={[pg.timelineLine, { backgroundColor: item.done ? C.accent + '66' : C.border }]} />
                    )}
                    <View style={pg.timelineContent}>
                      <Text style={[T.h4, { fontSize: 13, color: item.done ? C.text : C.textMuted }]}>
                        Level {item.level.id} — {item.level.name}
                      </Text>
                      <Text style={[T.cap, { color: item.done ? C.accent : C.textMuted }]}>
                        {item.done ? '✓ Completed' : 'Not yet completed'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Badges & Achievements list intentionally hidden — earned
                  badges only appear as a surprise pop-up the moment they unlock,
                  never as a checklist. Keeps the rewards from feeling cheap. */}

              {/* Watermark — visible in screenshot */}
              <Text style={[T.cap, { textAlign: 'center', color: C.textMuted, marginBottom: S.md }]}>
                Made with HandstandHub 💪
              </Text>

            </>)}
          </Animated.View>
        </ViewShot>

        {/* Share button — outside ViewShot so it's not captured */}
        <TouchableOpacity
          style={[pg.shareBtn, sharing && { opacity: 0.6 }]}
          onPress={handleShare}
          activeOpacity={0.8}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color={C.black} size="small" />
          ) : (
            <>
              <Ionicons name="share-outline" size={18} color={C.black} style={{ marginRight: 8 }} />
              <Text style={pg.shareBtnText}>Share Progress</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      {/* No lock here — the forced paywall gates entry to the app, so anyone
          who reaches this screen already has an entitlement. */}
    </View>
  );
}

const pg = StyleSheet.create({
  header:          { paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  section:         { marginHorizontal: S.md, marginBottom: S.lg },
  statCard:        { width: 100, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 4 },
  statNum:         { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  statLabel:       { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, textAlign: 'center' },
  chartCard:       { marginHorizontal: S.md, marginBottom: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border },
  chartHeader:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: S.md },
  emptyChart:      { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyState:      { alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg, paddingVertical: S.xxl },
  pillBadge:       { backgroundColor: C.accent + '22', borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.accent + '44' },
  pillText:        { fontSize: 11, fontWeight: '700', color: C.accent },
  timelineRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md, position: 'relative' },
  timelineDot:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: 2 },
  timelineLine:    { position: 'absolute', left: 11, top: 26, width: 2, height: 28, zIndex: 0 },
  timelineContent: { flex: 1, paddingLeft: S.sm },
  badgeChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: R.lg, borderWidth: 1, width: (width - S.md * 2 - 8) / 2 },
  badgeChipEarned: { backgroundColor: C.accent + '18', borderColor: C.accent + '55' },
  badgeChipLocked: { backgroundColor: C.bgCardAlt, borderColor: C.border },
  shareBtn:        { marginHorizontal: S.md, marginTop: S.md, backgroundColor: C.accent, borderRadius: R.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  shareBtnText:    { fontSize: 15, fontWeight: '800', color: C.black },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2 – WEEKLY TRAINING PLAN
// ─────────────────────────────────────────────────────────────────────────────
const TRAINING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Structured programs ──────────────────────────────────────────────────────
const ACTIVE_PROGRAM_KEY  = 'active_program_id';
const PROGRAM_PROGRESS_KEY = 'program_progress';
const PROGRAM_START_KEY   = 'program_start_date';

const PROGRAMS = [
  {
    id: 'prog_a',
    title: '4 Weeks to First Hold',
    subtitle: 'Build your first freestanding kick-up from scratch',
    levelRange: [1, 2],
    weeks: [
      {
        weekNumber: 1, theme: 'Wrist Prep Foundations',
        days: [
          { dayNumber: 1, rest: false, title: 'Hollow & Wall Plank', items: [{ name: 'Wrist warm-up', sets: 1, detail: '5 min' }, { name: 'Hollow body hold', sets: 3, detail: '30 sec' }, { name: 'Wall plank', sets: 3, detail: '30 sec' }] },
          { dayNumber: 2, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 3, rest: false, title: 'Pike Push-ups & Wall Walks', items: [{ name: 'Wrist warm-up', sets: 1, detail: '5 min' }, { name: 'Pike push-ups', sets: 3, detail: '8 reps' }, { name: 'Wall walks', sets: 3, detail: '2 reps' }] },
          { dayNumber: 4, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 5, rest: false, title: 'Hollow Rocks & Wall Practice', items: [{ name: 'Wrist warm-up', sets: 1, detail: '5 min' }, { name: 'Hollow body rocks', sets: 3, detail: '20 reps' }, { name: 'Wall hold practice', sets: 5, detail: '1 attempt' }] },
          { dayNumber: 6, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 7, rest: true,  title: 'Rest', items: [] },
        ],
      },
      {
        weekNumber: 2, theme: 'Wall Holds',
        days: [
          { dayNumber: 1, rest: false, title: 'Wall Holds 15s', items: [{ name: 'Wrist prep', sets: 1, detail: '5 min' }, { name: 'Wall hold', sets: 5, detail: '15 sec' }, { name: 'Hollow body', sets: 3, detail: '30 sec' }] },
          { dayNumber: 2, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 3, rest: false, title: 'Kick-up Practice', items: [{ name: 'Wrist prep', sets: 1, detail: '5 min' }, { name: 'Kick-up practice', sets: 2, detail: '10 reps each leg' }, { name: 'Wall hold', sets: 5, detail: '20 sec' }] },
          { dayNumber: 4, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 5, rest: false, title: 'Wall Holds 30s', items: [{ name: 'Wall hold', sets: 5, detail: '30 sec' }, { name: 'Shoulder taps on wall', sets: 3, detail: '10 reps' }] },
          { dayNumber: 6, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 7, rest: true,  title: 'Rest', items: [] },
        ],
      },
      {
        weekNumber: 3, theme: 'Shoulder Engagement',
        days: [
          { dayNumber: 1, rest: false, title: 'Wall Holds & Shoulder Taps', items: [{ name: 'Wrist prep', sets: 1, detail: '5 min' }, { name: 'Wall hold', sets: 5, detail: '30 sec' }, { name: 'Shoulder taps', sets: 3, detail: '10 reps' }] },
          { dayNumber: 2, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 3, rest: false, title: 'Kick-ups & Long Holds', items: [{ name: 'Kick-up practice', sets: 2, detail: '10 reps each leg' }, { name: 'Wall hold', sets: 5, detail: '45 sec' }] },
          { dayNumber: 4, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 5, rest: false, title: 'Wall Taps Hollow', items: [{ name: 'Wall taps', sets: 3, detail: '10 reps' }, { name: 'Wall hold — stay hollow', sets: 5, detail: '30 sec' }] },
          { dayNumber: 6, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 7, rest: true,  title: 'Rest', items: [] },
        ],
      },
      {
        weekNumber: 4, theme: 'First Freestanding Attempts',
        days: [
          { dayNumber: 1, rest: false, title: 'Away From Wall', items: [{ name: 'Wrist prep', sets: 1, detail: '5 min' }, { name: 'Kick-up away from wall', sets: 2, detail: '10 attempts' }, { name: 'Wall hold', sets: 5, detail: '45 sec' }] },
          { dayNumber: 2, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 3, rest: false, title: 'Freestanding Reps', items: [{ name: 'Freestanding kick-up attempts', sets: 3, detail: '15 reps' }, { name: 'Wall taps', sets: 3, detail: '10 reps' }] },
          { dayNumber: 4, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 5, rest: false, title: 'Open Practice', items: [{ name: 'Freestanding open practice', sets: 1, detail: '15 min' }] },
          { dayNumber: 6, rest: true,  title: 'Rest', items: [] },
          { dayNumber: 7, rest: false, title: 'Test Day', items: [{ name: 'Longest wall handstand hold', sets: 1, detail: 'Record it!' }] },
        ],
      },
    ],
  },
  {
    id: 'prog_b',
    title: '8 Weeks to Freestanding',
    subtitle: 'Go from consistent wall holds to a 5-second freestand',
    levelRange: [3, 3],
    weeks: [
      { weekNumber: 1, theme: 'Kick-up Accuracy', days: [
        { dayNumber: 1, rest: false, title: 'Kick-up Drill', items: [{ name: 'Wrist warm-up', sets: 1, detail: '5 min' }, { name: 'Kick-up to wall', sets: 4, detail: '8 reps each leg' }, { name: 'Wall hold', sets: 5, detail: '30 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Shoulder Stack', items: [{ name: 'Shoulder shrugs in plank', sets: 3, detail: '10 reps' }, { name: 'Wall hold shoulder push', sets: 5, detail: '30 sec' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Kick-up + Tap', items: [{ name: 'Kick-up to wall + shoulder tap', sets: 3, detail: '10 reps' }, { name: 'Wall hold', sets: 5, detail: '30 sec' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 2, theme: 'Balance Finding', days: [
        { dayNumber: 1, rest: false, title: 'Chest-to-wall Holds', items: [{ name: 'Chest-to-wall handstand', sets: 5, detail: '20 sec' }, { name: 'Finger-tip pressure drill', sets: 3, detail: '20 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Away From Wall', items: [{ name: 'Kick-up 1 step from wall', sets: 4, detail: '10 reps' }, { name: 'Balance freeze attempts', sets: 3, detail: '5 attempts' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Balance', items: [{ name: 'Open freestand attempts', sets: 1, detail: '10 min' }, { name: 'Wall hold', sets: 5, detail: '45 sec' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 3, theme: 'Line & Alignment', days: [
        { dayNumber: 1, rest: false, title: 'Body Line Work', items: [{ name: 'Hollow body hold', sets: 4, detail: '30 sec' }, { name: 'Wall handstand hold hollow', sets: 5, detail: '30 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Hip Over Shoulders', items: [{ name: 'Hip placement drill', sets: 3, detail: '8 reps' }, { name: 'Freestand attempts', sets: 1, detail: '10 min' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Full Line Practice', items: [{ name: 'Straight line wall hold', sets: 5, detail: '45 sec' }, { name: 'Free attempts', sets: 1, detail: '10 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 4, theme: 'Micro-corrections', days: [
        { dayNumber: 1, rest: false, title: 'Finger Pressure', items: [{ name: 'Fingertip press drill', sets: 3, detail: '30 sec' }, { name: 'Freestand attempts', sets: 1, detail: '12 min' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Fall Practice', items: [{ name: 'Controlled cartwheel out', sets: 3, detail: '5 reps' }, { name: 'Pirouette out', sets: 3, detail: '5 reps' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Session', items: [{ name: 'Freestand open practice', sets: 1, detail: '15 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 5, theme: 'Consistency Building', days: [
        { dayNumber: 1, rest: false, title: 'Volume Day', items: [{ name: 'Kick-up sets', sets: 6, detail: '10 reps' }, { name: 'Freestand attempts', sets: 1, detail: '10 min' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Technical Day', items: [{ name: 'Video yourself', sets: 1, detail: '1 attempt' }, { name: 'Alignment corrections', sets: 3, detail: '45 sec wall hold' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Practice', items: [{ name: 'Freestand open', sets: 1, detail: '20 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 6, theme: 'Endurance Base', days: [
        { dayNumber: 1, rest: false, title: 'Long Holds', items: [{ name: 'Wall hold max effort', sets: 3, detail: 'Max time' }, { name: 'Freestand attempts', sets: 1, detail: '10 min' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Density Sets', items: [{ name: 'Freestand in 5 min AMRAP', sets: 1, detail: '5 min' }, { name: 'Wall hold', sets: 3, detail: '60 sec' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Session', items: [{ name: 'Open freestand practice', sets: 1, detail: '20 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 7, theme: 'Peak Training', days: [
        { dayNumber: 1, rest: false, title: 'Max Attempts', items: [{ name: 'Freestand max attempts', sets: 1, detail: '15 min' }, { name: 'Hollow body', sets: 4, detail: '30 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Quality Reps', items: [{ name: 'Slow kick-up drill', sets: 4, detail: '8 reps' }, { name: 'Hold to 3 sec', sets: 5, detail: '3 sec free' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Dress Rehearsal', items: [{ name: 'Full session open practice', sets: 1, detail: '20 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 8, theme: 'Freestanding Test', days: [
        { dayNumber: 1, rest: false, title: 'Light Warm-up', items: [{ name: 'Easy kick-up drill', sets: 3, detail: '8 reps' }, { name: 'Wall hold', sets: 3, detail: '30 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Open Practice', items: [{ name: 'Freestand open', sets: 1, detail: '20 min' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Test Day', items: [{ name: 'Best freestanding hold — record it', sets: 1, detail: 'Max time' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
    ],
  },
  {
    id: 'prog_c',
    title: '1-Minute Hold Pursuit',
    subtitle: 'Push past 15 seconds to a full 60-second freestand',
    levelRange: [4, 5],
    weeks: [
      { weekNumber: 1, theme: 'Baseline Assessment', days: [
        { dayNumber: 1, rest: false, title: 'Max Hold Test', items: [{ name: 'Warm-up', sets: 1, detail: '5 min' }, { name: 'Freestand max hold — record it', sets: 3, detail: 'Max time' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Body Line Audit', items: [{ name: 'Video your handstand', sets: 1, detail: '1 rep' }, { name: 'Straight body wall hold', sets: 5, detail: '60 sec' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Endurance Base', items: [{ name: 'Freestand attempts', sets: 1, detail: '15 min total' }, { name: 'Rest 30s between holds', sets: 1, detail: 'Note your times' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 2, theme: 'Compression & Control', days: [
        { dayNumber: 1, rest: false, title: 'Compression Drills', items: [{ name: 'Straddle compression holds', sets: 4, detail: '20 sec' }, { name: 'Freestand practice', sets: 1, detail: '10 min' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Shoulder Endurance', items: [{ name: 'Wall hold — eyes closed', sets: 3, detail: '30 sec' }, { name: 'Freestand holds', sets: 5, detail: 'Max each' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Full Session', items: [{ name: 'Freestand density: hold as many sec as possible in 10 min', sets: 1, detail: '10 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 3, theme: 'Micro-corrections at Depth', days: [
        { dayNumber: 1, rest: false, title: 'Pressure Awareness', items: [{ name: 'Fingertip balance drill', sets: 4, detail: '20 sec' }, { name: 'Freestand holds', sets: 1, detail: '15 min' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Slow Entry', items: [{ name: 'Slow controlled kick-up', sets: 5, detail: '5 reps' }, { name: 'Hold to 20 sec', sets: 5, detail: '20 sec free' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Session', items: [{ name: 'Freestand open practice', sets: 1, detail: '20 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 4, theme: 'Volume Push', days: [
        { dayNumber: 1, rest: false, title: 'High Volume', items: [{ name: 'Freestand attempts', sets: 1, detail: '20 min' }, { name: 'Wall hold endurance', sets: 3, detail: '90 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Hold 30s', items: [{ name: 'Target: hold 30 sec free', sets: 5, detail: '30 sec' }, { name: 'Log times', sets: 1, detail: 'Note best' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Open Session', items: [{ name: 'Open freestand', sets: 1, detail: '25 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 5, theme: 'Deload & Sharpen', days: [
        { dayNumber: 1, rest: false, title: 'Easy Day', items: [{ name: 'Light kick-ups', sets: 3, detail: '5 reps' }, { name: 'Wall hold easy', sets: 3, detail: '30 sec' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Technique Only', items: [{ name: 'Slow entry drill', sets: 5, detail: '5 reps' }, { name: 'Video review hold', sets: 1, detail: '1 rep' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Easy Practice', items: [{ name: 'Open freestand light', sets: 1, detail: '15 min' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
      { weekNumber: 6, theme: '60-Second Test Week', days: [
        { dayNumber: 1, rest: false, title: 'Prime', items: [{ name: 'Warm-up full', sets: 1, detail: '10 min' }, { name: 'Freestand holds', sets: 3, detail: '20 sec each' }] },
        { dayNumber: 2, rest: true, title: 'Rest', items: [] },
        { dayNumber: 3, rest: false, title: 'Final Practice', items: [{ name: 'Open freestand — go for 45 sec', sets: 1, detail: '20 min' }] },
        { dayNumber: 4, rest: true, title: 'Rest', items: [] },
        { dayNumber: 5, rest: false, title: 'Test Day', items: [{ name: '60-second hold attempt — record it', sets: 1, detail: 'Max time' }] },
        { dayNumber: 6, rest: true, title: 'Rest', items: [] },
        { dayNumber: 7, rest: true, title: 'Rest', items: [] },
      ]},
    ],
  },
];

function levelToProgram(level) {
  if (level <= 2) return 'prog_a';
  if (level === 3) return 'prog_b';
  return 'prog_c';
}

async function loadProgramState() {
  try {
    const [pid, raw_prog, raw_start] = await AsyncStorage.multiGet(
      [ACTIVE_PROGRAM_KEY, PROGRAM_PROGRESS_KEY, PROGRAM_START_KEY]
    ).then(pairs => pairs.map(([, v]) => v));
    return {
      activeProgramId: pid || null,
      progress: raw_prog ? JSON.parse(raw_prog) : {},
      startDate: raw_start || null,
    };
  } catch (_) { return { activeProgramId: null, progress: {}, startDate: null }; }
}

async function saveProgramState({ activeProgramId, progress, startDate }) {
  try {
    await AsyncStorage.multiSet([
      [ACTIVE_PROGRAM_KEY,   activeProgramId || ''],
      [PROGRAM_PROGRESS_KEY, JSON.stringify(progress)],
      [PROGRAM_START_KEY,    startDate || ''],
    ]);
  } catch (_) {}
}

// Returns 0-based week index based on start date (date-driven, not completion-driven)
function currentWeekIndex(startDate) {
  if (!startDate) return 0;
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  return Math.max(0, Math.floor(diff / 7));
}

// Day key used in completedDays set: "w1d3"
function dayKey(weekNum, dayNum) { return `w${weekNum}d${dayNum}`; }

// Get today's 0-based day-of-week index Mon=0..Sun=6
function todayDayIndex() { return (new Date().getDay() + 6) % 7; }


const DEFAULT_PLAN = {
  trainingDays: [1, 3, 5],  // Mon=0 … Sun=6 indices
  startDate:    null,       // ISO date of the Monday plan was created
  weekOffset:   0,          // which program week the user is on (0-indexed)
  completedSessions: {},    // { 'YYYY-MM-DD': true }
};

// Each week block has 4 phases. weekOffset 0-3 progressively harder.
const PROGRAM_WEEKS = [
  {
    label: 'Week 1 — Foundation',
    focus: 'Build base strength and body awareness',
    sessions: [
      { phase: '🤸 Warm-Up',       exercises: ['Wrist circles (10 each direction)', 'Cat-cow x 10', 'Shoulder rolls x 10'] },
      { phase: '🎯 Skill Work',     exercises: ['Hollow body hold 3×20s', 'Extended plank 3×30s', 'Pike hold 3×30s'] },
      { phase: '💪 Conditioning',   exercises: ['Push-ups 3×10', 'Plank 3×30s', 'Dead hang 3×15s'] },
      { phase: '🧘 Cool-Down',      exercises: ['Child\'s pose 30s', 'Chest opener 30s', 'Wrist flexor stretch 30s each'] },
    ],
  },
  {
    label: 'Week 2 — Wall Work',
    focus: 'Get comfortable inverted against the wall',
    sessions: [
      { phase: '🤸 Warm-Up',       exercises: ['Wrist circles (10 each direction)', 'Shoulder circles x 10', 'Scapular push-ups x 10'] },
      { phase: '🎯 Skill Work',     exercises: ['Wall walks 3×5 reps', 'Chest-to-wall HS 5×15s', 'Toe pulls 3×8 each'] },
      { phase: '💪 Conditioning',   exercises: ['Pike push-ups 3×8', 'Elevated plank 3×30s', 'Hollow rocks 3×10'] },
      { phase: '🧘 Cool-Down',      exercises: ['Downward dog 45s', 'Doorway chest stretch 30s', 'Wrist extension stretch 30s each'] },
    ],
  },
  {
    label: 'Week 3 — Balance Drills',
    focus: 'Find your balance point away from the wall',
    sessions: [
      { phase: '🤸 Warm-Up',       exercises: ['Full wrist warm-up (app)', 'Band pull-aparts x 15', 'Handstand shape drill 3×20s'] },
      { phase: '🎯 Skill Work',     exercises: ['Crow pose 5× max hold', 'HS kick-up attempts 5×', 'Wall HS shoulder taps 3×5 each'] },
      { phase: '💪 Conditioning',   exercises: ['Ring rows or pull-ups 3×8', 'L-sit hold 3×10s', 'Tuck planche 3×10s'] },
      { phase: '🧘 Cool-Down',      exercises: ['Pigeon pose 45s each', 'Thoracic rotation 10 each', 'Wrist prayer stretch 30s'] },
    ],
  },
  {
    label: 'Week 4 — Freestanding',
    focus: 'Push for freestanding seconds',
    sessions: [
      { phase: '🤸 Warm-Up',       exercises: ['Full wrist warm-up (app)', 'Dynamic shoulder warm-up', 'Hollow-arch rock 10 reps'] },
      { phase: '🎯 Skill Work',     exercises: ['Freestanding HS attempts 10×', 'Elevated pike press 3×30s', 'Single-arm wall HS shifts 3×5'] },
      { phase: '💪 Conditioning',   exercises: ['Weighted pike push-ups 3×8', 'Dragon flag negatives 3×5', 'Ring support hold 3×15s'] },
      { phase: '🧘 Cool-Down',      exercises: ['Doorway pec stretch 30s', 'Lat stretch 30s each', 'Full wrist cool-down'] },
    ],
  },
];

const REST_ACTIVITIES = [
  { icon: '🔄', title: 'Wrist Mobility', desc: '5 min circles, flexion, extension — use the app!' },
  { icon: '🧘', title: 'Hip Flexor Stretch', desc: 'Kneeling lunge 60s each side, 2 sets' },
  { icon: '🌀', title: 'Thoracic Rotation', desc: '10 reps each side, seated on floor, open chest fully' },
  { icon: '🏃', title: 'Light Walk', desc: '15–20 min easy outdoor walk for blood flow' },
  { icon: '💤', title: 'Sleep Hygiene', desc: 'Aim for 8h — most handstand strength gains come during sleep' },
];

async function loadPlan() {
  try {
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    if (raw) return { ...DEFAULT_PLAN, ...JSON.parse(raw) };
    return null;
  } catch (_) { return null; }
}

async function savePlan(plan) {
  try { await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch (_) {}
}

function getThisMonday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getPlanWeekOffset(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now   = new Date();
  const diffDays = Math.floor((now - start) / 86400000);
  return Math.min(Math.floor(diffDays / 7), PROGRAM_WEEKS.length - 1);
}

function isTodayTrainingDay(trainingDays) {
  const d = new Date().getDay(); // 0=Sun
  const idx = (d + 6) % 7;      // convert to Mon=0
  return trainingDays.includes(idx);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: ProLockOverlay — sneak-peek lock for Pro-gated screens
// ─────────────────────────────────────────────────────────────────────────────
function ProLockOverlay({ featureLabel, featureIcon }) {
  const { showPaywall } = useContext(PurchaseContext);
  return (
    <View style={pl.overlay}>
      <View style={pl.card}>
        {/* Icon circle with lock badge */}
        <View style={pl.iconWrap}>
          <View style={pl.iconCircle}>
            <Text style={{ fontSize: 42 }}>{featureIcon}</Text>
          </View>
          <View style={pl.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={C.accent} />
          </View>
        </View>

        <Text style={[T.h2, { textAlign: 'center', marginTop: S.lg }]}>
          Unlock {featureLabel}
        </Text>
        <Text style={[T.body, { color: C.textMuted, textAlign: 'center', marginTop: S.xs, lineHeight: 20 }]}>
          Get full access with HandstandHub Pro
        </Text>

        <TouchableOpacity
          style={pl.ctaBtn}
          onPress={() => showPaywall('level_lock', featureLabel)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={G.accent} style={pl.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="star" size={15} color={C.black} />
            <Text style={[T.h4, { color: C.black, fontSize: 15, fontWeight: '900' }]}>Upgrade to Pro</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[T.small, { color: C.textMuted, marginTop: S.sm }]}>
          7-day free trial · Cancel anytime
        </Text>
      </View>
    </View>
  );
}

const pl = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,17,23,0.82)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  card:        { backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.xl, marginHorizontal: S.xl, borderWidth: 1, borderColor: C.border, alignItems: 'center', width: '85%' },
  iconWrap:    { position: 'relative', marginBottom: S.xs },
  iconCircle:  { width: 88, height: 88, borderRadius: 44, backgroundColor: C.bgDeep, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  lockBadge:   { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: C.accentDim, borderWidth: 1.5, borderColor: C.accent + '88', alignItems: 'center', justifyContent: 'center' },
  ctaBtn:      { width: '100%', borderRadius: R.xl, overflow: 'hidden', marginTop: S.lg },
  ctaGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
});

function WeeklyPlanScreen({ navigation }) {
  const insets  = useSafeAreaInsets();
  const { progress } = useContext(UserProgressContext);
  const { isPro, hasActiveEntitlement } = useContext(PurchaseContext);

  // ── Program state ──────────────────────────────────────────────────────────
  const [loading,          setLoading]          = useState(true);
  const [activeProgramId,  setActiveProgramId]  = useState(null);
  const [progProgress,     setProgProgress]     = useState({});  // { programId: Set<dayKey> }
  const [startDate,        setStartDate]        = useState(null);
  const [selectedDay,      setSelectedDay]      = useState(null); // { week, day } for modal
  const [switchModal,      setSwitchModal]      = useState(false);
  const [switchTarget,     setSwitchTarget]     = useState(null);

  // ── Fallback plan state (kept for backwards-compat) ────────────────────────
  const [plan, setPlanState] = useState(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      // Load legacy plan
      const loaded = await loadPlan();
      if (loaded) { setPlanState(loaded); }
      else { const m = getThisMonday(); const f = { ...DEFAULT_PLAN, startDate: m }; savePlan(f); setPlanState(f); }

      // Load program state
      const ps = await loadProgramState();
      let pid = ps.activeProgramId;
      let sd  = ps.startDate;

      // Auto-assign on first visit
      if (!pid) {
        const level = parseInt(await AsyncStorage.getItem(QUIZ_LEVEL_KEY) || '1', 10) || progress.currentLevel || 1;
        pid = levelToProgram(level);
        sd  = new Date().toISOString().slice(0, 10);
        await saveProgramState({ activeProgramId: pid, progress: ps.progress, startDate: sd });
      }

      setActiveProgramId(pid);
      setProgProgress(ps.progress);
      setStartDate(sd);
      setLoading(false);
    })();
  }, []));

  // ── Derived values ─────────────────────────────────────────────────────────
  const program     = PROGRAMS.find(p => p.id === activeProgramId) || PROGRAMS[0];
  const weekIdx     = Math.min(currentWeekIndex(startDate), program.weeks.length - 1);
  const currentWeek = program.weeks[weekIdx];
  const todayDIdx   = todayDayIndex(); // 0=Mon…6=Sun
  const todayDayObj = currentWeek?.days[todayDIdx] || null;
  const completedSet= new Set(progProgress[activeProgramId] || []);
  const todayKey    = todayDayObj ? dayKey(currentWeek.weekNumber, todayDayObj.dayNumber) : null;
  const todayDone   = todayKey ? completedSet.has(todayKey) : false;

  // ── Actions ────────────────────────────────────────────────────────────────
  const markDayComplete = async (week, day) => {
    const k = dayKey(week.weekNumber, day.dayNumber);
    const next = new Set(completedSet);
    next.add(k);
    const nextProgress = { ...progProgress, [activeProgramId]: [...next] };
    setProgProgress(nextProgress);
    await saveProgramState({ activeProgramId, progress: nextProgress, startDate });
    setSelectedDay(null);
    Vibration.vibrate(30);
  };

  const confirmSwitchProgram = async (targetId) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextProgress = { ...progProgress, [targetId]: [] };
    setActiveProgramId(targetId);
    setProgProgress(nextProgress);
    setStartDate(today);
    setSwitchModal(false);
    setSwitchTarget(null);
    await saveProgramState({ activeProgramId: targetId, progress: nextProgress, startDate: today });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg }}>
        <HandstandLoader message="Getting things ready…" />
      </View>
    );
  }

  const totalWeeks    = program.weeks.length;
  const barValue      = totalWeeks > 1 ? (weekIdx) / (totalWeeks - 1) : 1;
  const completedDays = (progProgress[activeProgramId] || []).length;
  const totalDays     = program.weeks.reduce((sum, w) => sum + w.days.filter(d => !d.rest).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={wp.header}>
          <View>
            <Text style={[T.label, { color: C.accent }]}>YOUR PROGRAM</Text>
            <Text style={[T.h2, { fontSize: 26, fontWeight: '900' }]}>{program.title}</Text>
          </View>
          <View style={[wp.weekBadge, { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]}>
            <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Wk {weekIdx + 1}/{totalWeeks}</Text>
          </View>
        </View>

        {/* ── Active Program Card ── */}
        <View style={wp.programCard}>
          <LinearGradient colors={['#1C1D21', '#16171A']} style={wp.programGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[T.label, { color: C.accent, marginBottom: S.xs }]}>WEEK {weekIdx + 1} — {currentWeek?.theme?.toUpperCase()}</Text>
            <ProgressBar value={barValue} color={C.accent} height={4} style={{ marginBottom: S.sm }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[T.cap, { color: C.textSub }]}>{completedDays} of {totalDays} sessions done</Text>
              <Text style={[T.cap, { color: C.textMuted }]}>{program.subtitle}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Today's Session Hero ── */}
        {todayDayObj && !todayDayObj.rest && !todayDone && (
          <View style={wp.todayHero}>
            <LinearGradient colors={[C.accentDim, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={[T.label, { color: C.accent, marginBottom: S.xs }]}>TODAY'S SESSION</Text>
            <Text style={[T.h3, { marginBottom: S.xs }]}>{todayDayObj.title}</Text>
            <Text style={[T.small, { color: C.textSub, marginBottom: S.md }]}>
              {todayDayObj.items.length} exercise{todayDayObj.items.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={wp.startBtn}
              onPress={() => setSelectedDay({ week: currentWeek, day: todayDayObj })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={wp.startGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="play" size={16} color={C.black} />
                <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>START TODAY'S SESSION</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {todayDayObj?.rest && (
          <View style={[wp.restHero, { borderColor: C.border }]}>
            <Ionicons name="moon" size={32} color={C.accent} />
            <View style={{ flex: 1, marginLeft: S.md }}>
              <Text style={T.h4}>Rest Day</Text>
              <Text style={[T.small, { color: C.textSub }]}>Recovery is part of training. See you tomorrow.</Text>
            </View>
          </View>
        )}

        {todayDone && (
          <View style={[wp.restHero, { borderColor: C.accent + '44', backgroundColor: C.accentDim }]}>
            <Ionicons name="checkmark-circle" size={32} color={C.accent} />
            <View style={{ flex: 1, marginLeft: S.md }}>
              <Text style={T.h4}>Session Complete!</Text>
              <Text style={[T.small, { color: C.textSub }]}>Great work. Come back tomorrow.</Text>
            </View>
          </View>
        )}

        {/* ── Week Day Strip ── */}
        <View style={{ paddingHorizontal: S.md, marginTop: S.lg }}>
          <Text style={[T.h4, { marginBottom: S.sm }]}>This Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {currentWeek?.days.map((day, idx) => {
              const dk = dayKey(currentWeek.weekNumber, day.dayNumber);
              const done = completedSet.has(dk);
              const isToday = idx === todayDIdx;
              const isPast  = idx < todayDIdx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    wp.dayCard,
                    isToday && !day.rest && wp.dayCardToday,
                    done && wp.dayCardDone,
                    day.rest && wp.dayCardRest,
                  ]}
                  onPress={() => !day.rest && setSelectedDay({ week: currentWeek, day })}
                  activeOpacity={day.rest ? 1 : 0.8}
                >
                  <Text style={[T.cap, { fontSize: 9, color: isToday ? C.accent : C.textMuted, fontWeight: isToday ? '900' : '400' }]}>{TRAINING_DAYS[idx]}</Text>
                  {done
                    ? <Ionicons name="checkmark-circle" size={20} color={C.accent} style={{ marginVertical: 4 }} />
                    : day.rest
                      ? <Ionicons name="moon-outline" size={20} color={C.textMuted} style={{ marginVertical: 4 }} />
                      : <View style={[wp.dayDot, { backgroundColor: isToday ? C.accent : isPast ? C.border : C.border }]} />
                  }
                  <Text style={[{ fontSize: 9, textAlign: 'center', color: done ? C.accent : day.rest ? C.textMuted : isToday ? C.text : C.textMuted, fontWeight: isToday || done ? '700' : '400' }]} numberOfLines={2}>
                    {day.rest ? 'Rest' : day.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Week List ── */}
        <View style={{ paddingHorizontal: S.md, marginTop: S.xl }}>
          <Text style={[T.h4, { marginBottom: S.sm }]}>Program Overview</Text>
          {program.weeks.map((w, i) => {
            const isPast    = i < weekIdx;
            const isCurrent = i === weekIdx;
            const weeksCompletedDays = w.days.filter(d => !d.rest && completedSet.has(dayKey(w.weekNumber, d.dayNumber))).length;
            const weekTotal = w.days.filter(d => !d.rest).length;
            return (
              <View key={i} style={[wp.weekPill, isCurrent && { backgroundColor: C.accentDim, borderColor: C.accent + '55' }, isPast && { borderColor: C.success + '44' }]}>
                <Ionicons
                  name={isPast ? 'checkmark-circle' : isCurrent ? 'radio-button-on' : 'ellipse-outline'}
                  size={14}
                  color={isPast ? C.success : isCurrent ? C.accent : C.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[T.cap, { color: isCurrent || isPast ? C.text : C.textMuted, fontWeight: isCurrent ? '800' : '400' }]}>
                    Week {w.weekNumber} — {w.theme}
                  </Text>
                  {isCurrent && (
                    <Text style={[T.cap, { color: C.accent, fontSize: 10 }]}>{weeksCompletedDays}/{weekTotal} sessions done</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Switch Program ── */}
        <View style={{ paddingHorizontal: S.md, marginTop: S.xl }}>
          <TouchableOpacity
            onPress={() => setSwitchModal(true)}
            style={wp.switchLink}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={14} color={C.textMuted} />
            <Text style={[T.cap, { color: C.textMuted }]}>Browse other programs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Day Detail Modal ── */}
      <Modal visible={!!selectedDay} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedDay(null)}>
        {selectedDay && (
          <View style={{ flex: 1, backgroundColor: C.bg }}>
            <LinearGradient colors={[C.bg, '#0D0D0F']} style={StyleSheet.absoluteFill} />
            <View style={wp.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedDay(null)} style={wp.modalClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={C.text} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: S.sm }}>
                <Text style={[T.label, { color: C.accent }]}>WEEK {selectedDay.week.weekNumber} · DAY {selectedDay.day.dayNumber}</Text>
                <Text style={[T.h3, { marginTop: 2 }]}>{selectedDay.day.title}</Text>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 120 }}>
              {selectedDay.day.items.map((item, i) => (
                <View key={i} style={wp.itemRow}>
                  <View style={wp.itemBullet} />
                  <View style={{ flex: 1 }}>
                    <Text style={[T.h4, { fontSize: 15 }]}>{item.name}</Text>
                    <Text style={[T.cap, { color: C.textSub, marginTop: 2 }]}>
                      {item.sets > 1 ? `${item.sets} sets` : ''}{item.sets > 1 && item.detail ? ' · ' : ''}{item.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ paddingHorizontal: S.md, paddingBottom: insets.bottom + S.lg }}>
              {completedSet.has(dayKey(selectedDay.week.weekNumber, selectedDay.day.dayNumber)) ? (
                <View style={[wp.doneTag]}>
                  <Ionicons name="checkmark-circle" size={18} color={C.accent} />
                  <Text style={[T.h4, { color: C.accent }]}>Session complete</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={wp.markBtn}
                  onPress={() => markDayComplete(selectedDay.week, selectedDay.day)}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={G.accent} style={wp.markGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark" size={18} color={C.black} />
                    <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Mark Complete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* ── Switch Program Modal ── */}
      <Modal visible={switchModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSwitchModal(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <LinearGradient colors={[C.bg, '#0D0D0F']} style={StyleSheet.absoluteFill} />
          <View style={wp.modalHeader}>
            <TouchableOpacity onPress={() => setSwitchModal(false)} style={wp.modalClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={[T.h3, { marginLeft: S.sm }]}>Choose Program</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 60 }}>
            {PROGRAMS.map(prog => {
              const isActive = prog.id === activeProgramId;
              return (
                <TouchableOpacity
                  key={prog.id}
                  style={[wp.progCard, isActive && { borderColor: C.accent, backgroundColor: C.accentDim }]}
                  onPress={() => {
                    if (isActive) { setSwitchModal(false); return; }
                    setSwitchTarget(prog.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[T.h4, { color: isActive ? C.accent : C.text }]}>{prog.title}</Text>
                    <Text style={[T.cap, { color: C.textSub, marginTop: 2 }]}>{prog.subtitle}</Text>
                    <Text style={[T.cap, { color: C.textMuted, marginTop: 2 }]}>{prog.weeks.length} weeks · Levels {prog.levelRange[0]}–{prog.levelRange[1]}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Confirm Switch ── */}
      <Modal visible={!!switchTarget} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.lg, width: '100%', borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.h3, { textAlign: 'center', marginBottom: S.sm }]}>Switch Program?</Text>
            <Text style={[T.body, { textAlign: 'center', marginBottom: S.lg }]}>
              Switching will reset your progress on the current program.
            </Text>
            <TouchableOpacity style={[wp.markBtn, { marginBottom: S.sm }]} onPress={() => confirmSwitchProgram(switchTarget)} activeOpacity={0.85}>
              <LinearGradient colors={G.accent} style={wp.markGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontWeight: '900' }]}>Switch Program</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSwitchTarget(null)} style={{ alignItems: 'center', padding: S.sm }} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No lock here — the forced paywall gates entry to the app, so anyone
          who reaches this screen already has an entitlement. */}
    </View>
  );
}

const wp = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  weekBadge:     { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.full, borderWidth: 1 },
  programCard:   { marginHorizontal: S.md, marginBottom: S.md, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  programGrad:   { padding: S.lg },
  todayHero:     { marginHorizontal: S.md, marginBottom: S.md, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.accent + '44', overflow: 'hidden' },
  restHero:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: S.md, marginBottom: S.md, padding: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1 },
  startBtn:      { borderRadius: R.xxl, overflow: 'hidden', alignSelf: 'flex-start' },
  startGrad:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, paddingVertical: S.sm + 2 },
  dayCard:       { width: 68, alignItems: 'center', backgroundColor: C.bgCard, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: S.sm, gap: 2 },
  dayCardToday:  { borderColor: C.accent, backgroundColor: C.accentDim },
  dayCardDone:   { borderColor: C.accent + '66' },
  dayCardRest:   { opacity: 0.5 },
  dayDot:        { width: 8, height: 8, borderRadius: 4, marginVertical: 4 },
  weekPill:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.sm + 2, backgroundColor: C.bgCard, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  switchLink:    { flexDirection: 'row', alignItems: 'center', gap: S.xs, alignSelf: 'center', paddingVertical: S.sm },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', padding: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  modalClose:    { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  itemRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  itemBullet:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginTop: 7 },
  doneTag:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, padding: S.md },
  markBtn:       { borderRadius: R.xxl, overflow: 'hidden' },
  markGrad:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
  progCard:      { backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: S.md, marginBottom: S.sm, flexDirection: 'row', alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW MODE — banner + gate wrapper
// ─────────────────────────────────────────────────────────────────────────────

function PreviewBanner() {
  const { isPreview, triggerGate } = useContext(PreviewContext);
  const insets = useSafeAreaInsets();
  // Slide-off value must be large enough to clear the banner height + top inset
  const BANNER_HEIGHT = 44;
  const slideOff = -(BANNER_HEIGHT + insets.top + 8);
  const slideAnim = useRef(new Animated.Value(slideOff)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isPreview ? 0 : slideOff,
      tension: 80, friction: 12, useNativeDriver: true,
    }).start();
  }, [isPreview, slideOff]);

  if (!isPreview) return null;
  return (
    <Animated.View style={[pv.bannerWrap, { paddingTop: insets.top, transform: [{ translateY: slideAnim }] }]}>
      <View style={pv.bannerRow}>
        <View style={pv.bannerDot} />
        <Text style={pv.bannerText}>Preview mode — Sign up to save your progress</Text>
        <TouchableOpacity onPress={triggerGate} activeOpacity={0.8} style={pv.bannerBtn}>
          <Text style={pv.bannerBtnText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}


const pv = StyleSheet.create({
  bannerWrap:    { backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.accent + '40' },
  bannerRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: 10, gap: S.sm },
  bannerDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  bannerText:    { flex: 1, fontSize: 12, color: C.textSub, fontWeight: '500' },
  bannerBtn:     { backgroundColor: C.accent, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 4 },
  bannerBtnText: { fontSize: 11, fontWeight: '900', color: C.black },
});

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP GATE MODAL — shown after preview triggers (step 5 of new flow)
// ─────────────────────────────────────────────────────────────────────────────

const USER_EMAIL_KEY = 'user_email';

function SignupGateModal({ visible, assignedLevel, onComplete }) {
  const insets = useSafeAreaInsets();
  const [nameInput,  setNameInput]  = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [nameFocus,  setNameFocus]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const canSubmit = nameInput.trim().length > 0 && isValidEmail(emailInput);

  const handleContinue = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const name  = cleanDisplayName(nameInput);
      const email = cleanEmail(emailInput);
      // PII → SecureStore. Non-PII flag → AsyncStorage.
      await Promise.all([
        sensitiveStore.set(USER_NAME_KEY,  name),
        sensitiveStore.set(USER_EMAIL_KEY, email),
        AsyncStorage.setItem(SIGNUP_COMPLETE_KEY, 'true'),
      ]);
      // Persist name into progress store
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, userName: name }));
      }
      // Fire magic-link signup to Supabase — best-effort, app continues even if it fails.
      // The user gets a confirmation email; clicking it establishes a real session.
      if (supabase) {
        supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { display_name: name },
            emailRedirectTo: AUTH_REDIRECT_URL,
          },
        }).catch(err => console.warn('Signup gate: OTP send failed', err));
      }
      onComplete(name);
    } catch (e) {
      console.warn('Signup gate: save failed', e);
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent={false} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={[C.bg, '#0D0D0F', C.bg]} style={StyleSheet.absoluteFill} />
        <View style={sg.decoTop} />
        <View style={sg.decoBot} />

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={sg.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={[{ opacity: fadeAnim }]}
        >
          {/* Header */}
          <View style={sg.header}>
            <View style={sg.logoBg}>
              <HandstandFigure size={120} />
            </View>
            <Text style={[T.label, { color: C.accent, marginTop: S.lg, marginBottom: S.xs }]}>SAVE YOUR PROGRESS</Text>
            <Text style={[T.h2, { textAlign: 'center', marginBottom: S.xs }]}>Don't lose your Day 1 streak</Text>
          </View>

          {/* Founder's note */}
          <View style={sg.founderCard}>
            <Text style={sg.founderKicker}>A NOTE FROM THE FOUNDER</Text>
            <Text style={sg.founderBody}>
              Hey — I built HandstandHub because I spent 3 years failing my first freestanding hold.
              Every drill here is one that actually worked. Let's get you there faster.
            </Text>
            <Text style={sg.founderSig}>— Founder</Text>
          </View>

          {/* Form */}
          <View style={sg.form}>
            <TextInput
              style={[sg.input, nameFocus && sg.inputFocused]}
              value={nameInput}
              onChangeText={setNameInput}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              placeholder="Your name"
              placeholderTextColor={C.textMuted}
              maxLength={30}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              style={[sg.input, emailFocus && sg.inputFocused]}
              value={emailInput}
              onChangeText={setEmailInput}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="Email address"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />

            <TouchableOpacity
              style={[sg.primaryBtn, (!canSubmit || loading) && { opacity: 0.4 }]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!canSubmit || loading}
            >
              <LinearGradient colors={G.accent} style={sg.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color={C.black} size="small" />
                  : <>
                      <Text style={sg.primaryLabel}>Continue</Text>
                      <Ionicons name="arrow-forward" size={18} color={C.black} />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={sg.comingSoon}>We'll add Apple and Google sign-in soon</Text>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sg = StyleSheet.create({
  content:      { alignItems: 'center', paddingHorizontal: S.lg, paddingBottom: S.xl },
  header:       { alignItems: 'center', paddingTop: S.xl },
  logoBg:       { alignItems: 'center', justifyContent: 'center' },
  decoTop:      { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: C.accent + '07', top: -80, right: -80 },
  decoBot:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: C.accent + '05', bottom: 60, left: -50 },
  form:         { width: '100%', marginTop: S.xl, gap: S.sm },
  input:        { backgroundColor: C.bgCard, borderRadius: R.xl, paddingHorizontal: S.md, paddingVertical: S.md + 2, fontSize: 16, color: C.text, borderWidth: 1.5, borderColor: C.border },
  inputFocused: { borderColor: C.accent },
  primaryBtn:   { borderRadius: R.xxl, overflow: 'hidden', marginTop: S.xs },
  primaryGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
  primaryLabel: { fontSize: 15, fontWeight: '900', color: C.black, textTransform: 'uppercase' },
  comingSoon:   { textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: S.md },
  founderCard:  { width: '100%', marginTop: S.lg, padding: S.md, borderRadius: R.xl, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.accent + '33', borderLeftWidth: 3, borderLeftColor: C.accent },
  founderKicker:{ fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: C.accent, marginBottom: 6 },
  founderBody:  { fontSize: 13, color: C.text, lineHeight: 20, fontStyle: 'italic' },
  founderSig:   { fontSize: 14, color: C.accent, fontWeight: '700', marginTop: 8, fontStyle: 'italic' },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS STEP — shown after signup (step 6 of new flow)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DELIGHTFUL LOADER — replaces plain spinners with a rotating handstand frame
// ─────────────────────────────────────────────────────────────────────────────
const LOADER_TIPS = [
  'Did you know? Your wrists carry ~2× your body weight in a handstand.',
  'Pro tip: Spread your fingers wide — grip starts at the fingertips.',
  'Looking forward (not down) keeps the shoulders stacked.',
  'Squeeze your butt — a hollow body is a balanced body.',
  'Breathing slow keeps your balance ring smaller.',
];
const LOADER_FRAMES = ['🧍', '🤸', '🙆'];

function HandstandLoader({ message = 'Working on it…', compact = false }) {
  const [frame, setFrame] = useState(0);
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * LOADER_TIPS.length));
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1600, useNativeDriver: true })).start();
    const f = setInterval(() => setFrame(i => (i + 1) % LOADER_FRAMES.length), 600);
    const t = setInterval(() => setTipIdx(i => (i + 1) % LOADER_TIPS.length), 4000);
    return () => { clearInterval(f); clearInterval(t); spin.stopAnimation(); };
  }, []);
  const size = compact ? 56 : 90;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: compact ? 8 : 14 }}>
      <Animated.View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 3, borderColor: C.accent + '33', borderTopColor: C.accent,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }}>
        <Text style={{ fontSize: compact ? 22 : 36 }}>{LOADER_FRAMES[frame]}</Text>
      </Animated.View>
      {message && <Text style={[T.body, { color: C.text, fontWeight: '700', textAlign: 'center' }]}>{message}</Text>}
      {!compact && (
        <Text style={[T.cap, { color: C.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 16 }]} numberOfLines={2}>
          {LOADER_TIPS[tipIdx]}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRST DRILL SCREEN — 30-sec wrist wake-up before signup gate
// ─────────────────────────────────────────────────────────────────────────────
const FIRST_DRILL_CUES = [
  'Spread your fingers wide',
  'Press the pads into the floor',
  'Shift weight side to side',
  'Rock forward, then back',
  'Breathe — deep and slow',
];
const FIRST_DRILL_SECS = 30;

function FirstDrillScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState('ready'); // 'ready' | 'active' | 'done'
  const [remain, setRemain] = useState(FIRST_DRILL_SECS);
  const [cueIdx, setCueIdx] = useState(0);
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'active') return;
    // Tick every second
    const tick = setInterval(() => {
      setRemain(r => {
        if (r <= 1) {
          clearInterval(tick);
          setPhase('done');
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0.95, duration: 200, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    // Rotate cues every 6 seconds
    const cue = setInterval(() => {
      setCueIdx(i => (i + 1) % FIRST_DRILL_CUES.length);
    }, 6000);
    // Animated ring sweep over the full drill duration
    ringAnim.setValue(0);
    Animated.timing(ringAnim, {
      toValue: 1,
      duration: FIRST_DRILL_SECS * 1000,
      useNativeDriver: false,
    }).start();
    return () => { clearInterval(tick); clearInterval(cue); };
  }, [phase]);

  const startDrill = () => { setRemain(FIRST_DRILL_SECS); setCueIdx(0); setPhase('active'); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }}>
      <LinearGradient colors={[C.bg, '#0D0D0F', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} />

      {/* Skip button */}
      {phase !== 'done' && (
        <TouchableOpacity
          onPress={onComplete}
          style={{ position: 'absolute', top: insets.top + 8, right: S.md, zIndex: 10, paddingVertical: 8, paddingHorizontal: 12 }}
          activeOpacity={0.7}
        >
          <Text style={[T.cap, { color: C.textMuted, fontWeight: '700' }]}>SKIP</Text>
        </TouchableOpacity>
      )}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg }}>

        {phase === 'ready' && (
          <>
            <Text style={[T.label, { color: C.accent, letterSpacing: 2, marginBottom: S.xs }]}>YOUR FIRST DRILL</Text>
            <Text style={[T.h1, { fontSize: 34, textAlign: 'center', marginBottom: S.sm }]}>
              Wrist Wake-Up
            </Text>
            <Text style={[T.h3, { color: C.textSub, textAlign: 'center', fontWeight: '500', marginBottom: S.xl }]}>
              30 seconds. You'll do this before every session.
            </Text>
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.accent + '55', marginBottom: S.xl }}>
              <Text style={{ fontSize: 72 }}>🖐️</Text>
            </View>
            <TouchableOpacity onPress={startDrill} activeOpacity={0.85} style={{ width: '100%', borderRadius: R.xxl, overflow: 'hidden' }}>
              <LinearGradient colors={G.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 }}>
                <Ionicons name="play" size={18} color={C.black} />
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>START DRILL</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {phase === 'active' && (
          <>
            <Text style={[T.label, { color: C.accent, letterSpacing: 2, marginBottom: S.sm }]}>WRIST WAKE-UP</Text>
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: S.xl }}>
              {/* Outer ring */}
              <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 6, borderColor: C.border }} />
              {/* Progress ring (animated via rotation + clipping not possible in RN; use a simple inner filled bar instead) */}
              <Animated.View style={{
                position: 'absolute', width: 200, height: 200, borderRadius: 100,
                borderWidth: 6,
                borderColor: 'transparent',
                borderTopColor: C.accent,
                borderRightColor: C.accent,
                transform: [{ rotate: ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['-45deg', '315deg'] }) }],
              }} />
              <Text style={{ fontSize: 64, fontWeight: '900', color: C.accent }}>{remain}</Text>
              <Text style={[T.cap, { color: C.textMuted, letterSpacing: 1 }]}>SECONDS</Text>
            </View>
            <View style={{ minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[T.h3, { color: C.text, textAlign: 'center' }]}>
                {FIRST_DRILL_CUES[cueIdx]}
              </Text>
            </View>
          </>
        )}

        {phase === 'done' && (
          <Animated.View style={{ alignItems: 'center', width: '100%', transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: pulse }}>
            <Text style={{ fontSize: 72, marginBottom: S.md }}>🔥</Text>
            <Text style={[T.label, { color: C.accent, letterSpacing: 2, marginBottom: S.xs }]}>DAY 1 COMPLETE</Text>
            <Text style={[T.h1, { fontSize: 30, textAlign: 'center', marginBottom: S.sm }]}>
              You just did your first drill.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md, paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.xxl, backgroundColor: C.accent + '1A', borderWidth: 1, borderColor: C.accent + '55' }}>
              <Ionicons name="flash" size={18} color={C.accent} />
              <Text style={[T.h4, { color: C.accent, fontSize: 16 }]}>+50 XP earned</Text>
            </View>
            <Text style={[T.body, { color: C.textSub, textAlign: 'center', marginTop: S.lg, maxWidth: 320 }]}>
              Save your streak so it doesn't reset. One tap.
            </Text>
            <TouchableOpacity onPress={onComplete} activeOpacity={0.85} style={{ width: '100%', borderRadius: R.xxl, overflow: 'hidden', marginTop: S.lg }}>
              <LinearGradient colors={G.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>SAVE MY PROGRESS</Text>
                <Ionicons name="arrow-forward" size={18} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </View>
    </View>
  );
}

function NotificationsStep({ onComplete }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }}>
      <LinearGradient colors={[C.bg, '#0D0D0F', C.bg]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg, opacity: fadeAnim }}>
        <Text style={[T.label, { color: C.accent, marginBottom: S.xs, letterSpacing: 2 }]}>ONE LAST THING</Text>
        <Text style={[T.h2, { textAlign: 'center', marginBottom: S.xs, fontSize: 26 }]}>Training 4×/week is what{'\n'}moves the needle.</Text>
        <Text style={[T.body, { color: C.textSub, textAlign: 'center', marginBottom: S.lg, maxWidth: 320, lineHeight: 22 }]}>
          We'll send ONE reminder at a time that works for you. No spam.
        </Text>
        {[
          { icon: '⏰', title: 'Daily training reminder', desc: "We'll nudge you each morning" },
          { icon: '🔥', title: 'Streak protection alerts', desc: "Don't break your streak — trained yet?" },
          { icon: '📊', title: 'Weekly progress summary', desc: 'Sunday recap of your training week' },
        ].map(item => (
          <View key={item.title} style={[ob.levelPill, { marginBottom: S.xs }]}>
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={T.h4}>{item.title}</Text>
              <Text style={T.cap}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={{ paddingHorizontal: S.lg, gap: S.sm }}>
        <TouchableOpacity
          style={ob.primaryBtn}
          onPress={async () => {
            const status = await requestNotifPermission();
            if (status === 'granted') {
              const settings = { ...DEFAULT_NOTIF_SETTINGS, enabled: true };
              await _saveNotifSettings(settings);
              await scheduleAllNotifications(settings, 1);
            }
            onComplete();
          }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>YES, REMIND ME</Text>
            <Ionicons name="notifications-outline" size={18} color={C.black} />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={ob.skipBtn} onPress={onComplete} activeOpacity={0.7}>
          <Text style={[T.small, { color: C.textMuted }]}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREENS
// ─────────────────────────────────────────────────────────────────────────────

// Shared form components
function AuthInput({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, error }) {
  return (
    <View style={{ marginBottom: S.sm }}>
      <TextInput
        style={[au.input, error && au.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
      />
      {error ? <Text style={au.fieldError}>{error}</Text> : null}
    </View>
  );
}

function AuthButton({ label, onPress, loading, secondary, style }) {
  if (secondary) {
    return (
      <TouchableOpacity style={[au.secondaryBtn, style]} onPress={onPress} disabled={loading} activeOpacity={0.75}>
        <Text style={au.secondaryLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={[au.primaryBtn, loading && { opacity: 0.6 }, style]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      <LinearGradient colors={G.accent} style={au.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {loading
          ? <ActivityIndicator color={C.black} size="small" />
          : <Text style={au.primaryLabel}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Welcome Screen ──
function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[au.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}>
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={au.deco1} /><View style={au.deco2} />

      <Animated.View style={[au.welcomeContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={au.welcomeLogo}>
          <HandstandFigure size={140} />
        </View>
        <Text style={[T.label, { color: C.accent, marginTop: S.xl, letterSpacing: 2 }]}>WELCOME TO</Text>
        <Text style={[T.h1, { fontSize: 36, textAlign: 'center', marginTop: S.xs }]}>HandstandHub</Text>
        <Text style={[T.body, { textAlign: 'center', maxWidth: 280, marginTop: S.md, lineHeight: 22 }]}>
          Your AI-powered handstand coach.{'\n'}Track progress. Level up.
        </Text>
      </Animated.View>

      <Animated.View style={[{ width: '100%', paddingHorizontal: S.lg, gap: S.sm }, { opacity: fadeAnim }]}>
        <AuthButton label="Create Account" onPress={() => navigation.navigate('SignUp')} />
        <AuthButton label="Log In" onPress={() => navigation.navigate('Login')} secondary />
        <TouchableOpacity style={{ paddingVertical: S.sm, alignItems: 'center' }} onPress={() => navigation.navigate('AppOnboarding')} activeOpacity={0.7}>
          <Text style={[T.cap, { color: C.textMuted }]}>Continue without account</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Sign Up Screen ──
function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signUp } = useContext(AuthContext);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [displayName,  setDisplayName]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState({});

  const validate = () => {
    const errs = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (password.length < 8)  errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPass) errs.confirmPass = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(cleanEmail(email), password, cleanDisplayName(displayName));
      setSuccess(true);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[au.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}>
        <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />
        <View style={au.centeredCard}>
          <Text style={{ fontSize: 56, marginBottom: S.md }}>📧</Text>
          <Text style={[T.h2, { textAlign: 'center', marginBottom: S.sm }]}>Check your email</Text>
          <Text style={[T.body, { textAlign: 'center', lineHeight: 22 }]}>
            We sent a verification link to{'\n'}<Text style={{ color: C.accent, fontWeight: '700' }}>{email}</Text>
            {'\n\n'}Click the link then come back to log in.
          </Text>
          <AuthButton label="Go to Log In" onPress={() => navigation.navigate('Login')} style={{ marginTop: S.xl, width: '100%' }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[au.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={au.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={au.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>

        <Text style={[T.h2, { marginBottom: S.xs }]}>Create Account</Text>
        <Text style={[T.body, { marginBottom: S.xl }]}>Start your handstand journey</Text>

        <AuthInput value={displayName} onChangeText={setDisplayName} placeholder="Display name (optional)" autoCapitalize="words" />
        <AuthInput value={email} onChangeText={t => { setEmail(t); setFieldErrors(p => ({...p, email: ''})); }}
          placeholder="Email address" keyboardType="email-address" error={fieldErrors.email} />
        <AuthInput value={password} onChangeText={t => { setPassword(t); setFieldErrors(p => ({...p, password: ''})); }}
          placeholder="Password (min 8 characters)" secureTextEntry error={fieldErrors.password} />
        <AuthInput value={confirmPass} onChangeText={t => { setConfirmPass(t); setFieldErrors(p => ({...p, confirmPass: ''})); }}
          placeholder="Confirm password" secureTextEntry error={fieldErrors.confirmPass} />

        {error ? <View style={au.errorBox}><Text style={au.errorText}>{error}</Text></View> : null}

        <AuthButton label="Create Account" onPress={handleSignUp} loading={loading} style={{ marginTop: S.md }} />

        <View style={au.switchRow}>
          <Text style={T.small}>Already have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Login Screen ──
function LoginScreen({ navigation, onAuthSuccess, onSkip }) {
  const insets  = useSafeAreaInsets();
  const { signIn } = useContext(AuthContext);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      if (onAuthSuccess) onAuthSuccess();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[au.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={au.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={au.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>

        <Text style={[T.h2, { marginBottom: S.xs }]}>Welcome back</Text>
        <Text style={[T.body, { marginBottom: S.xl }]}>Log in to sync your progress</Text>

        <AuthInput value={email} onChangeText={t => { setEmail(t); setError(''); }}
          placeholder="Email address" keyboardType="email-address" />
        <AuthInput value={password} onChangeText={t => { setPassword(t); setError(''); }}
          placeholder="Password" secureTextEntry />

        {error ? <View style={au.errorBox}><Text style={au.errorText}>{error}</Text></View> : null}

        <AuthButton label="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: S.md }} />

        <TouchableOpacity
          style={{ alignItems: 'center', paddingVertical: S.md }}
          onPress={() => navigation.navigate('ForgotPassword')}
          activeOpacity={0.7}
        >
          <Text style={[T.small, { color: C.accent }]}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={au.switchRow}>
          <Text style={T.small}>Don't have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
            <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {onSkip && (
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: S.md, marginTop: S.xs }}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={[T.small, { color: C.textMuted }]}>Skip for now — use without account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Forgot Password Screen ──
function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sendPasswordReset } = useContext(AuthContext);
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleReset = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[au.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />
      <View style={au.formScroll}>
        <TouchableOpacity style={au.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>

        <Text style={[T.h2, { marginBottom: S.xs }]}>Reset Password</Text>
        <Text style={[T.body, { marginBottom: S.xl }]}>We'll send a reset link to your email</Text>

        {sent ? (
          <View style={au.successBox}>
            <Text style={{ fontSize: 32, marginBottom: S.sm }}>📬</Text>
            <Text style={[T.h4, { color: C.success, textAlign: 'center' }]}>Email sent!</Text>
            <Text style={[T.small, { color: C.textSub, textAlign: 'center', marginTop: S.xs, lineHeight: 18 }]}>
              Check your inbox for the password reset link. It expires in 1 hour.
            </Text>
          </View>
        ) : (
          <>
            <AuthInput value={email} onChangeText={t => { setEmail(t); setError(''); }}
              placeholder="Email address" keyboardType="email-address" />
            {error ? <View style={au.errorBox}><Text style={au.errorText}>{error}</Text></View> : null}
            <AuthButton label="Send Reset Link" onPress={handleReset} loading={loading} style={{ marginTop: S.md }} />
          </>
        )}

        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: S.md }} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={[T.small, { color: C.accent }]}>Back to Log In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const au = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  deco1:         { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: C.accent + '07', top: -80, right: -80 },
  deco2:         { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent + '05', bottom: 40, left: -60 },
  welcomeContent:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg },
  welcomeLogo:   { alignItems: 'center', justifyContent: 'center' },
  formScroll:    { flexGrow: 1, paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.xl },
  backBtn:       { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', marginBottom: S.xl, borderWidth: 1, borderColor: C.border },
  input:         { backgroundColor: C.bgCard, borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: S.md, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  inputError:    { borderColor: C.error },
  fieldError:    { fontSize: 11, color: C.error, marginBottom: S.xs, marginLeft: 2 },
  errorBox:      { backgroundColor: C.errorDim, borderRadius: R.lg, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.error + '44' },
  errorText:     { color: C.error, fontSize: 13, lineHeight: 18 },
  successBox:    { backgroundColor: C.successDim, borderRadius: R.xl, padding: S.lg, alignItems: 'center', borderWidth: 1, borderColor: C.success + '44', marginBottom: S.lg },
  primaryBtn:    { borderRadius: R.xxl, overflow: 'hidden' },
  primaryGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: S.md + 2, gap: S.sm },
  primaryLabel:  { fontSize: 15, fontWeight: '900', color: C.black, textTransform: 'uppercase' },
  secondaryBtn:  { alignItems: 'center', paddingVertical: S.md, borderRadius: R.xxl, borderWidth: 1, borderColor: C.borderLight },
  secondaryLabel:{ fontSize: 15, fontWeight: '700', color: C.text },
  switchRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: S.md },
  centeredCard:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl },
});

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION – Movemate-style pill tab bar
// ─────────────────────────────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.bgDeep, text: C.text, border: C.border, primary: C.accent },
};

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { isPreview, triggerGate } = useContext(PreviewContext);

  // Profile and Progress trigger the signup gate in preview mode
  const GATED_TABS   = new Set(['Profile', 'Progress']);

  return (
    <View style={[tb.bar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;
        // Pro-only tab dimming removed — every user has full access.
        const isProTab  = false;

        const iconName = {
          Home:     isFocused ? 'home'         : 'home-outline',
          Levels:   isFocused ? 'barbell'      : 'barbell-outline',
          Plan:     isFocused ? 'calendar'     : 'calendar-outline',
          Progress: isFocused ? 'stats-chart'  : 'stats-chart-outline',
          Profile:  isFocused ? 'person'       : 'person-outline',
        }[route.name];

        const onPress = () => {
          if (isPreview && GATED_TABS.has(route.name)) { triggerGate(); return; }
          // Always allow navigation — Pro tabs show a sneak-peek with an in-screen overlay
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={tb.tabItem} activeOpacity={0.7}>
            {isFocused ? (
              <View style={tb.activeCircle}>
                <Ionicons name={iconName} size={22} color={C.black} />
              </View>
            ) : (
              <View style={tb.inactiveItem}>
                <Ionicons name={iconName} size={22} color={isProTab ? C.textMuted + '88' : C.textMuted} />
                {isProTab && (
                  <View style={tb.proTabDot}>
                    <Text style={{ fontSize: 6, color: C.accent, fontWeight: '900' }}>★</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar:          { flexDirection: 'row', backgroundColor: C.bgDeep, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, paddingHorizontal: S.md },
  tabItem:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  inactiveItem: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  proTabDot:    { position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.accent + '80', alignItems: 'center', justifyContent: 'center' },
});

function HomeTabs() {
  return (
    <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"     component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Levels"   component={LevelsScreen}      options={{ tabBarLabel: 'Exercises' }} />
      <Tab.Screen name="Plan"     component={WeeklyPlanScreen}  options={{ tabBarLabel: 'Plan' }} />
      <Tab.Screen name="Progress" component={ProgressScreen}    options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}     options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
// Wraps a screen in a hook-safe component that gates it in preview mode
function GatedRoute({ component: Component, navigation, ...rest }) {
  const { isPreview, triggerGate } = useContext(PreviewContext);
  useEffect(() => {
    if (isPreview) {
      navigation.goBack();
      triggerGate();
    }
  }, [isPreview]);
  if (isPreview) return null;
  return <Component navigation={navigation} {...rest} />;
}

// The main navigation stack for the post-quiz app (preview + full)
function MainApp({ isPreview = false, onTriggerGate }) {
  const { loading } = useContext(UserProgressContext);

  const triggerGate = useCallback(() => {
    if (isPreview && onTriggerGate) onTriggerGate();
  }, [isPreview, onTriggerGate]);

  return (
    <PreviewContext.Provider value={{ isPreview, triggerGate }}>
      <OfflineProvider>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <PreviewBanner />
          <NavigationContainer theme={NAV_THEME}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: C.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="Main"             component={HomeTabs} />
              <Stack.Screen name="LevelDetail"      component={LevelDetailScreen}      options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="WristWarmup"      options={{ animation: 'slide_from_bottom' }}>
                {(props) => <GatedRoute {...props} component={WristWarmupScreen} />}
              </Stack.Screen>
              <Stack.Screen name="VideoSubmission"  options={{ animation: 'slide_from_bottom', gestureEnabled: false }}>
                {(props) => <GatedRoute {...props} component={VideoSubmissionScreen} />}
              </Stack.Screen>
              <Stack.Screen name="SubmissionReview" component={SubmissionReviewScreen} options={{ animation: 'fade', gestureEnabled: false }} />
            </Stack.Navigator>
          </NavigationContainer>
          <SplashScreen visible={loading} />
        </View>
      </OfflineProvider>
    </PreviewContext.Provider>
  );
}

// Auth navigator — kept for users who want to log in from ProfileScreen settings
function AuthApp({ onAuthSuccess, onSkip }) {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Welcome"        component={WelcomeScreen} />
        <Stack.Screen name="SignUp"         component={SignUpScreen} />
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onAuthSuccess={onAuthSuccess} onSkip={onSkip} />}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE-BASED ROOT ROUTER
//
// Stages (stored/derived from AsyncStorage):
//   'loading'       — reading keys
//   'quiz'          — first open: show Welcome + 7 questions
//   'preview'       — quiz done, signup not yet done
//   'signup_gate'   — preview triggered gate (or force-close during preview)
//   'notifications' — signup done, notifications not asked yet
//   'app'           — fully onboarded
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [stage,         setStage]         = useState('loading');
  const [assignedLevel, setAssignedLevel] = useState(1);
  const [gateVisible,   setGateVisible]   = useState(false);

  // Read all relevant keys on launch and derive stage
  useEffect(() => {
    (async () => {
      try {
        const [quizDone, previewMode, signupDone, purchaseRaw] =
          await AsyncStorage.multiGet([QUIZ_COMPLETE_KEY, PREVIEW_MODE_KEY, SIGNUP_COMPLETE_KEY, PURCHASE_KEY])
            .then(pairs => pairs.map(([, v]) => v));
        const userName = await sensitiveStore.get(USER_NAME_KEY); // PII — SecureStore

        const level = await AsyncStorage.getItem(QUIZ_LEVEL_KEY);
        if (level) setAssignedLevel(parseInt(level, 10) || 1);

        // Existing users who completed the old full onboarding (have user_name) → app
        if (userName) { setStage('app'); return; }

        if (!quizDone) { setStage('quiz'); return; }

        // Entitlement check — hard paywall gate between quiz and everything else
        let hasEntitlement = false;
        if (purchaseRaw) {
          try {
            const p = JSON.parse(purchaseRaw);
            const inTrial = p.trialStartedAt &&
              (new Date() - new Date(p.trialStartedAt)) < TRIAL_DAYS * 86400000;
            hasEntitlement = !!p.isPro || !!inTrial;
          } catch (_) {}
        }
        if (!hasEntitlement) { setStage('paywall_required'); return; }

        // Quiz done but signup not done
        if (!signupDone) {
          // If preview_mode was set (app was closed mid-preview), go straight to gate
          if (previewMode === 'true') { setStage('signup_gate'); return; }
          setStage('preview'); return;
        }

        // Signup done but we're here — notifications step
        setStage('notifications');
      } catch (_) {
        setStage('quiz');
      }
    })();
  }, []);

  // Called by OnboardingQuiz celebration screen after 2s
  const handleQuizComplete = useCallback(async (level) => {
    setAssignedLevel(level);
    // Mark quiz complete and preview mode active
    try {
      await AsyncStorage.multiSet([
        [QUIZ_COMPLETE_KEY, 'true'],
        [PREVIEW_MODE_KEY,  'true'],
      ]);
      // Save level into progress store
      const today = new Date().toDateString();
      const initial = {
        ...DEFAULT_PROGRESS,
        currentLevel:   Math.min(level, EXERCISE_LEVELS.length),
        streak:         1,
        lastActiveDate: today,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (_) {}
    setStage('paywall_required');
  }, []);

  // Called by PaywallGateScreen once the user has an active entitlement (trial or Pro)
  const handlePaywallCleared = useCallback(() => {
    setStage('first_drill');
  }, []);

  // Called when the FirstDrillScreen completes — go straight to signup gate
  const handleFirstDrillComplete = useCallback(async () => {
    try { await AsyncStorage.setItem('@handstandai_first_drill_done', 'true'); } catch (_) {}
    setStage('signup_gate');
  }, []);

  // Called when preview mode triggers the signup gate
  const handleTriggerGate = useCallback(async () => {
    try { await AsyncStorage.setItem(PREVIEW_MODE_KEY, 'true'); } catch (_) {}
    setStage('signup_gate');
  }, []);

  // Called after SignupGateModal completes
  const handleSignupComplete = useCallback(async (name) => {
    try {
      await AsyncStorage.multiSet([
        [SIGNUP_COMPLETE_KEY, 'true'],
        [PREVIEW_MODE_KEY,    'false'],
      ]);
      // Update progress with name
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, userName: name }));
      }
    } catch (_) {}
    setStage('notifications');
  }, []);

  // Called after notifications step completes
  const handleNotifComplete = useCallback(() => {
    setStage('app');
  }, []);

  // Reset (logout / reset progress) — clears ALL user-specific keys
  const handleReset = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY, ONBOARDING_KEY,
        QUIZ_COMPLETE_KEY, QUIZ_ANSWERS_KEY, QUIZ_LEVEL_KEY,
        PREVIEW_MODE_KEY, SIGNUP_COMPLETE_KEY,
        USER_NAME_KEY, USER_EMAIL_KEY,
        AVATAR_KEY,
        NOTIFICATIONS_KEY, PLAN_KEY, MIGRATION_KEY,
        MILESTONES_KEY, WEEKLY_SUMMARY_KEY, AI_QUEUE_KEY,
        PURCHASE_KEY, // clear sub/trial so full new-user flow can be tested
      ]);
      // Clear PII from SecureStore (best-effort).
      await Promise.all([USER_NAME_KEY, USER_EMAIL_KEY, QUIZ_ANSWERS_KEY].map(k =>
        sensitiveStore.remove(k).catch(() => {})
      ));
      // End the Supabase session so the JWT can't be replayed elsewhere.
      try { if (supabase) await supabase.auth.signOut(); }
      catch (e) { console.warn('Reset: supabase.signOut failed', e); }
    } catch (e) { console.warn('handleReset failed', e); }
    setAssignedLevel(1);
    setStage('quiz');
  }, []);

  if (stage === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <SplashScreen visible />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* QUIZ — Welcome + 7 questions + celebration */}
        {stage === 'quiz' && (
          <BadgeProvider>
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider>
                  <OnboardingQuiz onComplete={handleQuizComplete} />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          </BadgeProvider>
        )}

        {/* PAYWALL REQUIRED — hard gate between quiz and anything else */}
        {stage === 'paywall_required' && (
          <BadgeProvider>
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider onReset={handleReset}>
                  <PaywallGateScreen onCleared={handlePaywallCleared} />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          </BadgeProvider>
        )}

        {/* FIRST DRILL — 30-sec wrist wake-up before signup */}
        {stage === 'first_drill' && (
          <FirstDrillScreen onComplete={handleFirstDrillComplete} />
        )}

        {/* PREVIEW — user browses freely, gate shown on trigger */}
        {stage === 'preview' && (
          <BadgeProvider>
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider onReset={handleReset}>
                  <MainApp isPreview onTriggerGate={handleTriggerGate} />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          </BadgeProvider>
        )}

        {/* SIGNUP GATE — full-screen, not dismissible */}
        {stage === 'signup_gate' && (
          <BadgeProvider>
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider onReset={handleReset}>
                  {/* Keep MainApp behind the modal so it's not a blank screen */}
                  <MainApp isPreview onTriggerGate={() => {}} />
                  <SignupGateModal
                    visible
                    assignedLevel={assignedLevel}
                    onComplete={handleSignupComplete}
                  />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          </BadgeProvider>
        )}

        {/* NOTIFICATIONS STEP */}
        {stage === 'notifications' && (
          <NotificationsStep onComplete={handleNotifComplete} />
        )}

        {/* FULL APP */}
        {stage === 'app' && (
          <BadgeProvider>
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider onReset={handleReset}>
                  <MainApp />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          </BadgeProvider>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

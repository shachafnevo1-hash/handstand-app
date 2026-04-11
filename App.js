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
import { WebView } from 'react-native-webview';
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
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { createClient } from '@supabase/supabase-js';

const { width, height } = Dimensions.get('window');

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
const AI_CHECK_URL = 'https://kkilkggghydodfnbeoyw.supabase.co/functions/v1/ai-check';

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
// Dashboard → Settings → API
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://kkilkggghydodfnbeoyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraWxrZ2dnaHlkb2RmbmJlb3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg0MjQsImV4cCI6MjA5MDk3NDQyNH0.PbhjFAJiTdiL5ETE2xAYnyyVf5SsEf6H18Dmqnwv-N4';

// Deep-link scheme Supabase uses for email confirmation / password reset.
// In Expo Go the link opens as exp://<lan-ip>:8081 — we use the slug as path
// so the app can intercept it. In a production build swap for your custom scheme.
const AUTH_REDIRECT_URL = 'exp://192.168.1.7:8081/--/auth-callback';

// True only when the developer has replaced the placeholder values above.
const SUPABASE_CONFIGURED =
  !SUPABASE_URL.includes('<YOUR_PROJECT_REF>') &&
  !SUPABASE_ANON_KEY.includes('<YOUR_ANON_KEY>');

// Use AsyncStorage for Supabase session persistence — no key-character
// restrictions unlike SecureStore (which rejects Supabase's internal key
// names containing ":" characters).
const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage:            AsyncStorage,
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
      } else {
        setAuthUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setAuthUser(data);
    } catch (_) {}
  };

  const signUp = async (email, password, displayName) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: displayName },
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
    supabase.from('users').update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id).then(() => {});
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
      .update({ display_name: name })
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
const MILESTONES_KEY = '@handstandai_milestones';
const WEEKLY_SUMMARY_KEY = '@handstandai_weekly_summary';

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
    const subs = progress.submissions || [];
    if (subs.length === 0) return { streak: 0, frozen: false };
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const trainingDates = new Set(subs.map(s => {
      const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime();
    }));
    // Check if today or yesterday has a session
    const trainedToday     = trainingDates.has(today.getTime());
    const trainedYesterday = trainingDates.has(yesterday.getTime());
    // Check if last 7 days has at most 1 gap (forgiving rest day)
    let consecutiveDays = 0;
    let restDayUsed = false;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (trainingDates.has(d.getTime())) {
        consecutiveDays++;
      } else if (!restDayUsed && i > 0) {
        restDayUsed = true; // forgive one gap
      } else {
        break;
      }
    }
    const frozen = restDayUsed && !trainedToday && trainedYesterday;
    return { streak: consecutiveDays, frozen };
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
  const [proState,       setProState]       = useState(DEFAULT_PURCHASE_STATE);
  const [proLoaded,      setProLoaded]      = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [sessionPaywallShown, setSessionPaywallShown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PURCHASE_KEY);
        if (raw) setProState({ ...DEFAULT_PURCHASE_STATE, ...JSON.parse(raw) });
      } catch (_) {}
      setProLoaded(true);
    })();
  }, []);

  const _save = async (next) => {
    setProState(next);
    try { await AsyncStorage.setItem(PURCHASE_KEY, JSON.stringify(next)); } catch (_) {}
  };

  // ── Derived access helpers ─────────────────────────────────────────────────
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

  const canAccessLevel     = (levelId) => levelId <= FREE_MAX_LEVEL || isPro();
  const canPostToCommunity = () => isPro();

  // ── Purchase flow (beta mock) ──────────────────────────────────────────────
  const purchaseSubscription = async (productId) => {
    setPurchaseLoading(true);
    // Simulate a short network delay so the loading spinner shows
    await new Promise(r => setTimeout(r, 800));
    try {
      // Both monthly and annual now include a 7-day free trial
      const trialStartedAt = new Date().toISOString();
      await _save({ isPro: true, trialStartedAt, productId });
      setPaywallVisible(false);
      Alert.alert(
        '🎉 Welcome to Pro!',
        'Payment coming soon! Enjoy full Pro access for free during beta.',
      );
      return true;
    } finally {
      setPurchaseLoading(false);
    }
  };

  const restorePurchases = async () => {
    setPurchaseLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setPurchaseLoading(false);
    if (proState.isPro) {
      Alert.alert('Restore Complete', 'Your Pro access has been restored.');
    } else {
      Alert.alert('Nothing to Restore', 'No active subscription found on this account.');
    }
  };

  const showPaywall = (reason = 'general', featureLabel = '') => {
    if (sessionPaywallShown) return;
    setPaywallTrigger({ reason, featureLabel });
    setPaywallVisible(true);
    setSessionPaywallShown(true);
  };

  const hidePaywall = () => setPaywallVisible(false);

  return (
    <PurchaseContext.Provider value={{
      proLoaded,
      isPro, isInTrial, trialDaysRemaining, subscriptionExpiresAt,
      canAccessLevel, canPostToCommunity,
      purchaseSubscription, restorePurchases,
      showPaywall, hidePaywall,
      paywallVisible, paywallTrigger, purchaseLoading,
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
function PaywallModal() {
  const {
    paywallVisible, paywallTrigger, hidePaywall,
    purchaseSubscription, restorePurchases, purchaseLoading,
  } = useContext(PurchaseContext);
  const [selected, setSelected] = useState('pro_annual');
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

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

  const PRO_FEATURES = [
    { icon: 'videocam-outline',    text: 'AI Form Analysis & Coaching' },
    { icon: 'infinite-outline',    text: 'Unlimited Level Access' },
    { icon: 'calendar-outline',    text: 'Weekly Training Plans' },
    { icon: 'stats-chart-outline', text: 'Progress Tracking & Charts' },
    { icon: 'trophy-outline',      text: 'Achievement Badges' },
  ];

  const handlePurchase = async () => {
    await purchaseSubscription(selected);
  };

  return (
    <Modal visible={paywallVisible} transparent animationType="none" onRequestClose={hidePaywall}>
      <Animated.View style={[pw.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[pw.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Close */}
            <TouchableOpacity style={pw.closeBtn} onPress={hidePaywall} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={C.textMuted} />
            </TouchableOpacity>

            {/* Hero */}
            <View style={pw.hero}>
              <View style={pw.heroIconCircle}>
                <Ionicons name="star" size={64} color={C.accent} />
              </View>
              <Text style={[T.h1, { textAlign: 'center', marginTop: S.md, fontSize: 36, fontWeight: '900', textTransform: 'uppercase' }]}>GO PRO</Text>
              <Text style={[T.label, { color: C.textSub, textAlign: 'center', marginTop: S.xs }]}>UNLOCK YOUR FULL POTENTIAL</Text>
              {paywallTrigger?.reason === 'level_lock' && (
                <View style={pw.triggerBadge}>
                  <Text style={[T.cap, { color: C.accent }]}>🔒 {paywallTrigger.featureLabel}</Text>
                </View>
              )}
              {paywallTrigger?.reason === 'ai_limit' && (
                <View style={pw.triggerBadge}>
                  <Text style={[T.cap, { color: C.accent }]}>🤖 {paywallTrigger.featureLabel}</Text>
                </View>
              )}
              {paywallTrigger?.reason === 'level2_complete' && (
                <View style={pw.triggerBadge}>
                  <Text style={[T.cap, { color: C.accent }]}>🎉 Ready for the next level?</Text>
                </View>
              )}
            </View>

            {/* Features list */}
            <View style={pw.featureList}>
              {PRO_FEATURES.map(f => (
                <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {/* lime check circle */}
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={13} color={C.black} />
                  </View>
                  {/* feature icon */}
                  <Ionicons name={f.icon} size={16} color={C.accent} />
                  {/* text */}
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: C.white }}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <View style={pw.planRow}>
              {/* Annual — best value */}
              <TouchableOpacity
                style={[pw.planCard, selected === 'pro_annual' && pw.planCardSelected]}
                onPress={() => setSelected('pro_annual')}
                activeOpacity={0.85}
              >
                <View style={pw.bestValueBadge}>
                  <Text style={pw.bestValueText}>BEST VALUE · 50% OFF</Text>
                </View>
                <Text style={[T.num, { color: selected === 'pro_annual' ? C.accent : C.text, fontSize: 26, fontWeight: '900' }]}>$59.99</Text>
                <Text style={[T.cap, { color: C.textMuted }]}>per year</Text>
                <Text style={[T.small, { color: C.accent, marginTop: 4, fontWeight: '700' }]}>= $5.00/mo</Text>
                <View style={pw.trialBadge}>
                  <Text style={pw.trialText}>7-DAY FREE TRIAL</Text>
                </View>
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                style={[pw.planCard, selected === 'pro_monthly' && pw.planCardSelected]}
                onPress={() => setSelected('pro_monthly')}
                activeOpacity={0.85}
              >
                <View style={{ height: 20 }} />
                <Text style={[T.num, { color: selected === 'pro_monthly' ? C.accent : C.text, fontSize: 26, fontWeight: '900' }]}>$9.99</Text>
                <Text style={[T.cap, { color: C.textMuted }]}>per month</Text>
                <Text style={[T.small, { color: C.textMuted, marginTop: 4 }]}>cancel anytime</Text>
                <View style={pw.trialBadge}>
                  <Text style={pw.trialText}>7-DAY FREE TRIAL</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Trial notice — shown for both plans */}
            <Text style={[T.small, { color: C.textMuted, textAlign: 'center', marginHorizontal: S.lg, marginTop: S.sm, lineHeight: 18 }]}>
              Start your 7-day free trial today. No charge until the trial ends. Cancel anytime before the trial ends and you won't be charged.
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={[pw.ctaBtn, purchaseLoading && { opacity: 0.7 }]}
              onPress={handlePurchase}
              activeOpacity={0.85}
              disabled={purchaseLoading}
            >
              <LinearGradient colors={G.accent} style={pw.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {purchaseLoading
                  ? <ActivityIndicator color={C.black} />
                  : <Text style={[T.h4, { color: C.black, fontWeight: '900', textTransform: 'uppercase' }]}>Start Free Trial</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Restore + Terms */}
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: S.sm }} onPress={restorePurchases} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Restore Purchases</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', paddingBottom: S.sm }} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Terms &amp; Privacy</Text>
            </TouchableOpacity>

            <Text style={[T.small, { color: C.textMuted, textAlign: 'center', marginHorizontal: S.xl, lineHeight: 16 }]}>
              Subscriptions automatically renew. Manage or cancel in your App Store account settings.
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const pw = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: C.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.93, overflow: 'hidden' },
  closeBtn:        { position: 'absolute', top: S.md, right: S.md, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: C.bgCardElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  hero:            { alignItems: 'center', paddingVertical: S.xl, paddingTop: S.xl + 8, paddingHorizontal: S.lg },
  heroIconCircle:  { width: 100, height: 100, borderRadius: 50, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  triggerBadge:    { backgroundColor: C.accentDim, paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.full, marginTop: S.sm, borderWidth: 1, borderColor: C.accent + '44' },
  featureList:     { paddingHorizontal: S.lg, paddingTop: S.md },
  featureRow:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  featureCheck:    { width: 24, height: 24, borderRadius: 12, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '44' },
  planRow:         { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.lg, marginTop: S.lg },
  planCard:        { flex: 1, backgroundColor: C.bgCardElevated, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 2, borderColor: C.border },
  planCardSelected:{ borderColor: C.accent, backgroundColor: C.accentDim },
  bestValueBadge:  { backgroundColor: C.accent, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3, marginBottom: S.xs },
  bestValueText:   { fontSize: 8, fontWeight: '800', color: C.black, letterSpacing: 0.5 },
  trialBadge:      { backgroundColor: C.accentDim, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3, marginTop: S.xs, borderWidth: 1, borderColor: C.accent + '44' },
  trialText:       { fontSize: 8, fontWeight: '800', color: C.accent, letterSpacing: 0.5 },
  ctaBtn:          { marginHorizontal: S.lg, marginTop: S.lg, borderRadius: R.full, overflow: 'hidden', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  ctaGrad:         { height: 56, alignItems: 'center', justifyContent: 'center' },
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
// CONTEXT – UserProgressContext + UserProgressProvider
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY        = '@handstandai_v2';
const ONBOARDING_KEY     = '@handstandai_onboarding';
const NOTIFICATIONS_KEY  = '@handstandai_notifications';
const AI_QUEUE_KEY       = '@handstandai_ai_queue';
const PLAN_KEY           = '@handstandai_plan';
const MIGRATION_KEY      = '@handstandai_migrated';
const AVATAR_KEY         = 'user_avatar_uri';

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
    try {
      const res = await fetch(AI_CHECK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: item.imageBase64 }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        if (onResult) onResult(item.submissionId, result);
      }
    } catch (_) {
      remaining.push(item);
    }
  }
  try { await AsyncStorage.setItem(AI_QUEUE_KEY, JSON.stringify(remaining)); } catch (_) {}
}

const DEFAULT_NOTIF_SETTINGS = {
  enabled:        false,
  reminderHour:   8,
  reminderMinute: 0,
  streakEnabled:  true,
  weeklyEnabled:  true,
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

async function scheduleAllNotifications(settings, streak = 0) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.enabled) return;
    const { reminderHour: h, reminderMinute: m } = settings;

    // 1. Daily training reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🤸 Time to Train!',
        body: streak > 2
          ? `You're on a ${streak}-day streak! Keep it alive with today's session.`
          : "Your daily handstand practice is waiting. Let's build that skill!",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h, minute: m,
      },
    });

    // 2. Evening streak reminder — 12 hours later, capped at 20:00
    if (settings.streakEnabled) {
      const sh = Math.min(h + 12, 20);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔥 Don't Break Your Streak!",
          body: streak > 1
            ? `Day ${streak} on the line! Log just one exercise to keep it going.`
            : 'Open HandstandHub and complete today\'s training to stay consistent.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: sh, minute: m,
        },
      });
    }

    // 3. Weekly progress summary — Sunday at 09:00
    if (settings.weeklyEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Progress Check',
          body: 'Another week of training done! Open the app to see your progress summary.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // 1 = Sunday in expo-notifications
          hour: 9, minute: 0,
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
  currentLevel:            1,
  xp:                      0,
  totalXP:                 0,
  completedLevels:         [],
  submissions:             [],
  streak:                  0,
  lastActiveDate:          null,
  dailyChallengeCompleted: false,
  dailyChallengeDate:      null,
  joinDate:                new Date().toISOString(),
  userName:                '',
  startHereDismissed:      false,  // shown until user taps "Go to Level 1" or X
};

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
  } catch (_) {}
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
        if (p.lastActiveDate !== today) {
          p.streak = p.lastActiveDate === yesterday
            ? (p.streak || 0) + 1
            : 1;
          p.lastActiveDate = today;
        }
      } else {
        p = { ...DEFAULT_PROGRESS, streak: 1, lastActiveDate: today };
      }

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
      if (userId) _syncSessionToCloud(entry, userId).catch(() => {});
    }).catch(() => {});
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
        await scheduleAllNotifications(next, progress.streak);
      }
    } else {
      try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (_) {}
    }
    return next;
  }, [notifSettings, progress.streak]);

  const enableNotifications = useCallback(async () => {
    const status = await requestNotifPermission();
    setNotifPermission(status);
    if (status === 'granted') {
      const next = { ...notifSettings, enabled: true };
      setNotifSettings(next);
      await _saveNotifSettings(next);
      await scheduleAllNotifications(next, progress.streak);
    }
    return status;
  }, [notifSettings, progress.streak]);

  // ── Milestone checking after every progress update ──────────────────────────
  // MilestoneContext may not be available if provider order changes, so we
  // safely access it and skip if not mounted yet.
  const milestoneCtx = useContext(MilestoneContext);

  useEffect(() => {
    if (!loading && milestoneCtx?.checkMilestones) {
      milestoneCtx.checkMilestones(progress);
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
          <Text style={{ fontSize: 52 }}>🤸</Text>
        </View>
      </Animated.View>

      <Text style={sp.appName}>HandstandHub</Text>
      <Text style={[T.label, { color: C.textMuted, marginTop: S.xs, letterSpacing: 2 }]}>YOUR HANDSTAND COACH</Text>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, zIndex: 999 },
  logoBg:    { width: 100, height: 100, borderRadius: 32, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  glowRing:  { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: C.accent + '55', shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  appName:   { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginTop: 28 },
  circle1:   { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: C.accent + '06', top: -80, right: -80 },
  circle2:   { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent + '04', bottom: -40, left: -60 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN – Home (Movemate style)
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ navigation }) {
  const insets  = useSafeAreaInsets();
  const { progress, getLevelProgress, completeDailyChallenge, addXP, dismissStartHere } = useContext(UserProgressContext);
  const { buildWeeklySummary, computeForgivingStreak } = useContext(MilestoneContext);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [dailyExpanded, setDailyExpanded] = useState(false);
  const [showExPicker,  setShowExPicker]  = useState(false);
  const [pendingNav,    setPendingNav]    = useState(null);
  const [avatarUri,     setAvatarUri]     = useState(null);

  const level = EXERCISE_LEVELS.find(l => l.id === Math.min(progress.currentLevel, EXERCISE_LEVELS.length)) || EXERCISE_LEVELS[0];
  const daily = getDailyChallenge(progress.currentLevel);
  const weekDays = getWeekDays();
  const { streak: forgivingStreak, frozen } = computeForgivingStreak(progress);

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
              : <Text style={hd.avatarText}>{initials || '🤸'}</Text>
            }
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={hd.welcomeLabel}>WELCOME BACK,</Text>
            <Text style={hd.welcomeName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={hd.notifBtn} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={20} color={C.textSub} />
            <View style={hd.notifDot} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── 2. STATS ROW ── */}
        <Animated.View style={[hd.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {[
            { icon: frozen ? 'snow-outline' : 'footsteps-outline', val: forgivingStreak, label: 'DAY STREAK' },
            { icon: 'flash-outline', val: progress.xp, label: 'TOTAL XP' },
            { icon: 'trophy-outline', val: progress.currentLevel, label: 'LEVEL' },
          ].map((s, i) => (
            <View key={s.label} style={hd.statCard}>
              <Ionicons name={s.icon} size={24} color={C.accent} />
              <Text style={hd.statNum}>{s.val}</Text>
              <Text style={hd.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── 3. WEEKLY ACTIVITY CARD ── */}
        <Animated.View style={[hd.card, { marginTop: 24, opacity: fadeAnim }]}>
          <View style={hd.cardHeaderRow}>
            <Text style={hd.cardLabel}>THIS WEEK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={hd.cardLabel}>WEEKLY GOAL</Text>
              <Text style={[hd.cardLabel, { color: C.accent }]}>
                {barData.filter(d => d.trained).length}/7 DAYS
              </Text>
            </View>
          </View>
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
            <View style={[hd.progressFill, { width: `${Math.round(getLevelProgress() * 100)}%` }]} />
          </View>
          <Text style={[hd.cardLabel, { marginTop: 8, letterSpacing: 0.5 }]}>
            {progress.xp} / {XP_PER_LEVEL} XP TO NEXT LEVEL
          </Text>
        </Animated.View>

        {/* ── 5. PRIMARY CTA ── */}
        <Animated.View style={[{ marginTop: 24, marginHorizontal: 20 }, { opacity: fadeAnim }, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            onPressIn={pressBtnIn}
            onPressOut={pressBtnOut}
            onPress={() => setShowExPicker(true)}
            activeOpacity={1}
            style={hd.ctaBtn}
          >
            <Text style={hd.ctaText}>START TODAY'S TRAINING</Text>
            <View style={hd.ctaArrow}>
              <Ionicons name="arrow-forward" size={20} color={C.accent} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Start Here banner (shown until dismissed) ── */}
        {!progress.startHereDismissed && (
          <Animated.View style={[hd.startBanner, { opacity: fadeAnim }]}>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: C.accent, marginBottom: 3 }]}>NEW TO HANDSTANDS?</Text>
              <Text style={[T.h4, { fontSize: 13, marginBottom: 2 }]}>Start with Level 1 – Beginner</Text>
              <Text style={[T.small, { lineHeight: 16 }]}>Build your hollow body, wall walks, and pike hold first.</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <TouchableOpacity
                style={hd.startBannerBtn}
                activeOpacity={0.85}
                onPress={() => { dismissStartHere(); navigation.navigate('Levels'); }}
              >
                <Text style={[T.cap, { color: C.black, fontWeight: '800' }]}>Go to Level 1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={dismissStartHere}>
                <Ionicons name="close" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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
                <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
          const response = await fetch(AI_CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
            signal: controller.signal,
          });
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
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={[T.small, { marginTop: S.md }]}>Checking permissions…</Text>
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
  const { showPaywall, isPro } = useContext(PurchaseContext);
  const baseXP   = 50;
  const bonusXP  = aiVerified ? 10 : 0;
  const totalXP  = baseXP + bonusXP;

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
            <View style={sv.shareRow}>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: '#25D366' + '18', borderColor: '#25D366' + '44' }]} onPress={handleWhatsApp} activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>💬</Text>
                <Text style={[T.cap, { color: '#25D366', fontWeight: '700' }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: '#E1306C' + '18', borderColor: '#E1306C' + '44' }]} onPress={handleInstagram} activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>📸</Text>
                <Text style={[T.cap, { color: '#E1306C', fontWeight: '700' }]}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sv.shareBtn, { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]} onPress={handleGeneralShare} activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>🤝</Text>
                <Text style={[T.cap, { color: C.accent, fontWeight: '700' }]}>Share</Text>
              </TouchableOpacity>
            </View>
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
                  // After completing Level 2, celebrate then offer Pro upgrade
                  if (levelId === FREE_MAX_LEVEL && !isPro()) {
                    setTimeout(() => showPaywall('level2_complete', ''), 1200);
                  }
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
  logoBg:           { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
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
    const trimmed = nameInput.trim();
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
              await AsyncStorage.multiRemove([STORAGE_KEY, ONBOARDING_KEY, NOTIFICATIONS_KEY, PLAN_KEY, MIGRATION_KEY]);
            } catch (_) {}
            if (onReset) onReset();
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
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              await AsyncStorage.removeItem(ONBOARDING_KEY);
            } catch (_) {}
            if (onReset) onReset();
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
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
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
                <View style={[pf.avatarCircle, { backgroundColor: C.accentDim }]}>
                  {initials
                    ? <Text style={[pf.avatarInitials, { color: C.accent }]}>{initials}</Text>
                    : <Text style={{ fontSize: 42 }}>🤸</Text>
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

              {/* Stat 2 — Current Streak (HIGHLIGHTED in lime) */}
              <View style={[profileStatCard.card, profileStatCard.cardHighlight]}>
                <View style={[profileStatCard.iconWrap, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
                  <Ionicons name="flame" size={16} color={C.black} />
                </View>
                <Text style={[profileStatCard.label, { color: 'rgba(0,0,0,0.7)' }]}>Streak</Text>
                <Text style={[profileStatCard.value, { color: C.black }]}>{progress.streak || 0}</Text>
              </View>

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
const OB_LEVELS = [
  { level: 1, icon: '🌱', title: 'Complete Beginner',  desc: "I've never done a handstand" },
  { level: 2, icon: '🔥', title: 'Some Experience',    desc: 'I can do wall handstands' },
  { level: 3, icon: '⚡', title: 'Intermediate+',       desc: "I'm working on freestanding" },
];

function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const { refreshProgress } = useContext(UserProgressContext);
  const [step,          setStep]          = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [nameInput,     setNameInput]     = useState('');
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const finish = async () => {
    const today = new Date().toDateString();
    const initial = {
      ...DEFAULT_PROGRESS,
      currentLevel:   selectedLevel || 1,
      streak:         1,
      lastActiveDate: today,
      userName:       nameInput.trim(),
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY,    JSON.stringify(initial));
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (_) {}
    onComplete(refreshProgress);
  };

  return (
    <KeyboardAvoidingView
      style={[ob.container, { paddingTop: insets.top, paddingBottom: insets.bottom + S.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dark background */}
      <LinearGradient colors={[C.bg, '#0D0D0F', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} />

      {/* Decorative circles */}
      <View style={ob.deco1} />
      <View style={ob.deco2} />
      <View style={ob.deco3} />

      {/* Progress dots */}
      <View style={ob.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[ob.dot, step === i && ob.dotActive, step > i && ob.dotDone]} />
        ))}
      </View>

      {/* Step content */}
      <Animated.View style={[ob.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* STEP 0 – Welcome */}
        {step === 0 && (
          <View style={ob.slide}>
            <View style={ob.logoBg}>
              <Text style={{ fontSize: 52 }}>🤸</Text>
            </View>
            <Text style={[T.label, { color: C.accent, marginTop: S.xl, marginBottom: S.sm }]}>WELCOME TO</Text>
            <Text style={[T.h1, { fontSize: 38, textAlign: 'center', marginBottom: S.sm }]}>HandstandHub</Text>
            <Text style={[T.h3, { color: C.textSub, fontWeight: '400', textAlign: 'center', lineHeight: 28 }]}>
              Train smarter.{'\n'}Balance longer.
            </Text>
            <Text style={[T.body, { textAlign: 'center', marginTop: S.lg, maxWidth: 300, lineHeight: 22 }]}>
              Your AI-powered handstand coach. Track practice, get feedback, and unlock new levels.
            </Text>
          </View>
        )}

        {/* STEP 1 – Level selection */}
        {step === 1 && (
          <View style={ob.slide}>
            <Text style={[T.label, { color: C.accent, marginBottom: S.sm }]}>STEP 1 OF 3</Text>
            <Text style={[T.h2, { textAlign: 'center', marginBottom: S.xs }]}>Where are you now?</Text>
            <Text style={[T.body, { textAlign: 'center', marginBottom: S.lg }]}>
              We'll set your starting level based on your experience.
            </Text>
            {OB_LEVELS.map(opt => (
              <TouchableOpacity
                key={opt.level}
                style={[ob.levelPill, selectedLevel === opt.level && ob.levelPillActive]}
                onPress={() => setSelectedLevel(opt.level)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h4, { color: selectedLevel === opt.level ? C.white : C.text }]}>{opt.title}</Text>
                  <Text style={T.cap}>{opt.desc}</Text>
                </View>
                <View style={[ob.radio, selectedLevel === opt.level && { backgroundColor: C.accent, borderColor: C.accent }]}>
                  {selectedLevel === opt.level && <View style={ob.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2 – Name */}
        {step === 2 && (
          <View style={ob.slide}>
            <Text style={[T.label, { color: C.accent, marginBottom: S.sm }]}>STEP 2 OF 3</Text>
            <Text style={[T.h2, { textAlign: 'center', marginBottom: S.xs }]}>What's your name?</Text>
            <Text style={[T.body, { textAlign: 'center', marginBottom: S.lg }]}>
              We'll use this to personalise your experience. You can skip this.
            </Text>
            <TextInput
              style={ob.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name (optional)"
              placeholderTextColor={C.textMuted}
              maxLength={30}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => animateTo(3)}
            />
          </View>
        )}

        {/* STEP 3 – Notifications */}
        {step === 3 && (
          <View style={ob.slide}>
            <Text style={[T.label, { color: C.accent, marginBottom: S.sm }]}>STEP 3 OF 3</Text>
            <Text style={{ fontSize: 48, marginBottom: S.sm }}>🔔</Text>
            <Text style={[T.h2, { textAlign: 'center', marginBottom: S.xs }]}>Stay Consistent</Text>
            <Text style={[T.body, { textAlign: 'center', marginBottom: S.lg, maxWidth: 300, lineHeight: 22 }]}>
              Enable daily reminders and streak alerts so you never miss a session.
            </Text>
            {[
              { icon: '⏰', title: 'Daily training reminder', desc: 'We\'ll nudge you at your chosen time' },
              { icon: '🔥', title: 'Streak protection alerts', desc: 'Don\'t break your streak — trained yet?' },
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
          </View>
        )}
      </Animated.View>

      {/* CTA buttons */}
      <View style={ob.btnRow}>
        {step === 0 && (
          <TouchableOpacity style={ob.primaryBtn} onPress={() => animateTo(1)} activeOpacity={0.85}>
            <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>LET'S GO</Text>
              <Ionicons name="arrow-forward" size={18} color={C.black} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 1 && (
          <TouchableOpacity
            style={[ob.primaryBtn, !selectedLevel && { opacity: 0.45 }]}
            onPress={() => selectedLevel && animateTo(2)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>CONTINUE</Text>
              <Ionicons name="arrow-forward" size={18} color={C.black} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 2 && (
          <View style={{ width: '100%', gap: S.sm }}>
            <TouchableOpacity style={ob.primaryBtn} onPress={() => animateTo(3)} activeOpacity={0.85}>
              <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={18} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={ob.skipBtn} onPress={() => animateTo(3)} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Skip – I'll add my name later</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 3 && (
          <View style={{ width: '100%', gap: S.sm }}>
            <TouchableOpacity
              style={ob.primaryBtn}
              onPress={async () => {
                const status = await requestNotifPermission();
                if (status === 'granted') {
                  const settings = { ...DEFAULT_NOTIF_SETTINGS, enabled: true };
                  await _saveNotifSettings(settings);
                  await scheduleAllNotifications(settings, 1);
                }
                await finish();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={G.accent} style={ob.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.h4, { color: C.black, fontSize: 16, fontWeight: '900' }]}>ENABLE REMINDERS</Text>
                <Ionicons name="notifications-outline" size={18} color={C.black} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={ob.skipBtn} onPress={finish} activeOpacity={0.7}>
              <Text style={[T.small, { color: C.textMuted }]}>Skip – I'll set this up later</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const ob = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  deco1:          { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: C.accent + '08', top: -80, right: -80 },
  deco2:          { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.accent + '05', bottom: 80, left: -60 },
  deco3:          { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: C.accent + '06', top: '40%', right: -30 },
  dots:           { flexDirection: 'row', gap: S.sm, marginTop: S.lg, marginBottom: S.sm },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotActive:      { width: 24, height: 8, borderRadius: 4, backgroundColor: C.accent },
  dotDone:        { backgroundColor: C.accent + '55' },
  content:        { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: S.lg },
  slide:          { alignItems: 'center', width: '100%' },
  logoBg:         { width: 100, height: 100, borderRadius: 30, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  levelPill:      { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.bgCard, borderRadius: R.xxl, padding: S.md, marginBottom: S.sm, borderWidth: 2, borderColor: C.border, width: '100%' },
  levelPillActive:{ borderColor: C.accent, backgroundColor: C.accentDim },
  radio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: C.white },
  nameInput:      { width: '100%', backgroundColor: C.bgCard, borderRadius: R.xl, paddingHorizontal: S.md, paddingVertical: S.md, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border, textAlign: 'center' },
  btnRow:         { width: '100%', paddingHorizontal: S.lg, alignItems: 'center', gap: S.sm },
  primaryBtn:     { width: '100%', borderRadius: R.xxl, overflow: 'hidden' },
  primaryGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingVertical: S.md + 2 },
  skipBtn:        { paddingVertical: S.sm, alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3 – PROGRESS CHARTS (pure RN, no native chart libs required)
// ─────────────────────────────────────────────────────────────────────────────

// BarChart: renders vertical bars from a data array of { label, value } objects
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

function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { progress } = useContext(UserProgressContext);
  const { isPro } = useContext(PurchaseContext);
  const { computeForgivingStreak } = useContext(MilestoneContext);
  const { streak: forgivingStreak, frozen } = computeForgivingStreak(progress);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    return () => fadeAnim.setValue(0);
  }, []));

  const { submissions, completedLevels, streak, totalXP, joinDate } = progress;

  // --- Derive weekly sessions bar chart data (last 8 weeks) ---
  const weeklyData = (() => {
    const weeks = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
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
      weeks.push({ label: w === 0 ? 'Now' : `${mm}/${dd}`, value: count, isHighlight: w === 0 });
    }
    return weeks;
  })();

  // --- Personal records ---
  const bestWeek = Math.max(...weeklyData.map(w => w.value), 0);
  const totalSessions = submissions?.length ?? 0;
  const daysSinceJoin = joinDate
    ? Math.max(1, Math.floor((new Date() - new Date(joinDate)) / 86400000))
    : 1;
  const avgPerWeek = (totalSessions / (daysSinceJoin / 7)).toFixed(1);

  // --- Level timeline ---
  const levelTimeline = EXERCISE_LEVELS.map(l => ({
    level: l,
    done:  completedLevels.includes(l.id),
  }));

  const records = [
    { icon: '🏆', label: 'Total Sessions',    val: `${totalSessions}` },
    { icon: '🔥', label: 'Best Streak',        val: `${streak} days` },
    { icon: '📅', label: 'Best Week',           val: `${bestWeek} sessions` },
    { icon: '📈', label: 'Avg / Week',          val: `${avgPerWeek}` },
    { icon: '⭐', label: 'Total XP',            val: `${totalXP}` },
    { icon: '🏅', label: 'Levels Completed',   val: `${completedLevels.length}` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={pg.header}>
            <Text style={[T.label, { color: C.accent }]}>YOUR JOURNEY SO FAR</Text>
            <Text style={[T.h2, { fontSize: 32, fontWeight: '900', textTransform: 'uppercase' }]}>PROGRESS</Text>
          </View>

          {/* 3-stat row */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 20 }}>
            {[
              { icon: 'barbell-outline', val: progress.submissions.length, label: 'TOTAL WORKOUTS' },
              { icon: 'time-outline',    val: Math.round(progress.submissions.length * 0.25), label: 'HOURS TRAINED' },
              { icon: frozen ? 'snow-outline' : 'flame-outline', val: forgivingStreak, label: 'DAY STREAK' },
            ].map(s => (
              <View key={s.label} style={hd.statCard}>
                <Ionicons name={s.icon} size={24} color={C.accent} />
                <Text style={hd.statNum}>{s.val}</Text>
                <Text style={hd.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Sessions per week bar chart */}
          <View style={pg.chartCard}>
            <View style={pg.chartHeader}>
              <Text style={T.h4}>Sessions per Week</Text>
              <Text style={[T.cap, { color: C.accent }]}>Last 8 weeks</Text>
            </View>
            {submissions.length === 0 ? (
              <View style={pg.emptyChart}>
                <Text style={[T.small, { color: C.textMuted, textAlign: 'center' }]}>
                  No sessions yet. Start training to see your chart!
                </Text>
              </View>
            ) : (
              <BarChart data={weeklyData} color={C.accent} height={90} />
            )}
          </View>

          {/* Activity heatmap */}
          <View style={pg.chartCard}>
            <View style={pg.chartHeader}>
              <Text style={T.h4}>Training Activity</Text>
              <Text style={[T.cap, { color: C.accent }]}>Last 12 weeks</Text>
            </View>
            <ContribHeatmap submissions={submissions} />
          </View>

          {/* Level progression timeline */}
          <View style={pg.section}>
            <Text style={[T.h4, { marginBottom: S.sm }]}>Level Progression</Text>
            {levelTimeline.map((item, i) => (
              <View key={item.level.id} style={pg.timelineRow}>
                <View style={[pg.timelineDot, { backgroundColor: item.done ? C.accent : C.bgCardAlt, borderColor: item.done ? C.accent : C.border }]}>
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

          {/* Weekly breakdown line chart */}
          {submissions.length >= 3 && (
            <View style={pg.chartCard}>
              <View style={pg.chartHeader}>
                <Text style={T.h4}>Submission Volume</Text>
                <Text style={[T.cap, { color: C.accent }]}>Trend</Text>
              </View>
              <LineChart data={weeklyData.slice(-6)} color={C.accent} height={80} />
            </View>
          )}

          {/* Form score trend */}
          {(() => {
            const scored = submissions.filter(s => s.formScore != null).slice(0, 8).reverse();
            if (scored.length < 2) return null;
            const formData = scored.map((s, i) => ({
              label: `#${i + 1}`,
              value: s.formScore,
            }));
            const latestScore  = scored[scored.length - 1]?.formScore ?? 0;
            const earliestScore = scored[0]?.formScore ?? 0;
            const delta = latestScore - earliestScore;
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
                  Latest: {latestScore}% form quality · Based on {scored.length} AI-analyzed sessions
                </Text>
              </View>
            );
          })()}
        </Animated.View>
      </ScrollView>
      {!isPro() && <ProLockOverlay featureLabel="Progress Charts" featureIcon="📊" />}
    </View>
  );
}

const pg = StyleSheet.create({
  header:       { paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  section:      { marginHorizontal: S.md, marginBottom: S.lg },
  recordsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  recordCard:   { width: (width - S.md * 2 - S.sm * 2) / 3, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  chartCard:    { marginHorizontal: S.md, marginBottom: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border },
  chartHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  emptyChart:   { height: 80, alignItems: 'center', justifyContent: 'center' },
  timelineRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md, position: 'relative' },
  timelineDot:  { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: 2 },
  timelineLine: { position: 'absolute', left: 11, top: 26, width: 2, height: 28, zIndex: 0 },
  timelineContent:{ flex: 1, paddingLeft: S.sm },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2 – WEEKLY TRAINING PLAN
// ─────────────────────────────────────────────────────────────────────────────
const TRAINING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const { isPro } = useContext(PurchaseContext);
  const [plan,        setPlanState]  = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [activePhase, setActivePhase] = useState(null); // index into sessions

  useFocusEffect(useCallback(() => {
    loadPlan().then(loaded => {
      if (loaded) {
        setPlanState(loaded);
      } else {
        const monday = getThisMonday();
        const fresh = { ...DEFAULT_PLAN, startDate: monday };
        savePlan(fresh);
        setPlanState(fresh);
      }
      setLoading(false);
    });
  }, []));

  const today = new Date().toISOString().slice(0, 10);
  const isTrainingDay = plan ? isTodayTrainingDay(plan.trainingDays) : false;
  const weekOffset    = plan ? getPlanWeekOffset(plan.startDate) : 0;
  const programWeek   = PROGRAM_WEEKS[weekOffset % PROGRAM_WEEKS.length];
  const sessionDone   = plan?.completedSessions?.[today] === true;

  const toggleDay = async (dayIdx) => {
    if (!plan) return;
    const days = plan.trainingDays.includes(dayIdx)
      ? plan.trainingDays.filter(d => d !== dayIdx)
      : [...plan.trainingDays, dayIdx].sort((a, b) => a - b);
    const next = { ...plan, trainingDays: days };
    setPlanState(next);
    await savePlan(next);
  };

  const markTodayDone = async () => {
    if (!plan) return;
    const next = { ...plan, completedSessions: { ...plan.completedSessions, [today]: true } };
    setPlanState(next);
    await savePlan(next);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={wp.header}>
          <View>
            <Text style={[T.label, { color: C.accent }]}>YOUR TRAINING PLAN</Text>
            <Text style={[T.h2, { fontSize: 32, fontWeight: '900', textTransform: 'uppercase' }]}>THIS WEEK</Text>
          </View>
          <View style={[wp.weekBadge, { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]}>
            <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Week {weekOffset + 1}</Text>
          </View>
        </View>

        {/* Week label card */}
        <View style={wp.focusCard}>
          <LinearGradient colors={['#1C1D21', '#16171A']} style={wp.focusGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[T.label, { color: C.accent, marginBottom: 4 }]}>CURRENT PROGRAM</Text>
            <Text style={[T.h3, { color: C.text, marginBottom: 4 }]}>{programWeek.label}</Text>
            <Text style={[T.small, { color: C.textSub, lineHeight: 18 }]}>{programWeek.focus}</Text>
          </LinearGradient>
        </View>

        {/* Week calendar strip */}
        <View style={wp.calSection}>
          <Text style={[T.h4, { marginBottom: S.sm }]}>Training Days</Text>
          <View style={wp.dayRow}>
            {TRAINING_DAYS.map((label, idx) => {
              const isTrain = plan?.trainingDays.includes(idx);
              const thisDate = (() => {
                const monday = new Date(plan?.startDate || getThisMonday());
                monday.setDate(monday.getDate() + idx);
                return monday.toISOString().slice(0, 10);
              })();
              const done = plan?.completedSessions?.[thisDate] === true;
              const isToday = thisDate === today;
              return (
                <TouchableOpacity
                  key={label}
                  style={[wp.dayCell, isToday && wp.dayCellToday, isTrain && !isToday && wp.dayCellActive]}
                  onPress={() => toggleDay(idx)}
                  activeOpacity={0.75}
                >
                  <Text style={[T.cap, { color: isToday ? C.black : isTrain ? C.accent : C.textMuted, fontWeight: isToday || isTrain ? '700' : '400', fontSize: 10 }]}>{label}</Text>
                  {done
                    ? <Ionicons name="checkmark-circle" size={14} color={isToday ? C.black : C.accent} style={{ marginTop: 2 }} />
                    : isTrain || isToday
                      ? <View style={[wp.dayDot, { backgroundColor: isToday ? C.black : C.accent }]} />
                      : <View style={[wp.dayDot, { backgroundColor: C.border }]} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[T.cap, { marginTop: S.xs, color: C.textMuted }]}>Tap a day to toggle training/rest</Text>
        </View>

        {/* Today's status */}
        <View style={[wp.todayCard, { borderColor: isTrainingDay ? C.accent + '44' : C.border }]}>
          <View style={[wp.todayIcon, { backgroundColor: isTrainingDay ? C.accentDim : C.bgCardAlt }]}>
            <Text style={{ fontSize: 22 }}>{isTrainingDay ? (sessionDone ? '✅' : '🤸') : '😴'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.h4}>
              {isTrainingDay ? (sessionDone ? 'Session complete!' : 'Training day') : 'Rest day'}
            </Text>
            <Text style={[T.small, { lineHeight: 18 }]}>
              {isTrainingDay
                ? sessionDone
                  ? 'Great work! Come back tomorrow.'
                  : 'Your session is ready below. Tap phases to expand.'
                : 'Focus on recovery — see active rest suggestions below.'}
            </Text>
          </View>
          {isTrainingDay && !sessionDone && (
            <TouchableOpacity style={wp.startBtn} onPress={markTodayDone} activeOpacity={0.85}>
              <LinearGradient colors={G.accent} style={wp.startGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[T.cap, { color: C.black, fontWeight: '800' }]}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {isTrainingDay ? (
          <>
            <Text style={[T.h4, { marginHorizontal: S.md, marginTop: S.lg, marginBottom: S.sm }]}>Today's Session</Text>
            {programWeek.sessions.map((session, i) => (
              <TouchableOpacity
                key={session.phase}
                style={[wp.phaseCard, activePhase === i && wp.phaseCardActive]}
                onPress={() => setActivePhase(activePhase === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={wp.phaseHeader}>
                  <Text style={[T.h4, { flex: 1 }]}>{session.phase}</Text>
                  <Ionicons name={activePhase === i ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
                </View>
                {activePhase === i && (
                  <View style={wp.phaseBody}>
                    <View style={wp.phaseDivider} />
                    {session.exercises.map((ex, j) => (
                      <View key={j} style={wp.exRow}>
                        <View style={wp.exBullet} />
                        <Text style={[T.small, { flex: 1, lineHeight: 20 }]}>{ex}</Text>
                      </View>
                    ))}
                    {i === 1 && (
                      <TouchableOpacity
                        style={wp.recordCta}
                        onPress={() => navigation.navigate('WristWarmup', { levelId: progress.currentLevel })}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={G.accent} style={wp.recordGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Ionicons name="videocam" size={14} color={C.black} />
                          <Text style={[T.cap, { color: C.black, fontWeight: '800' }]}>Record This Skill</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', shadowColor: '#D7FF3D', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 0, marginBottom: 20 }}>
              <Ionicons name="moon" size={40} color={C.accent} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 8 }}>REST DAY</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.textMuted, textAlign: 'center' }}>Recovery is part of training</Text>
          </View>
        )}

        {/* Program progress */}
        <View style={[wp.progressSection, { marginTop: S.lg }]}>
          <View style={wp.progressHeader}>
            <Text style={T.h4}>Program Progress</Text>
            <Text style={[T.cap, { color: C.accent }]}>Week {weekOffset + 1} of {PROGRAM_WEEKS.length}</Text>
          </View>
          <ProgressBar value={(weekOffset + 1) / PROGRAM_WEEKS.length} color={C.accent} height={6} />
          <View style={wp.weeksList}>
            {PROGRAM_WEEKS.map((w, i) => (
              <View key={i} style={[wp.weekPill, i < weekOffset && { backgroundColor: C.successDim, borderColor: C.success + '44' }, i === weekOffset && { backgroundColor: C.accentDim, borderColor: C.accent + '44' }]}>
                <Ionicons
                  name={i < weekOffset ? 'checkmark-circle' : i === weekOffset ? 'radio-button-on' : 'ellipse-outline'}
                  size={13}
                  color={i < weekOffset ? C.success : i === weekOffset ? C.accent : C.textMuted}
                />
                <Text style={[T.cap, { flex: 1, color: i <= weekOffset ? C.text : C.textMuted, fontWeight: i === weekOffset ? '700' : '400' }]}>
                  {w.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      {!isPro() && <ProLockOverlay featureLabel="Weekly Training Plan" featureIcon="📋" />}
    </View>
  );
}

const wp = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm },
  weekBadge:      { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.full, borderWidth: 1 },
  focusCard:      { marginHorizontal: S.md, marginBottom: S.md, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  focusGrad:      { padding: S.lg },
  calSection:     { marginHorizontal: S.md, marginBottom: S.md },
  dayRow:         { flexDirection: 'row', gap: S.xs },
  dayCell:        { flex: 1, alignItems: 'center', paddingVertical: S.sm, borderRadius: R.lg, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  dayCellActive:  { backgroundColor: C.bgCardElevated, borderColor: C.accent + '66' },
  dayCellToday:   { backgroundColor: C.accent, borderColor: C.accent, borderWidth: 2 },
  dayDot:         { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  todayCard:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginHorizontal: S.md, marginBottom: S.md, padding: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1 },
  todayIcon:      { width: 48, height: 48, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  startBtn:       { borderRadius: R.full, overflow: 'hidden' },
  startGrad:      { paddingHorizontal: S.md, paddingVertical: S.sm },
  phaseCard:      { marginHorizontal: S.md, marginBottom: S.xs, backgroundColor: C.bgCard, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  phaseCardActive:{ borderColor: C.accent + '66' },
  phaseHeader:    { flexDirection: 'row', alignItems: 'center', padding: S.md },
  phaseBody:      { paddingHorizontal: S.md, paddingBottom: S.md },
  phaseDivider:   { height: 1, backgroundColor: C.border, marginBottom: S.sm },
  exRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.xs },
  exBullet:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 7 },
  recordCta:      { marginTop: S.sm, borderRadius: R.full, overflow: 'hidden' },
  recordGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.sm },
  restCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginHorizontal: S.md, marginBottom: S.xs, padding: S.md, backgroundColor: C.bgCard, borderRadius: R.xl, borderWidth: 1, borderColor: C.border },
  progressSection:{ marginHorizontal: S.md },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  weeksList:      { marginTop: S.sm, gap: S.xs },
  weekPill:       { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.sm, backgroundColor: C.bgCard, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
});

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
          <Text style={{ fontSize: 52 }}>🤸</Text>
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
      await signUp(email.trim().toLowerCase(), password, displayName.trim());
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
  welcomeLogo:   { width: 100, height: 100, borderRadius: 30, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '44', alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
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
  const { isPro, showPaywall } = useContext(PurchaseContext);

  // Plan and Progress tabs are Pro-only features
  const PRO_TABS = new Set(['Plan', 'Progress']);

  return (
    <View style={[tb.bar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;
        const isProTab  = PRO_TABS.has(route.name) && !isPro();

        const iconName = {
          Home:     isFocused ? 'home'         : 'home-outline',
          Levels:   isFocused ? 'barbell'      : 'barbell-outline',
          Plan:     isFocused ? 'calendar'     : 'calendar-outline',
          Progress: isFocused ? 'stats-chart'  : 'stats-chart-outline',
          Profile:  isFocused ? 'person'       : 'person-outline',
        }[route.name];

        const onPress = () => {
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
// The main navigation stack for the authenticated, post-onboarding app
function MainApp() {
  const { loading } = useContext(UserProgressContext);
  return (
    <OfflineProvider>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
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
            <Stack.Screen name="WristWarmup"      component={WristWarmupScreen}      options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="VideoSubmission"  component={VideoSubmissionScreen}  options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="SubmissionReview" component={SubmissionReviewScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack.Navigator>
        </NavigationContainer>
        <SplashScreen visible={loading} />
      </View>
    </OfflineProvider>
  );
}

// Auth navigator (unauthenticated / pre-onboarding)
function AuthApp({ onAuthSuccess, onSkip }) {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Welcome"         component={WelcomeScreen} />
        <Stack.Screen name="SignUp"          component={SignUpScreen} />
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onAuthSuccess={onAuthSuccess} onSkip={onSkip} />}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
        <Stack.Screen name="AppOnboarding">
          {() => (
            <PurchaseProvider>
              <MilestoneProvider>
                <UserProgressProvider>
                  <OnboardingScreen onComplete={onSkip} />
                </UserProgressProvider>
              </MilestoneProvider>
            </PurchaseProvider>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Defined outside App() so it is a stable component reference and never
// re-created on each render — prevents unnecessary remounts of the auth tree.
function AuthStateGate({ onboardingDone, onboardingChecked, checkOnboarding, setOnboardingDone }) {
  const { authLoading, isAuthenticated } = useContext(AuthContext);
  if (authLoading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SplashScreen visible />
      </View>
    );
  }
  // Authenticated + onboarding done → main app
  if (isAuthenticated && onboardingDone) {
    return (
      <PurchaseProvider>
        <MilestoneProvider>
          <UserProgressProvider onReset={checkOnboarding}>
            <MainApp />
          </UserProgressProvider>
        </MilestoneProvider>
      </PurchaseProvider>
    );
  }
  // Authenticated but onboarding not done → onboarding
  if (isAuthenticated && !onboardingDone) {
    return (
      <PurchaseProvider>
        <MilestoneProvider>
          <UserProgressProvider>
            <OnboardingScreen onComplete={(refresh) => {
              if (refresh) refresh();
              setOnboardingDone(true);
            }} />
          </UserProgressProvider>
        </MilestoneProvider>
      </PurchaseProvider>
    );
  }
  // Not authenticated → show auth flow
  return (
    <AuthApp
      onAuthSuccess={() => checkOnboarding()}
      onSkip={(refresh) => {
        if (refresh) refresh();
        setOnboardingDone(true);
      }}
    />
  );
}

export default function App() {
  const [onboardingDone,    setOnboardingDone]    = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const checkOnboarding = useCallback(() => {
    setOnboardingChecked(false);
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(val => { setOnboardingDone(val === 'true'); setOnboardingChecked(true); })
      .catch(()  => { setOnboardingDone(false); setOnboardingChecked(true); });
  }, []);

  useEffect(() => { checkOnboarding(); }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthStateGate
          onboardingDone={onboardingDone}
          onboardingChecked={onboardingChecked}
          checkOnboarding={checkOnboarding}
          setOnboardingDone={setOnboardingDone}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

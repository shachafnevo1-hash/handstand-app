# HandstandHub — מה עשינו ומה נשאר

---

## ✅ מה שעשינו כבר

### Backend (Supabase)
- [x] מסד נתונים מלא: users, user_progress, user_settings, subscriptions
- [x] Auth: הרשמה + כניסה עם email + password
- [x] Cloud sync של progress (XP, level, streak, hold times)
- [x] Server-side level recompute — הרמה מחושבת בצד שרת מהתשובות לחידון (migration 003)
- [x] Entitlements view — בדיקת מנוי/ניסיון
- [x] start_trial RPC — מנוי ניסיון של 7 ימים (mock)
- [x] Edge Function `ai-check` — proxy לאנתרופיק, מקבל תמונת base64, מחזיר ניתוח handstand

### App — תשתית
- [x] React Native / Expo SDK 54
- [x] ניווט מלא: tabs + stack navigator
- [x] Dark theme מלא עם design system (צבעים, מרווחים, טיפוגרפיה)
- [x] Offline-first: AsyncStorage + SecureStore
- [x] Input sanitization (cleanDisplayName, cleanEmail)
- [x] AI_CHECK_URL ב-runtime config (app.json)
- [x] Camera mode fix — ממתין שהמצלמה מוכנה אחרי החלפת מצב לפני takePicture
- [x] Offline banner + AI check queue (שמירה לשליחה מאוחרת)

### App — מסכים
- [x] **Onboarding** — חידון 3 שאלות, מציב רמה
- [x] **Home** — stats, streak, quick access
- [x] **Levels** — רשימת 5 רמות עם progress
- [x] **Level Detail** — סרטוני הדרכה (YouTube), drills
- [x] **Wrist Warmup** — 8 תרגילים, טיימר
- [x] **Video Submission** — הקלטת 15 שניות + AI check
- [x] **Submission Review** — תוצאת AI, form feedback, star rating
- [x] **Progress** — גרפים, XP history, hold times
- [x] **Weekly Plan** — תוכנית שבועית
- [x] **Profile** — הגדרות, כניסה/יציאה
- [x] **Paywall** — מסך מנוי (mock, beta חינמי)

---

## 🔴 מה שנשאר — לפי סדר עדיפות

---

### 1. הפעלת ה-AI (הכי דחוף)

**מה חסר:** מפתח API של Anthropic לא מוגדר בסופאבייס.

**מה אני עשיתי כבר:**
- ביטלתי את בדיקת ה-entitlement בבטא — כל משתמש מחובר יכול להשתמש ב-AI
- תיקנתי את המצלמה — עכשיו ממתינה שהמצלמה מוכנה לפני הצילום

**מה אתה צריך לעשות:**
```
1. supabase secrets set ANTHROPIC_API_KEY=sk-ant-XXXXXX --project-ref kkilkggghydodfnbeoyw
2. supabase functions deploy ai-check --project-ref kkilkggghydodfnbeoyw
3. git add . && git commit -m "fix: bypass entitlement + camera ready wait" && git push
```

---

### 2. אפיקון + Splash Screen

**מה חסר:** האייקון הרשמי של האפליקציה (1024x1024px PNG) + splash screen.

**מה אני יכול לעשות:** לעצב ב-SVG ולהמיר לפורמט הנכון.
**מה אתה צריך לעשות:** לאשר את העיצוב ולהוסיף לפרויקט.

---

### 3. Push Notifications — הגדרה מלאה

**מה בנוי:** קוד ה-notifications קיים אבל לא מוגדר.

**מה חסר:**
- EAS project setup (eas.json)
- FCM key לאנדרואיד (Google Firebase)
- APNs key לאייפון (Apple Developer account נדרש)

**מה אתה צריך לעשות:** לפתוח Apple Developer Account ($99/year) — זה בלוקר לכל שאר השלבים.

---

### 4. Voice Timer — הפעלה מחדש

**מה בנוי:** הקוד קיים אבל disabled כי `@react-native-voice/voice` לא עובד ב-Expo Go.

**מה חסר:** EAS Build (native build) כדי שהpackage יעבוד.

**מה אני יכול לעשות:** להפעיל מחדש אחרי שה-build מוגדר.

---

### 5. Community Screen

**מה בנוי:** Tab קיים אבל אין מסך.

**מה חסר:** בניית מסך community — פוסטים, leaderboard, challenges.

**מה אני יכול לעשות:** לבנות את כל המסך.

---

### 6. Payments אמיתיים (RevenueCat)

**מה בנוי:** Mock בלבד — כולם Pro בחינם.

**מה חסר:**
- Apple Developer Account ($99/year) → להגדיר In-App Purchase
- Google Play Developer Account ($25) → להגדיר subscription
- RevenueCat account (חינמי עד 10K MAU) → לחבר ל-Apple/Google
- להחליף את `isPro()` ב-RevenueCat SDK

**מה אני יכול לעשות:** לכתוב את כל קוד RevenueCat אחרי שהחשבונות קיימים.

---

### 7. EAS Build — Native Build

**מה חסר:** בלי זה אי אפשר:
- Voice timer
- Push notifications
- Submit to App Store/Google Play
- TestFlight בטא

**מה אתה צריך לעשות:**
```
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
```

---

### 8. App Store + Google Play — הגשה

**תנאי מוקדם:** Apple Developer Account + EAS Build מוכן.

**מה חסר:**
- Screenshots (6.7" iPhone, 12.9" iPad)
- App description באנגלית
- Privacy policy URL
- Age rating questionnaire

**מה אני יכול לעשות:** לכתוב את תיאור האפליקציה, Privacy Policy, ולהכין את ה-metadata.

---

## סדר הפעולות המומלץ

```
שלב 1 (עכשיו):    הפעלת AI — set secret + deploy function
שלב 2 (השבוע):   Apple Developer Account + EAS Build setup
שלב 3 (אחרי):    Voice timer + Push notifications
שלב 4 (אחרי):    Community screen + polish
שלב 5 (לפני launch): RevenueCat + real payments
שלב 6 (launch):  App Store + Google Play submission
```

---

*עודכן: אפריל 2026*

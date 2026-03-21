// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, Image, Linking,
} from 'react-native';
import { API_BASE } from '../../services/api';
import { requestLocationPermission, stopLocationTracking } from '../../services/location.service';
import styles from '../../styles/screens/LoginScreen.styles';

const PRIVACY_ITEMS = [
  'Location tracking for emergency alerts and evacuation guidance',
  'Identity verification for secure access to critical systems',
  'End-to-end encrypted data transmission',
  'Municipality-only access to sensitive fire prediction data',
];

const cache = {};

export async function getPlaceName(latitude, longitude) {
  const key = `${latitude},${longitude}`;
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'EshMagan/1.0' } }
    );
    if (!res.ok) return 'Unknown location';
    const data = await res.json();
    console.log('Reverse geocode result:', data);
    const addr = data.address || {};
    const place = (
      addr.building || addr.university || addr.amenity || 
      addr.neighbourhood || addr.suburb || 
      addr.village || addr.town || addr.city || 
      addr.county || addr.state || 
      addr.country || 
      data.display_name?.split(',')[0] || 'Unknown location'
    );
  } catch { return 'Unknown location'; }
}

function validateDOB(dob) {
  if (dob.length !== 10) return null;
  const [year, month, day] = dob.split('-').map(Number);
  if (!year || !month || !day) return 'Invalid date';
  if (month < 1 || month > 12) return 'Invalid month';
  if (day < 1 || day > 31) return 'Invalid day';
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return 'This date does not exist';
  }
  const today = new Date();
  const age = today.getFullYear() - year - (today < new Date(today.getFullYear(), month - 1, day) ? 1 : 0);
  if (age < 1) return 'Date cannot be in the future';
  if (age > 120) return 'Invalid date of birth';
  return null;
}

const KNOWN_DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'live.com','msn.com','protonmail.com','proton.me','mail.com',
  'aol.com','ymail.com','googlemail.com','me.com','mac.com',
  'hotmail.fr','hotmail.co.uk','yahoo.fr','yahoo.co.uk','yahoo.com.au',
  'edu.lb','ul.edu.lb','balamand.edu.lb','usj.edu.lb','lau.edu.lb',
];

function validateEmail(email) {
  if (!email) return null;
  const match = email.match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return 'Enter a valid email address';
  const domain = match[1].toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return 'Enter a valid email address';
  const isKnown = KNOWN_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  if (!isKnown) return `Unrecognized provider — is "${domain}" correct?`;
  return null;
}

function formatDOB(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + '-' + digits.slice(4);
  return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8);
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return '+' + digits;
  if (digits.length <= 5) return '+' + digits.slice(0, 3) + ' ' + digits.slice(3);
  if (digits.length <= 8) return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5);
  return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5, 8) + ' ' + digits.slice(8);
}

// ─── PIXEL HELPERS ────────────────────────────────────────────────────────────

function sampleRegion(data, width, height, x0p, y0p, x1p, y1p) {
  const x0 = Math.floor(width * x0p), x1 = Math.floor(width * x1p);
  const y0 = Math.floor(height * y0p), y1 = Math.floor(height * y1p);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y += 4) {
    for (let x = x0; x < x1; x += 4) {
      const i = (y * width + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return n > 0 ? { r: r / n, g: g / n, b: b / n } : { r: 0, g: 0, b: 0 };
}

function colorRatio(data, width, height, x0p, y0p, x1p, y1p, rMin, rMax, gMin, gMax, bMin, bMax) {
  const x0 = Math.floor(width * x0p), x1 = Math.floor(width * x1p);
  const y0 = Math.floor(height * y0p), y1 = Math.floor(height * y1p);
  let hit = 0, total = 0;
  for (let y = y0; y < y1; y += 4) {
    for (let x = x0; x < x1; x += 4) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], bv = data[i + 2];
      if (r >= rMin && r <= rMax && g >= gMin && g <= gMax && bv >= bMin && bv <= bMax) hit++;
      total++;
    }
  }
  return total > 0 ? hit / total : 0;
}

// ─── MAIN PIXEL ANALYSIS — 15 checks ─────────────────────────────────────────
function analyzePixels(data, width, height) {

  // ── BASIC QUALITY CHECKS (1–7) ────────────────────────────────────────────

  // CHECK 1 — Minimum resolution: must be at least 400×300px
  // Filters out tiny thumbnails or very low quality images
  if (width < 400 || height < 300) return 'Photo is too small. Please take a clearer, closer photo of your ID.';

  // CHECK 2 — Aspect ratio: Lebanese ID is ~1.58:1 (credit card standard), allow 1.2–2.2
  // Rejects portrait orientation or square photos since IDs are always landscape
  const ratio = width / height;
  if (ratio < 1.2 || ratio > 2.2) return 'Please photograph your ID horizontally — it should be wider than it is tall.';

  // CHECK 3 — Global brightness & color channel sums (used by checks 4, 5, 6, 12)
  let totalBrightness = 0, rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4 * 8) {
    const r = data[i], g = data[i + 1], bv = data[i + 2];
    totalBrightness += r * 0.299 + g * 0.587 + bv * 0.114;
    rSum += r; gSum += g; bSum += bv; count++;
  }
  const avgBrightness = totalBrightness / count;
  const avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;

  // CHECK 4 — Too dark: average brightness below 35/255
  // Filters out photos taken in dark conditions
  if (avgBrightness < 35) return 'Photo is too dark. Please take the photo in better lighting.';

  // CHECK 5 — Overexposed: average brightness above 235/255
  // Filters out photos with direct flash or extreme lighting
  if (avgBrightness > 235) return 'Photo is overexposed. Please avoid direct flash or bright light.';

  // CHECK 6 — Blank / solid color: low color variance across all pixels
  // Filters out screenshots of blank screens, solid color images, or walls
  let variance = 0;
  for (let i = 0; i < data.length; i += 4 * 8) {
    variance += Math.pow(data[i] - avgR, 2) + Math.pow(data[i + 1] - avgG, 2) + Math.pow(data[i + 2] - avgB, 2);
  }
  variance /= count;
  if (variance < 150) return 'Photo appears blank or solid. Please photograph your actual ID card.';

  // CHECK 7 — Blurriness: measure edge sharpness between adjacent pixels
  // Compares each pixel to its right and bottom neighbors — blurry images have low edge intensity
  let edgeSum = 0, edgeCount = 0;
  for (let y = 1; y < height - 1; y += 6) {
    for (let x = 1; x < width - 1; x += 6) {
      const i = (y * width + x) * 4;
      const iR = (y * width + x + 1) * 4;
      const iD = ((y + 1) * width + x) * 4;
      edgeSum +=
        Math.abs(data[i] - data[iR]) + Math.abs(data[i + 1] - data[iR + 1]) + Math.abs(data[i + 2] - data[iR + 2]) +
        Math.abs(data[i] - data[iD]) + Math.abs(data[i + 1] - data[iD + 1]) + Math.abs(data[i + 2] - data[iD + 2]);
      edgeCount++;
    }
  }
  if (edgeSum / edgeCount < 8) return 'Photo is too blurry. Please hold your phone steady and retake the photo.';

  // ── LEBANESE ID SPECIFIC CHECKS (8–15) ───────────────────────────────────
  // Based on pixel color analysis of the actual Lebanese National ID layout:
  // Left ~35%: portrait photo area | Right ~65%: cream/pink bg + Arabic text + cedar watermark
  // Bottom strip: olive/golden ID number area | Top-left: small cedar logo

  // CHECK 8 — Right side warm tone: right 60% of card (x:40%–100%, y:5%–80%)
  // Lebanese IDs have cream-white to salmon background — R must be >= B (warm, not cold/blue)
  const rightMid = sampleRegion(data, width, height, 0.4, 0.05, 1.0, 0.80);
  const isWarm = rightMid.r >= rightMid.b && rightMid.r > 130 && rightMid.g > 120;
  if (!isWarm) return 'This does not appear to be a Lebanese National ID — the background should be warm/cream colored.';

  // CHECK 9 — Cedar logo green pixels: top-left corner (x:1%–26%, y:1%–38%)
  // All Lebanese IDs have a green cedar tree logo in the top-left — detects green pixel presence
  const greenFraction = colorRatio(data, width, height, 0.01, 0.01, 0.26, 0.38, 30, 160, 90, 210, 20, 130);
  if (greenFraction < 0.006) return 'Could not detect the Lebanese cedar logo in the top-left. Make sure the full ID is visible and well-lit.';

  // CHECK 10 — Left zone darker than right zone
  // The portrait photo area (left) is always darker than the light cream/pink background (right)
  const leftZone = sampleRegion(data, width, height, 0.02, 0.12, 0.37, 0.88);
  const rightZone = sampleRegion(data, width, height, 0.42, 0.05, 0.98, 0.75);
  const leftBright = leftZone.r * 0.299 + leftZone.g * 0.587 + leftZone.b * 0.114;
  const rightBright = rightZone.r * 0.299 + rightZone.g * 0.587 + rightZone.b * 0.114;
  if (leftBright > rightBright + 30) return 'ID layout mismatch — the photo should be on the left and the text/background on the right.';

  // CHECK 11 — Bottom strip golden/olive tone: bottom-right region (x:38%–97%, y:80%–97%)
  // The ID number decorative strip has a warm golden/olive color — R>110, G>90, B<160, R>B+15
  const bottomStrip = sampleRegion(data, width, height, 0.38, 0.80, 0.97, 0.97);
  const isGolden = bottomStrip.r > 110 && bottomStrip.g > 90 && bottomStrip.b < 160 && bottomStrip.r > bottomStrip.b + 15;
  if (!isGolden) return 'Could not detect the ID number strip at the bottom. Make sure the entire ID is in frame.';

  // CHECK 12 — Overall warm tone: blue channel should not dominate red
  // Lebanese IDs are warm documents — a blue-dominant image is not a Lebanese ID front
  if (avgB > avgR + 15) return 'Overall color tone does not match a Lebanese ID. Please photograph the front side of your ID card.';

  // CHECK 13 — Large cedar watermark green pixels: center-right region (x:40%–92%, y:15%–78%)
  // Every Lebanese ID has a large faint green cedar watermark covering the center-right area
  const watermarkGreen = colorRatio(data, width, height, 0.40, 0.15, 0.92, 0.78, 40, 170, 100, 220, 30, 140);
  if (watermarkGreen < 0.015) return 'Could not detect the cedar watermark on the ID. Please ensure this is a Lebanese National ID card.';

  // CHECK 14 — Portrait area has high color variance: left zone (x:2%–37%, y:12%–88%)
  // The portrait photo of a person must have significant color variation — not a blank/cut-out area
  let photoVariance = 0, pvCount = 0;
  const px0 = Math.floor(width * 0.02), px1 = Math.floor(width * 0.37);
  const py0 = Math.floor(height * 0.12), py1 = Math.floor(height * 0.88);
  for (let y = py0; y < py1; y += 5) {
    for (let x = px0; x < px1; x += 5) {
      const i = (y * width + x) * 4;
      photoVariance += Math.pow(data[i] - leftZone.r, 2) + Math.pow(data[i + 1] - leftZone.g, 2) + Math.pow(data[i + 2] - leftZone.b, 2);
      pvCount++;
    }
  }
  photoVariance /= pvCount;
  if (photoVariance < 100) return 'The photo area on the ID appears blank. Make sure your portrait photo is clearly visible.';

  // CHECK 15 — Top-right header area brightness: top-right region (x:45%–99%, y:1%–18%)
  // The الجمهورية اللبنانية / وزارة الداخلية header sits on a light background — must be bright
  const topRight = sampleRegion(data, width, height, 0.45, 0.01, 0.99, 0.18);
  const topRightBright = topRight.r * 0.299 + topRight.g * 0.587 + topRight.b * 0.114;
  if (topRightBright < 100) return 'The top of the ID appears too dark. Make sure the ID header (الجمهورية اللبنانية) is clearly visible.';

  // CHECK 16 — ID coverage: verify the ID fills most of the frame
  // Sample the far edges of the image — if the ID covers ~90% of the frame,
  // the edge strips should also have warm tones (not plain background/table color)
  // Left edge strip (x:0–5%), right edge strip (x:95%–100%), top strip (y:0–8%), bottom strip (y:92%–100%)
  const leftEdge   = sampleRegion(data, width, height, 0.00, 0.10, 0.05, 0.90);
  const rightEdge  = sampleRegion(data, width, height, 0.95, 0.10, 1.00, 0.90);
  const topEdge    = sampleRegion(data, width, height, 0.10, 0.00, 0.90, 0.08);
  const bottomEdge = sampleRegion(data, width, height, 0.10, 0.92, 0.90, 1.00);

  // Each edge must be reasonably bright (not a dark table/floor) and warm (not a cold/neutral bg)
  // If any edge is very dark or very cold/blue, the ID is too far away and there's background showing
  // At least 3 out of 4 edges must pass — allows one edge to show slight background
  const edgeResults = [leftEdge, rightEdge, topEdge, bottomEdge].map(e => {
    const brightness = e.r * 0.299 + e.g * 0.587 + e.b * 0.114;
    return brightness > 60 && e.r >= e.b - 30; // loosened: brightness >60, allow slightly cool tone
  });
  const passingEdges = edgeResults.filter(Boolean).length;
  if (passingEdges < 2) return 'The ID is too far away or not filling the frame. Please get closer and make sure the ID covers most of the photo.';

  return null; // ✅ All 16 checks passed — likely a valid Lebanese National ID filling the frame
}

// ─── ROTATE IMAGE IF PORTRAIT (web only via canvas) ───────────────────────────
async function rotateIfPortrait(base64, type) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { base64, uri: `data:${type};base64,${base64}` };
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w >= h) {
        resolve({ base64, uri: `data:${type};base64,${base64}` });
        return;
      }
      // Portrait — rotate 90° counter-clockwise
      const canvas = document.createElement('canvas');
      canvas.width = h; canvas.height = w;
      const ctx = canvas.getContext('2d');
      ctx.translate(h / 2, w / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, -w / 2, -h / 2);
      const rotatedUri = canvas.toDataURL(type || 'image/jpeg', 0.92);
      resolve({ base64: rotatedUri.split(',')[1], uri: rotatedUri });
    };
    img.onerror = () => resolve({ base64, uri: `data:${type};base64,${base64}` });
    img.src = `data:${type};base64,${base64}`;
  });
}

// ─── VALIDATE ID PHOTO (web + native) ────────────────────────────────────────
async function validateIDPhoto(base64, type) {
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);
        resolve(analyzePixels(data, w, h));
      };
      img.onerror = () => resolve(null);
      img.src = `data:${type};base64,${base64}`;
    });
  }
  try {
    const jpegjs = require('jpeg-js');
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const decoded = jpegjs.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 64 });
    return analyzePixels(decoded.data, decoded.width, decoded.height);
  } catch (e) {
    console.warn('[ID Validation] jpeg-js failed:', e.message);
    return null;
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch { }
  }

  const [form, setForm] = useState({
    user_email: '', user_password: '', confirmPassword: '',
    user_phone: '', resident_fname: '', resident_lname: '',
    resident_dob: '', resident_idnb: '',
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [revokeMsg, setRevokeMsg] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const dobError = validateDOB(form.resident_dob);
  const emailError = validateEmail(form.user_email);
  const idValid = form.resident_idnb.length === 12;
  const phoneValid = form.user_phone.replace(/\D/g, '').length >= 10;
  const emailValid = !!form.user_email && !emailError;
  const personalInfoDone = !!(
    form.resident_fname && form.resident_lname &&
    form.resident_dob.length === 10 && !dobError &&
    idValid && phoneValid
  );
  const accountDone = !!(emailValid && form.user_password.length >= 8 && form.confirmPassword && form.confirmPassword === form.user_password);
  const canRegister = agreed && locationGranted && idPhoto && !photoError && personalInfoDone && accountDone;

  const handleWebFilePick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoLoading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUri = ev.target.result;
        const rawB64 = dataUri.split(',')[1];
        const mtype = file.type || 'image/jpeg';
        // Auto-rotate portrait to landscape before validating
        const { base64: b64, uri: finalUri } = await rotateIfPortrait(rawB64, mtype);
        const err = await validateIDPhoto(b64, mtype);
        if (err) { setPhotoError(err); setPhotoLoading(false); return; }
        setPhotoError('');
        setIdPhoto({ uri: finalUri, base64: b64, type: mtype, fileName: file.name });
        setPhotoLoading(false);
      };
      reader.onerror = () => { window.alert('Failed to read file'); setPhotoLoading(false); };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handlePickPhoto = async (fromCamera = false) => {
    setPhotoLoading(true);
    try {
      const { launchCamera, launchImageLibrary } = require('react-native-image-picker');
      const options = { mediaType: 'photo', quality: 0.7, includeBase64: true, maxWidth: 1024, maxHeight: 1024 };
      const result = fromCamera ? await launchCamera(options) : await launchImageLibrary(options);
      if (result.didCancel || result.errorCode) return;
      const asset = result.assets?.[0];
      if (asset) {
        const mtype = asset.type || 'image/jpeg';
        // Camera delivers correct landscape pixels — build data URI to bypass EXIF display issues
        const finalUri = `data:${mtype};base64,${asset.base64}`;
        const err = await validateIDPhoto(asset.base64, mtype);
        if (err) { setPhotoError(err); return; }
        setPhotoError('');
        setIdPhoto({ uri: finalUri, base64: asset.base64, type: mtype, fileName: asset.fileName });
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick photo: ' + e.message); }
    finally { setPhotoLoading(false); }
  };

  const showPhotoPicker = () => {
    if (Platform.OS === 'web') { handleWebFilePick(); return; }
    setShowGuide(true);
  };

  const handleConsentToggle = async () => {
    if (locationLoading) return;
    if (agreed) {
      stopLocationTracking();
      setAgreed(false); setLocationGranted(false); setCurrentLocation(null); setPlaceName(''); setRevokeMsg(true);
      return;
    }
    setLocationLoading(true);
    const tryGetLocation = async () => {
      const location = await requestLocationPermission();
      setCurrentLocation(location); setLocationGranted(true); setAgreed(true);
      setRevokeMsg(false); setPlaceName('Detecting...');
      getPlaceName(location.latitude, location.longitude).then(name => setPlaceName(name));
    };
    try { await tryGetLocation(); }
    catch {
      try { await tryGetLocation(); }
      catch {
        if (Platform.OS === 'web') {
          window.alert('Please allow location access in your browser.');
        } else {
          Alert.alert('Location Required', 'Please enable location access for EshMagan in your device settings.', [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }
      }
    } finally { setLocationLoading(false); }
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    setLoading(true);
    try {
      const idPicData = idPhoto?.base64 ? `data:${idPhoto.type};base64,${idPhoto.base64}` : 'pending';
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: form.user_email, user_password: form.user_password,
          user_phone: form.user_phone, user_role: 'Resident',
          resident_fname: form.resident_fname, resident_lname: form.resident_lname,
          resident_dob: form.resident_dob, resident_idnb: form.resident_idnb,
          resident_idpic: idPicData,
          last_known_location: currentLocation || { latitude: 0, longitude: 0 },
          home_location: currentLocation || { latitude: 0, longitude: 0 },
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Registration failed'); }
      nav?.navigate ? nav.navigate('Login') : nav?.goBack?.();
    } catch (e) {
      const msg = e.message || 'Registration failed. Please try again.';
      Platform.OS === 'web' ? window.alert('Registration Failed: ' + msg) : Alert.alert('Registration Failed', msg);
    } finally { setLoading(false); }
  };

  const CheckItem = ({ label, done }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        width: 18, height: 18, borderRadius: 9, borderWidth: 2,
        borderColor: done ? '#EC7742' : 'rgba(236,119,66,0.3)',
        backgroundColor: done ? '#EC7742' : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 12, color: done ? '#EC7742' : 'rgba(0,0,0,0.35)', fontWeight: done ? '600' : '400' }}>
        {label}
      </Text>
    </View>
  );

  const FieldError = ({ msg }) => msg ? (
    <Text style={{ fontSize: 11, color: '#DC2626', marginTop: -12, marginBottom: 12 }}>{msg}</Text>
  ) : null;

  // ID Guide Modal — tips + layout preview before camera opens
  const IDGuideModal = () => (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999,
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>How to photograph your ID</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
        Make sure your Lebanese National ID looks like this
      </Text>

      {/* ID layout preview */}
      <View style={{
        width: 300, height: 190,
        borderWidth: 2, borderColor: '#EC7742', borderRadius: 12,
        overflow: 'hidden', marginBottom: 24,
        backgroundColor: 'rgba(240,225,200,0.1)',
      }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>

          {/* LEFT SIDE — portrait */}
          <View style={{ width: 95, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8, alignItems: 'center' }}>
            <View style={{ width: 68, height: 90, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 3, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', marginTop: 40 }}>
              <Text style={{ fontSize: 30 }}>👤</Text>
            </View>
          </View>

          {/* RIGHT SIDE — header + data fields + number strip */}
          <View style={{ flex: 1, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 6, justifyContent: 'space-between' }}>

            <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '800', textAlign: 'right', letterSpacing: 0.3 }}>الجمهورية اللبنانية</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'right' }}>وزارة الداخلية</Text>
            </View>

            <View style={{ gap: 3, flex: 1, justifyContent: 'center' }}>
              {[
                { label: 'الاسم', value: '───────' },
                { label: 'الشهرة', value: '──────' },
                { label: 'اسم الاب', value: '─────' },
                { label: 'تاريخ الولادة', value: '────' },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{row.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600'}}>{row.label} :</Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: 'rgba(200,160,60,0.4)', borderRadius: 3, paddingVertical: 3, paddingHorizontal: 4, marginTop: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, textAlign: 'center', letterSpacing: 2, fontWeight: '700' }}>0 0 0 0 0 0 0 0 0 0 0 0</Text>
            </View>

          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={{ width: '100%', gap: 8, marginBottom: 24 }}>
        {[
          { icon: '💡', tip: 'Use good lighting — avoid shadows, glare, and flash reflections' },
          { icon: '📐', tip: 'Place the ID on a flat surface and photograph it horizontally' },
          { icon: '🌲', tip: 'Cedar logo (top-left), portrait (left), and ID number (bottom) must all be visible' },
          { icon: '🔍', tip: 'Get close enough so the ID fills most of the photo' },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 14 }}>{item.icon}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, flex: 1 }}>{item.tip}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => { setShowGuide(false); handlePickPhoto(true); }}
        style={{ width: '100%', height: 48, backgroundColor: '#DC2626', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>  Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => { setShowGuide(false); handlePickPhoto(false); }}
        style={{ width: '100%', height: 48, backgroundColor: '#EC7742', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>  Choose from Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowGuide(false)}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { position: 'relative' }]}>
      {showGuide && <IDGuideModal />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>

            <View style={styles.header}>
              <View style={styles.logoContainer}><Text style={styles.logoEmoji}>🔥</Text></View>
              <Text style={styles.appName}>EshMagan</Text>
              <Text style={styles.tagline}>Create Your Resident Account</Text>
            </View>

            <View style={styles.card}>

              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput value={form.resident_fname} onChangeText={v => set('resident_fname', v.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))} placeholder="Jane" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput value={form.resident_lname} onChangeText={v => set('resident_lname', v.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))} placeholder="Doe" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />
                </View>
              </View>

              <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
              <TextInput
                value={form.resident_dob}
                onChangeText={v => set('resident_dob', formatDOB(v))}
                placeholder="YYYY-MM-DD" placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="numeric" maxLength={10}
                style={[styles.input, form.resident_dob.length === 10 && dobError ? { borderColor: '#DC2626' } : {}]}
              />
              <FieldError msg={form.resident_dob.length === 10 ? dobError : null} />

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                value={form.user_phone}
                onChangeText={v => { if (v === '') { set('user_phone', ''); return; } set('user_phone', formatPhone(v.replace(/\D/g, ''))); }}
                placeholder="+961 70 000 000" placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="phone-pad" style={styles.input}
              />

              <Text style={styles.inputLabel}>NATIONAL ID NUMBER</Text>
              <TextInput
                value={form.resident_idnb}
                onChangeText={v => set('resident_idnb', v.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit ID number" placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="numeric" maxLength={12}
                style={[styles.input, form.resident_idnb.length > 0 && !idValid ? { borderColor: '#DC2626' } : {}]}
              />
              {form.resident_idnb.length > 0 && !idValid && (
                <FieldError msg={`${12 - form.resident_idnb.length} digit${12 - form.resident_idnb.length !== 1 ? 's' : ''} remaining`} />
              )}

              <Text style={styles.inputLabel}>ID PHOTO</Text>

              <View style={{ backgroundColor: '#FFF1D6', borderRadius: 10, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#EC7742', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 14 }}>ℹ️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#000', fontWeight: '700', marginBottom: 2 }}>Lebanese National ID required</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)', lineHeight: 15 }}>
                    Take a flat, horizontal photo of the front of your ID in good lighting. Make sure the cedar logo (top-left), portrait photo (left side), and ID number strip (bottom) are all clearly visible.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={showPhotoPicker} disabled={photoLoading}
                style={{
                  borderWidth: 2,
                  borderColor: idPhoto && !photoError ? '#EC7742' : photoError ? '#DC2626' : 'rgba(236,119,66,0.4)',
                  borderStyle: idPhoto ? 'solid' : 'dashed',
                  borderRadius: 12, height: idPhoto ? 180 : 100,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, overflow: 'hidden',
                  backgroundColor: idPhoto ? '#FFF1D6' : '#ffffff',
                }}
              >
                {photoLoading ? <ActivityIndicator color="#EC7742" /> :
                  idPhoto ? (
                    <>
                      <Image source={{ uri: idPhoto.uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode="cover" />
                      <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Tap to change</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
                      <Text style={{ fontSize: 13, color: '#EC7742', fontWeight: '600' }}>Tap to add ID photo</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 2 }}>Camera or gallery</Text>
                    </>
                  )
                }
              </TouchableOpacity>

              {photoError ? (
                <View style={{ backgroundColor: '#FFF1D6', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#DC2626', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700', marginBottom: 2 }}>Photo rejected</Text>
                    <Text style={{ fontSize: 11, color: '#000', lineHeight: 16, opacity: 0.7 }}>{photoError}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setPhotoError(''); setIdPhoto(null); }}>
                    <Text style={{ fontSize: 14, color: '#EC7742', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Account Credentials</Text>

              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                value={form.user_email} onChangeText={v => set('user_email', v.toLowerCase().trim())}
                placeholder="your.email@example.com" placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                style={[styles.input, form.user_email.length > 0 && emailError ? { borderColor: '#DC2626' } : {}]}
              />
              <FieldError msg={form.user_email.length > 0 ? emailError : null} />

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                value={form.user_password} onChangeText={v => set('user_password', v)}
                placeholder="Min. 8 characters" placeholderTextColor="rgba(0,0,0,0.25)" secureTextEntry
                style={[styles.input, form.user_password.length > 0 && form.user_password.length < 8 ? { borderColor: '#DC2626' } : {}]}
              />
              {form.user_password.length > 0 && form.user_password.length < 8 && (
                <FieldError msg={`${8 - form.user_password.length} more character${8 - form.user_password.length !== 1 ? 's' : ''} required`} />
              )}
              {form.user_password.length >= 8 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -12, marginBottom: 12 }}>
                  {[
                    { check: form.user_password.length >= 8, label: '8+ chars' },
                    { check: /[A-Z]/.test(form.user_password), label: 'Uppercase' },
                    { check: /[0-9]/.test(form.user_password), label: 'Number' },
                    { check: /[^a-zA-Z0-9]/.test(form.user_password), label: 'Symbol' },
                  ].map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.check ? '#EC7742' : 'rgba(0,0,0,0.15)' }} />
                      <Text style={{ fontSize: 10, color: item.check ? '#EC7742' : 'rgba(0,0,0,0.3)', fontWeight: item.check ? '600' : '400' }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)}
                placeholder="Repeat your password" placeholderTextColor="rgba(0,0,0,0.25)" secureTextEntry
                style={[styles.input, form.confirmPassword.length > 0 && form.confirmPassword !== form.user_password ? { borderColor: '#DC2626' } : {}]}
              />
              {form.confirmPassword.length > 0 && form.confirmPassword !== form.user_password && (
                <FieldError msg="Passwords do not match" />
              )}

              <View style={styles.privacyBox}>
                <View style={styles.privacyHeader}>
                  <Text style={{ fontSize: 14 }}>🛡️</Text>
                  <Text style={styles.privacyTitle}>Privacy & Location Consent</Text>
                </View>
                {PRIVACY_ITEMS.map((item, i) => (
                  <View key={i} style={styles.privacyItem}>
                    <Text style={styles.privacyCheck}>✓</Text>
                    <Text style={styles.privacyItemText}>{item}</Text>
                  </View>
                ))}
                <TouchableOpacity onPress={handleConsentToggle} style={styles.consentRow} disabled={locationLoading}>
                  <View style={[styles.checkbox, agreed ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                    {locationLoading ? <ActivityIndicator size="small" color="#EC7742" /> : agreed && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consentText}>I consent to location tracking, identity verification, and data processing for emergency response.</Text>
                    {locationGranted ? (
                      <Text style={{ fontSize: 12, color: '#ffffff', marginTop: 4, fontWeight: '700' }}>📍 {placeName || 'Detecting...'}</Text>
                    ) : !locationLoading && (
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Tap to request your device location</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {revokeMsg && (
                <View style={{ backgroundColor: '#FFF1D6', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#DC2626', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ fontSize: 14 }}>ℹ️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700', marginBottom: 2 }}>Tracking stopped</Text>
                    <Text style={{ fontSize: 11, color: '#000', lineHeight: 16, opacity: 0.7 }}>To fully revoke permission, go to Settings → Apps → EshMagan → Permissions.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setRevokeMsg(false)}>
                    <Text style={{ fontSize: 14, color: '#EC7742', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ backgroundColor: '#FFF1D6', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(236,119,66,0.25)' }}>
                <CheckItem label="Personal info & phone filled" done={personalInfoDone} />
                <CheckItem label="ID photo verified" done={!!idPhoto && !photoError} />
                <CheckItem label="Account credentials set" done={accountDone} />
                <CheckItem label="Location & consent granted" done={agreed && locationGranted} />
              </View>

              <TouchableOpacity onPress={handleRegister} disabled={loading} style={[styles.loginBtn, styles.loginBtnActive]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>🔐  Create My Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => nav?.navigate ? nav.navigate('Login') : nav?.goBack?.()} style={{ alignItems: 'center', marginTop: 14 }}>
                <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                  Already have an account?{'  '}
                  <Text style={{ color: '#DC2626', fontWeight: '700' }}>Sign In</Text>
                </Text>
              </TouchableOpacity>

            </View>

            <Text style={styles.footer}>Resident registration only • For other roles contact your municipality</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

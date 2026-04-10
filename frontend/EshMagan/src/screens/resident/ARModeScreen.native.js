import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import styles from '../../styles/screens/ARModeScreen.styles.js';

const CONFIG = {
  ADVANCE_DISTANCE_METERS: 14,
  OFF_ROUTE_DISTANCE_METERS: 40,
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const rlat1 = toRad(lat1);
  const rlat2 = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(rlat2);
  const x =
    Math.cos(rlat1) * Math.sin(rlat2) -
    Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getRelativeAngle(fromHeading, toBearing) {
  let rel = toBearing - fromHeading;
  while (rel > 180) rel -= 360;
  while (rel < -180) rel += 360;
  return rel;
}

function normalizeAngle(angle) {
  let a = angle;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return 'Locating…';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function getHeadingLabel(deg) {
  if (deg == null || Number.isNaN(deg)) return '—';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

function parseSafeZone(raw) {
  if (!raw) return null;

  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (g.type === 'Point' && g.coordinates?.length >= 2) {
      return { lat: g.coordinates[1], lng: g.coordinates[0] };
    }

    if (g.type === 'Polygon' && g.coordinates?.[0]?.length) {
      const ring = g.coordinates[0];
      const lat = ring.reduce((sum, c) => sum + c[1], 0) / ring.length;
      const lng = ring.reduce((sum, c) => sum + c[0], 0) / ring.length;
      return { lat, lng };
    }
  } catch {}

  const pointMatch =
    typeof raw === 'string' &&
    raw.match(/POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);

  if (pointMatch) {
    return { lat: parseFloat(pointMatch[2]), lng: parseFloat(pointMatch[1]) };
  }

  return null;
}

function parseRoutePath(raw) {
  if (!raw) return [];

  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
      return g.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }

    if (g.type === 'Feature' && g.geometry?.type === 'LineString') {
      return g.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }

    if (g.type === 'FeatureCollection' && Array.isArray(g.features)) {
      const line = g.features.find(f => f.geometry?.type === 'LineString');
      if (line) {
        return line.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      }
    }
  } catch {}

  if (typeof raw === 'string') {
    const lineMatch = raw.match(/LINESTRING\s*\((.+)\)/i);
    if (lineMatch) {
      return lineMatch[1]
        .split(',')
        .map(part => part.trim().split(/\s+/).map(Number))
        .filter(pair => pair.length >= 2 && !Number.isNaN(pair[0]) && !Number.isNaN(pair[1]))
        .map(([lng, lat]) => ({ lat, lng }));
    }
  }

  return [];
}

function parseRoutePolyline(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(p => Array.isArray(p) && p.length >= 2)
    .map(([lat, lng]) => ({ lat, lng }));
}

function projectPointOnSegment(p, a, b) {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;

  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;

  if (ab2 === 0) return { point: a, t: 0 };

  let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
  t = Math.max(0, Math.min(1, t));

  return {
    point: {
      lat: ay + aby * t,
      lng: ax + abx * t,
    },
    t,
  };
}

function getNearestPointOnRoute(userPos, routePoints) {
  if (!userPos || !routePoints || routePoints.length < 2) return null;

  let best = null;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];
    const projected = projectPointOnSegment(userPos, a, b);
    const distance = getDistanceMeters(
      userPos.lat,
      userPos.lng,
      projected.point.lat,
      projected.point.lng
    );

    if (!best || distance < best.distance) {
      best = {
        distance,
        point: projected.point,
        segmentIndex: i,
        t: projected.t,
      };
    }
  }

  return best;
}

function getClosestRouteIndex(userPos, routePoints) {
  if (!userPos || !routePoints?.length) return 0;

  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < routePoints.length; i++) {
    const p = routePoints[i];
    const d = getDistanceMeters(userPos.lat, userPos.lng, p.lat, p.lng);

    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function getOffRouteDistance(userPos, routePoints) {
  const nearest = getNearestPointOnRoute(userPos, routePoints);
  return nearest?.distance ?? Infinity;
}

function getRemainingDistanceFromIndex(userPos, routePoints, currentIndex) {
  if (!userPos || !routePoints?.length || currentIndex >= routePoints.length) return null;

  let total = 0;

  total += getDistanceMeters(
    userPos.lat,
    userPos.lng,
    routePoints[currentIndex].lat,
    routePoints[currentIndex].lng
  );

  for (let i = currentIndex; i < routePoints.length - 1; i++) {
    total += getDistanceMeters(
      routePoints[i].lat,
      routePoints[i].lng,
      routePoints[i + 1].lat,
      routePoints[i + 1].lng
    );
  }

  return total;
}

function getTurnType(turnAngle) {
  const a = normalizeAngle(turnAngle);
  const abs = Math.abs(a);

  if (abs <= 20) return 'straight';
  if (abs <= 45) return a > 0 ? 'slight-right' : 'slight-left';
  if (abs <= 110) return a > 0 ? 'right' : 'left';
  return a > 0 ? 'sharp-right' : 'sharp-left';
}

function getTurnInstruction(turnType) {
  switch (turnType) {
    case 'straight':
      return 'Continue straight';
    case 'slight-right':
      return 'Slight right ahead';
    case 'slight-left':
      return 'Slight left ahead';
    case 'right':
      return 'Turn right ahead';
    case 'left':
      return 'Turn left ahead';
    case 'sharp-right':
      return 'Sharp right ahead';
    case 'sharp-left':
      return 'Sharp left ahead';
    default:
      return 'Continue';
  }
}

function computeManeuver(routePoints, currentIndex) {
  if (!routePoints?.length) {
    return {
      turnType: 'straight',
      instruction: 'Continue straight',
      turnAngle: 0,
    };
  }

  const start = Math.max(0, currentIndex - 1);
  const a = routePoints[start];
  const b = routePoints[Math.min(currentIndex, routePoints.length - 1)];
  const c = routePoints[Math.min(currentIndex + 1, routePoints.length - 1)];

  if (!a || !b || !c) {
    return {
      turnType: 'straight',
      instruction: 'Continue straight',
      turnAngle: 0,
    };
  }

  const bearing1 = getBearing(a.lat, a.lng, b.lat, b.lng);
  const bearing2 = getBearing(b.lat, b.lng, c.lat, c.lng);
  const turnAngle = normalizeAngle(bearing2 - bearing1);
  const turnType = getTurnType(turnAngle);

  return {
    turnType,
    instruction: getTurnInstruction(turnType),
    turnAngle,
  };
}

function useLiveLocation(initialUserPos = null) {
  const [userPos, setUserPos] = useState(initialUserPos);

  useEffect(() => {
    let watchId = null;
    let cancelled = false;

    const applyCoords = pos => {
      if (cancelled || !pos?.coords) return;
      setUserPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    };

    Geolocation.getCurrentPosition(
      applyCoords,
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 2000,
      }
    );

    watchId = Geolocation.watchPosition(
      applyCoords,
      () => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 2,
        interval: 1500,
        fastestInterval: 1000,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      cancelled = true;
      if (watchId != null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [initialUserPos]);

  return userPos;
}

function useSmoothedHeading() {
  const [heading, setHeading] = useState(null);
  const smoothedRef = useRef(null);

  useEffect(() => {
    let subscription = null;

    try {
      const sensors = require('react-native-sensors');
      const operators = require('rxjs/operators');
      const magnetometer = sensors.magnetometer;
      const setUpdateIntervalForType = sensors.setUpdateIntervalForType;
      const SensorTypes = sensors.SensorTypes;
      const map = operators.map;

      setUpdateIntervalForType(SensorTypes.magnetometer, 250);

      subscription = magnetometer
        .pipe(
          map(({ x, y }) => {
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle += 90;
            if (angle < 0) angle += 360;
            if (angle >= 360) angle -= 360;
            angle = (360 - angle) % 360;
            return angle;
          })
        )
        .subscribe(deg => {
          smoothedRef.current =
            smoothedRef.current == null ? deg : smoothedRef.current * 0.85 + deg * 0.15;
          setHeading(smoothedRef.current);
        });
    } catch {
      setHeading(null);
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      } else if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  return heading;
}

function TurnArrow({ type }) {
  const common = { color: '#fff', fontWeight: '900' };

  switch (type) {
    case 'slight-right':
      return <Text style={[styles.arrowText, common]}>↗</Text>;
    case 'slight-left':
      return <Text style={[styles.arrowText, common]}>↖</Text>;
    case 'right':
      return <Text style={[styles.arrowText, common]}>→</Text>;
    case 'left':
      return <Text style={[styles.arrowText, common]}>←</Text>;
    case 'sharp-right':
      return <Text style={[styles.arrowText, common]}>⤴</Text>;
    case 'sharp-left':
      return <Text style={[styles.arrowText, common]}>⤵</Text>;
    case 'straight':
    default:
      return <Text style={[styles.arrowText, common]}>↑</Text>;
  }
}

function CameraAssistOverlay({
  userPos,
  heading,
  routePoints,
  safeZone,
  directions,
  routingMeta,
  onExit,
  cameraReady,
  permDenied,
}) {
  const routeIndexRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    initializedRef.current = false;
    routeIndexRef.current = 0;
  }, [routePoints]);

  const navState = useMemo(() => {
    if (!userPos) {
      return {
        routeLeft: null,
        preformattedRouteLeft: routingMeta?.totalKm ? `${routingMeta.totalKm} km` : null,
        nextPointDistance: null,
        offRouteDistance: 0,
        turnType: directions?.[0]?.type === 'turn' ? 'right' : 'straight',
        instruction: directions?.[0]?.instruction || 'Waiting for your location…',
        facingInstruction: 'Waiting for your location…',
        arrived: false,
      };
    }

    if (routePoints?.length) {
      if (!initializedRef.current) {
        const closestIndex = getClosestRouteIndex(userPos, routePoints);
        routeIndexRef.current = Math.min(closestIndex + 1, routePoints.length - 1);
        initializedRef.current = true;
      }

      while (routeIndexRef.current < routePoints.length - 1) {
        const currentTarget = routePoints[routeIndexRef.current];
        const distToTarget = getDistanceMeters(
          userPos.lat,
          userPos.lng,
          currentTarget.lat,
          currentTarget.lng
        );

        if (distToTarget <= CONFIG.ADVANCE_DISTANCE_METERS) {
          routeIndexRef.current += 1;
        } else {
          break;
        }
      }

      const currentTarget = routePoints[routeIndexRef.current];
      const nextPointDistance = currentTarget
        ? getDistanceMeters(userPos.lat, userPos.lng, currentTarget.lat, currentTarget.lng)
        : null;

      const routeLeft = getRemainingDistanceFromIndex(userPos, routePoints, routeIndexRef.current);
      const offRouteDistance = getOffRouteDistance(userPos, routePoints);
      const maneuver = computeManeuver(routePoints, routeIndexRef.current);

      let facingInstruction = 'Follow the next route step';

      if (offRouteDistance > CONFIG.OFF_ROUTE_DISTANCE_METERS) {
        facingInstruction = 'Move back to the selected route';
      } else if (heading != null && currentTarget) {
        const bearing = getBearing(userPos.lat, userPos.lng, currentTarget.lat, currentTarget.lng);
        const rel = getRelativeAngle(heading, bearing);
        const abs = Math.abs(rel);

        if (abs <= 15) {
          facingInstruction = 'Phone is aligned with route';
        } else if (rel > 0) {
          facingInstruction = `Rotate ${Math.round(abs)}° right`;
        } else {
          facingInstruction = `Rotate ${Math.round(abs)}° left`;
        }
      }

      const arrived =
        routeIndexRef.current >= routePoints.length - 1 &&
        (nextPointDistance == null || nextPointDistance <= CONFIG.ADVANCE_DISTANCE_METERS);

      if (arrived) {
        return {
          routeLeft: 0,
          nextPointDistance: 0,
          offRouteDistance,
          turnType: 'straight',
          instruction: 'You arrived at the safe zone',
          facingInstruction: 'Destination reached',
          arrived: true,
        };
      }

      if (offRouteDistance > CONFIG.OFF_ROUTE_DISTANCE_METERS) {
        return {
          routeLeft,
          nextPointDistance,
          offRouteDistance,
          turnType: maneuver.turnType,
          instruction: 'Off route — return to the selected path',
          facingInstruction,
          arrived: false,
        };
      }

      return {
        routeLeft,
        nextPointDistance,
        offRouteDistance,
        turnType: maneuver.turnType,
        instruction:
          nextPointDistance != null
            ? `${maneuver.instruction} in ${formatDistance(nextPointDistance)}`
            : maneuver.instruction,
        facingInstruction,
        arrived: false,
      };
    }

    if (safeZone) {
      const dist = getDistanceMeters(userPos.lat, userPos.lng, safeZone.lat, safeZone.lng);

      return {
        routeLeft: dist,
        nextPointDistance: dist,
        offRouteDistance: 0,
        turnType: 'straight',
        instruction: `Continue to safe zone in ${formatDistance(dist)}`,
        facingInstruction: 'Keep moving forward',
        arrived: false,
      };
    }

    return {
      routeLeft: null,
      nextPointDistance: null,
      offRouteDistance: 0,
      turnType: 'straight',
      instruction: 'No route found',
      facingInstruction: 'Return to map',
      arrived: false,
    };
  }, [userPos, heading, routePoints, safeZone, directions, routingMeta]);

  if (permDenied) {
    return (
      <View style={styles.permDenied}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>
          Please allow camera access to use camera guidance.
        </Text>
        <TouchableOpacity onPress={onExit} style={styles.exitBtnSolid}>
          <Text style={styles.exitBtnSolidText}>← Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {!cameraReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#DC2626" size="large" />
          <Text style={styles.loadingText}>Starting camera…</Text>
        </View>
      )}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Exit</Text>
        </TouchableOpacity>

        <View style={styles.badge}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeText}>Camera Guidance</Text>
        </View>

        <View style={styles.compassChip}>
          <Text style={styles.compassText}>
            {heading != null ? `${Math.round(heading)}°` : '—°'}
          </Text>
        </View>
      </View>

      <View style={styles.centerGuideWrap}>
        <View style={styles.arrowBadge}>
          <TurnArrow type={navState.turnType} />
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainInstruction}>{navState.instruction}</Text>
          <Text style={styles.subInstruction}>{navState.facingInstruction}</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>ROUTE LEFT</Text>
            <Text style={styles.infoValue}>
              {navState.preformattedRouteLeft ?? formatDistance(navState.routeLeft)}
            </Text>
          </View>

          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>HEADING</Text>
            <Text style={styles.infoValue}>{getHeadingLabel(heading)}</Text>
          </View>

          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>STATUS</Text>
            <Text style={styles.infoValue}>
              {navState.arrived
                ? 'Arrived'
                : navState.offRouteDistance > CONFIG.OFF_ROUTE_DISTANCE_METERS
                  ? 'Off route'
                  : 'On route'}
            </Text>
          </View>
        </View>

        <View style={styles.hintRow}>
          <Text style={styles.hintText}>
            {navState.arrived
              ? 'Safe zone reached'
              : navState.offRouteDistance > CONFIG.OFF_ROUTE_DISTANCE_METERS
                ? 'Go back toward the selected route'
                : 'Use this as a camera assistant while your map stays the main navigator'}
          </Text>
        </View>
      </View>
    </>
  );
}

function NativeCameraAssist({
  userPos,
  heading,
  routePoints,
  safeZone,
  directions,
  routingMeta,
  onExit,
}) {
  let VisionCamera = null;

  try {
    VisionCamera = require('react-native-vision-camera');
  } catch {}

  if (!VisionCamera) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>react-native-vision-camera is not installed</Text>
        <TouchableOpacity onPress={onExit} style={styles.fallbackBtn}>
          <Text style={styles.fallbackBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { Camera, useCameraPermission, useCameraDevice } = VisionCamera;
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.permDenied}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📷</Text>
        <Text style={styles.permTitle}>Camera Permission Needed</Text>
        <Text style={styles.permDesc}>
          Please allow camera access on your phone to use camera guidance.
        </Text>
        <TouchableOpacity onPress={() => requestPermission()} style={styles.exitBtnSolid}>
          <Text style={styles.exitBtnSolidText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={[styles.fallbackBtn, { marginTop: 12 }]}
        >
          <Text style={styles.fallbackBtnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExit} style={[styles.fallbackBtn, { marginTop: 12 }]}>
          <Text style={styles.fallbackBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.loadingOnly}>
        <ActivityIndicator color="#DC2626" size="large" />
        <Text style={styles.loadingText}>Loading camera…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        style={styles.nativeCamera}
        device={device}
        isActive={true}
        photo={false}
        video={false}
        audio={false}
      />

      <CameraAssistOverlay
        userPos={userPos}
        heading={heading}
        routePoints={routePoints}
        safeZone={safeZone}
        directions={directions}
        routingMeta={routingMeta}
        onExit={onExit}
        cameraReady={true}
        permDenied={false}
      />
    </View>
  );
}

export default function ARModeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route?.params || {};

  const {
    selectedRoute,
    routePolyline,
    directions = [],
    routingMeta = null,
    initialUserPos = null,
  } = routeParams;

  const userPos = useLiveLocation(initialUserPos);
  const heading = useSmoothedHeading();

  const safeZone = useMemo(
    () => (selectedRoute ? parseSafeZone(selectedRoute.safe_zone ?? selectedRoute.safeZone) : null),
    [selectedRoute]
  );

  const routePoints = useMemo(() => {
    const polylinePoints = parseRoutePolyline(routePolyline);
    if (polylinePoints.length) return polylinePoints;

    return selectedRoute
      ? parseRoutePath(selectedRoute.route_path ?? selectedRoute.routePath)
      : [];
  }, [selectedRoute, routePolyline]);

  const handleExit = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation?.navigate?.('Evacuation');
  };

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.missingRouteWrap}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.missingRouteTitle}>No route selected</Text>
        <Text style={styles.missingRouteText}>
          Open camera guidance from the selected route in the evacuation screen.
        </Text>
        <TouchableOpacity onPress={handleExit} style={styles.fallbackBtn}>
          <Text style={styles.fallbackBtnText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <NativeCameraAssist
        userPos={userPos}
        heading={heading}
        routePoints={routePoints}
        safeZone={safeZone}
        directions={directions}
        routingMeta={routingMeta}
        onExit={handleExit}
      />
    </SafeAreaView>
  );
}
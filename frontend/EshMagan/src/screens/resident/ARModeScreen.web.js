import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import styles from '../../styles/screens/ARModeScreen.styles.js';

function WebCameraAssist({ onExit }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setPermDenied(true);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setPermDenied(true);
      }
    })();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  if (permDenied) {
    return (
      <View style={styles.permDenied}>
        <Text style={styles.permTitle}>Camera blocked</Text>
        <Text style={styles.permDesc}>
          Please allow camera access in your browser.
        </Text>
        <TouchableOpacity onPress={onExit} style={styles.fallbackBtn}>
          <Text style={styles.fallbackBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      <video ref={videoRef} style={styles.video} autoPlay playsInline muted />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Exit</Text>
        </TouchableOpacity>

        <View style={styles.badge}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeText}>Camera Guidance</Text>
        </View>

        <View style={styles.compassChip}>
          <Text style={styles.compassText}>WEB</Text>
        </View>
      </View>

      <View style={styles.centerGuideWrap}>
        <View style={styles.arrowBadge}>
          <Text style={styles.arrowText}>↑</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainInstruction}>Follow the route on your map</Text>
          <Text style={styles.subInstruction}>Web mode uses simplified guidance</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>MODE</Text>
            <Text style={styles.infoValue}>Web</Text>
          </View>

          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>STATUS</Text>
            <Text style={styles.infoValue}>Active</Text>
          </View>

          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>CAMERA</Text>
            <Text style={styles.infoValue}>Live</Text>
          </View>
        </View>

        <View style={styles.hintRow}>
          <Text style={styles.hintText}>Use mobile app for full AR navigation</Text>
        </View>
      </View>
    </View>
  );
}

export default function ARModeScreen({ navigation }) {
  const handleExit = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation?.navigate?.('Evacuation');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <WebCameraAssist onExit={handleExit} />
    </SafeAreaView>
  );
}
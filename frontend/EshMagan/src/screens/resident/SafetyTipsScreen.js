// src/screens/resident/SafetyTipsScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image, } from 'react-native';
import styles from '../../styles/screens/SafetyTipsScreen.styles';
import logoSource from '../../images/logoSource';

const ASSETS = {
  home: Platform.select({
    web: { uri: '/home.png' },
    android: { uri: 'home' },
    ios: { uri: 'home' },
    default: { uri: 'home' },
  }),
  alert: Platform.select({
    web: { uri: '/alert.png' },
    android: { uri: 'alert' },
    ios: { uri: 'alert' },
    default: { uri: 'alert' },
  }),
  compass: Platform.select({
    web: { uri: '/compass.png' },
    android: { uri: 'compass' },
    ios: { uri: 'compass' },
    default: { uri: 'compass' },
  }),
  waterTap: Platform.select({
    web: { uri: '/water_tap.png' },
    android: { uri: 'water_tap' },
    ios: { uri: 'water_tap' },
    default: { uri: 'water_tap' },
  }),
  firstAidKit: Platform.select({
    web: { uri: '/first_aid_kit.png' },
    android: { uri: 'first_aid_kit' },
    ios: { uri: 'first_aid_kit' },
    default: { uri: 'first_aid_kit' },
  }),
  smoke: Platform.select({
    web: { uri: '/smoke.png' },
    android: { uri: 'smoke' },
    ios: { uri: 'smoke' },
    default: { uri: 'smoke' },
  }),
};

const PREPARATION = [
  { title: 'Create an Emergency Kit', icon: ASSETS.firstAidKit, borderColor: '#bfdbfe', checkColor: '#2563eb', items: ['Water (1 gallon per person per day for 3 days)', 'Non-perishable food for 3 days', 'Flashlight and extra batteries', 'First aid kit and essential medications', 'Important documents in waterproof container', 'Cash and credit cards', 'Mobile phone with chargers'] },
  { title: 'Prepare Your Home', icon: ASSETS.home, borderColor: '#fed7aa', checkColor: '#ea580c', items: ['Clear dry vegetation at least 30 feet from home', 'Install fire-resistant roofing materials', 'Keep gutters clean and free of debris', 'Seal gaps in roofing and exterior walls', 'Install dual-pane windows', 'Store firewood away from home'] },
  { title: 'Evacuation Planning', icon: ASSETS.compass, borderColor: '#e9d5ff', checkColor: '#9333ea', items: ['Know multiple evacuation routes from your area', 'Identify shelter locations outside fire zone', 'Plan for pets and livestock evacuation', 'Designate emergency meeting point for family', 'Keep car fueled and ready', 'Practice evacuation drills regularly'] },
];

const DURING_FIRE = [
  { icon: ASSETS.alert, title: 'If Ordered to Evacuate', tips: ["Leave immediately - don't wait", 'Take your emergency supply kit', 'Wear protective clothing and sturdy shoes', 'Lock your home and close windows', "Tell someone outside where you're going", 'Follow designated evacuation routes'] },
  { icon: ASSETS.smoke, title: 'If Trapped at Home', tips: ['Stay inside - keep doors and windows closed', 'Fill sinks and bathtubs with water', 'Keep lights on for visibility through smoke', 'Monitor fire and weather reports', 'Stay away from windows', 'Be prepared to leave if situation worsens'] },
  { icon: ASSETS.waterTap, title: 'After the Fire', tips: ["Return only when authorities say it's safe", 'Avoid ash, charred trees, and smoldering debris', 'Document property damage with photos', 'Contact your insurance company', 'Watch for hot spots that may flare up', 'Beware of hazards like fallen power lines'] },
];

export default function SafetyTipsScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch { }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav?.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Image
              source={logoSource}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Safety Tips</Text>
        </View>
        <Text style={styles.headerSub}>Wildfire preparedness and response guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Before a Wildfire</Text>
        {PREPARATION.map(section => (
          <View key={section.title} style={[styles.prepCard, { borderColor: section.borderColor }]}>
            <View style={styles.prepCardHeader}>
              <View style={styles.prepIconWrap}><Image
                source={section.icon}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              /></View>
              <Text style={styles.prepCardTitle}>{section.title}</Text>
            </View>
            {section.items.map((item, i) => (
              <View key={i} style={styles.prepItem}>
                <Text style={[styles.prepCheck, { color: section.checkColor }]}>✓</Text>
                <Text style={styles.prepItemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>During a Wildfire</Text>
        {DURING_FIRE.map(section => (
          <View key={section.title} style={styles.duringCard}>
            <View style={styles.duringCardHeader}>
              <View style={styles.duringIconWrap}><Image
                source={section.icon}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              /></View>
              <Text style={styles.duringCardTitle}>{section.title}</Text>
            </View>
            {section.tips.map((tip, i) => (
              <View key={i} style={styles.duringItem}>
                <View style={styles.duringBullet} />
                <Text style={styles.duringItemText}>{tip}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
          </View>
          {[{ name: 'Fire Emergency', num: '125' }, { name: 'Medical Emergency', num: '140' }, { name: 'Police', num: '112' }].map(c => (
            <View key={c.name} style={styles.emergencyRow}>
              <Text style={styles.emergencyName}>{c.name}</Text>
              <View style={styles.emergencyNumBadge}><Text style={styles.emergencyNum}>{c.num}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.resourcesCard}>
          <Text style={styles.resourcesTitle}>Additional Resources</Text>
          {['Register for EshMagan emergency alerts', 'Download offline evacuation maps', 'Join community fire prevention programs'].map((item, i) => (
            <View key={i} style={styles.resourceItem}>
              <Text style={styles.resourceCheck}>✓</Text>
              <Text style={styles.resourceText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

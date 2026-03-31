import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function TabBar({ activeTab, setActiveTab, tabs }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => setActiveTab(tab.id)}
          style={[styles.tab, activeTab === tab.id ? styles.tabActive : styles.tabInactive]}
        >
          <Text style={styles.tabEmoji}>{tab.emoji}</Text>
          <View style={styles.tabTextRow}>
            <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive]}>
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  tab.id === 'alerts' ? styles.tabBadgeAlerts : styles.tabBadgeOther,
                ]}
              >
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

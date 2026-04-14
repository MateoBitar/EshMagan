import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function TabBar({ activeTab, setActiveTab, tabs }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
          >
            <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
              {tab.title}
            </Text>

            {tab.count ? (
              <View style={[styles.tabBadge, active ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                <Text style={[styles.tabBadgeText, active ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive]}>
                  {tab.count > 99 ? '99+' : tab.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

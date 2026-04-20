import React from 'react';
import { View, ScrollView, Text, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import styles, { C, ASSIGNMENT_COLORS } from '../../../styles/screens/ResponderCommandView.styles';

export default function AssignmentsTab({
  myAssignments,
  activeAssignments,
  fireLocations,
  myStatus,
  actionLoading,
  fmtDate,
  handleUpdateAssignment,
}) {
  return (
    <View style={styles.tabFill}>
      <Text style={styles.sectionHeader}>
        {activeAssignments.length} active • {myAssignments.length} total
      </Text>

      <View style={{ flex: 1, minHeight: '75.1vh', maxHeight: '75.1vh', overflow: 'hidden' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {myAssignments.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No assignments yet</Text>
              <Text style={styles.emptyDesc}>You'll be notified when dispatched</Text>
            </View>
          ) : (
            myAssignments.map(a => {
              const statusColor = ASSIGNMENT_COLORS[a.assignment_status] || C.slate;
              const isDone = ['Completed', 'Cancelled'].includes(a.assignment_status);

              return (
                <View
                  key={a.assignment_id}
                  style={[
                    styles.assignmentCard,
                    isDone ? styles.assignmentCardDone : styles.assignmentCardActive,
                    { borderColor: isDone ? C.cardBorder : statusColor + '40' },
                  ]}
                >
                  <View style={styles.assignmentCardHeader}>
                    <View style={styles.assignmentCardInfo}>
                      <View style={styles.assignmentFireRow}>
                        <Image
                          source={Platform.OS === 'web'
                            ? { uri: '/EshMagan_Logo-Badge.png' }
                            : { uri: 'eshmagan_logo_badge' }}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.assignmentFireSource}>
                          {fireLocations[a.fire_id]?.source || 'Active Fire'}
                        </Text>
                      </View>

                      <Text style={styles.assignmentFireId}>
                        Fire ID: {a.fire_id?.slice(0, 8) || 'Unknown'}
                      </Text>

                      {fireLocations[a.fire_id]?.coords && (
                        <Text style={styles.assignmentFireLocation}>
                          Location: {fireLocations[a.fire_id].coords.lat.toFixed(4)}°N, {fireLocations[a.fire_id].coords.lng.toFixed(4)}°E
                        </Text>
                      )}

                      <Text style={styles.assignmentDispatchedTime}>
                        Dispatched {fmtDate(a.assigned_at)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.assignmentStatusBadge,
                        {
                          backgroundColor: statusColor + '20',
                          borderColor: statusColor + '40',
                        },
                      ]}
                    >
                      <Text style={[styles.assignmentStatusText, { color: statusColor }]}>
                        {a.assignment_status === 'EnRoute'
                          ? 'En Route'
                          : a.assignment_status === 'OnScene'
                            ? 'On Scene'
                            : a.assignment_status}
                      </Text>
                    </View>
                  </View>

                  {!isDone && (
                    <>
                      <View style={styles.assignmentActionsDivider} />
                      <Text style={styles.assignmentActionsLabel}>UPDATE STATUS</Text>

                      {myStatus === 'Unavailable' && (
                        <View style={styles.assignmentUnavailableWarning}>
                          <Text style={styles.assignmentUnavailableEmoji}>🔒</Text>
                          <Text style={styles.assignmentUnavailableText}>
                            Set yourself Active or Standby to update assignments
                          </Text>
                        </View>
                      )}

                      <View style={styles.assignmentActionsRow}>
                        {[
                          { value: 'EnRoute', label: 'En Route' },
                          { value: 'OnScene', label: 'On Scene' },
                          { value: 'Completed', label: 'Completed' },
                          { value: 'Cancelled', label: 'Cancelled' },
                        ].map(({ value: status, label: statusLabel }) => {
                          const isActive = a.assignment_status === status;
                          const btnColor = ASSIGNMENT_COLORS[status];
                          const isLoading = actionLoading === a.assignment_id + status;

                          return (
                            <TouchableOpacity
                              key={status}
                              onPress={() => handleUpdateAssignment(a.assignment_id, status, a.fire_id)}
                              disabled={!!actionLoading || isActive || myStatus === 'Unavailable'}
                              style={[
                                styles.assignmentActionButton,
                                isActive
                                  ? { backgroundColor: btnColor, borderColor: btnColor }
                                  : { backgroundColor: btnColor + '15', borderColor: btnColor + '40' },
                                myStatus === 'Unavailable' && styles.assignmentActionButtonDisabled,
                              ]}
                            >
                              {isLoading ? (
                                <ActivityIndicator color={btnColor} size="small" />
                              ) : (
                                <Text
                                  style={[
                                    styles.assignmentActionButtonText,
                                    { color: isActive ? '#fff' : btnColor },
                                  ]}
                                >
                                  {statusLabel}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

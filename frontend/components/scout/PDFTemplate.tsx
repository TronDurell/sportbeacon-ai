import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { ScoutPlayer } from '../../types/player';
import { Badge } from '../BadgeSystem';
import { AIRecap } from './PlayerRecap';

interface PDFTemplateProps {
  player: ScoutPlayer;
  badges: Badge[];
  aiRecap: AIRecap;
  videoSnapshots: Array<{
    url: string;
    timestamp: number;
    description: string;
  }>;
  drillHistory: Array<{
    date: string;
    name: string;
    performance: number;
    notes: string;
  }>;
  organizationLogo: string;
}

// Register custom fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1pt solid #E0E0E0',
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  headerText: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 20,
    pageBreakInside: 'avoid',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: '#1A1A1A',
  },
  playerHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  playerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5,
  },
  playerDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: 80,
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeIcon: {
    width: 40,
    height: 40,
  },
  badgeName: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  statItem: {
    width: '30%',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  snapshot: {
    width: '31%',
    marginBottom: 10,
  },
  snapshotImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
  },
  snapshotCaption: {
    fontSize: 8,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    borderTop: '1pt solid #E0E0E0',
    paddingTop: 10,
  },
});

export const PDFTemplate: React.FC<PDFTemplateProps> = ({
  player,
  badges,
  aiRecap,
  videoSnapshots,
  drillHistory,
  organizationLogo,
}) => (
  <div className="w-full" role="region" aria-label="PDF template" tabIndex={0}>
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={organizationLogo} style={styles.logo} />
          <Text style={styles.headerText}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Player Profile */}
        <View style={styles.section}>
          <View style={styles.playerHeader}>
            <Image
              src={player.mediaUrls.profileImage}
              style={styles.playerImage}
            />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {player.firstName} {player.lastName}
              </Text>
              <Text style={styles.playerDetails}>
                {player.nationality} • {player.primaryPosition}
              </Text>
              <Text style={styles.playerDetails}>
                {player.currentTeam.name} • {player.currentTeam.league}
              </Text>
              <Text style={styles.playerDetails}>
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image src={organizationLogo} style={styles.logo} />
        <Text style={styles.headerText}>
          Generated on {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Player Profile */}
      <View style={styles.section}>
        <View style={styles.playerHeader}>
          <Image
            src={player.mediaUrls.profileImage}
            style={styles.playerImage}
          />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {player.firstName} {player.lastName}
            </Text>
            <Text style={styles.playerDetails}>
              {player.nationality} • {player.primaryPosition}
            </Text>
            <Text style={styles.playerDetails}>
              {player.currentTeam.name} • {player.currentTeam.league}
            </Text>
            <Text style={styles.playerDetails}>
              Born: {new Date(player.dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Analysis</Text>
        <Text>{aiRecap.summary}</Text>
        <View style={styles.statGrid}>
          {aiRecap.roleRecommendations.map((role, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>
                {(role.confidence * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>{role.role}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Statistics</Text>
        <View style={styles.statGrid}>
          {Object.entries(player.stats).map(([key, value]) => (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements & Badges</Text>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <View key={badge.id} style={styles.badge}>
              <Image src={badge.icon} style={styles.badgeIcon} />
              <Text style={styles.badgeName}>{badge.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Video Snapshots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Highlight Moments</Text>
        <View style={styles.snapshotGrid}>
          {videoSnapshots.map((snapshot, index) => (
            <View key={index} style={styles.snapshot}>
              <Image src={snapshot.url} style={styles.snapshotImage} />
              <Text style={styles.snapshotCaption}>
                {snapshot.description} ({formatTimestamp(snapshot.timestamp)})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Drill History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Training Performance</Text>
        {drillHistory.map((drill, index) => (
          <View
            key={index}
            style={{
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>
                {drill.name}
              </Text>
              <Text style={{ fontSize: 10, color: '#666' }}>{drill.date}</Text>
            </View>
            <View style={{ width: 100, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: drill.performance >= 7 ? '#4CAF50' : '#FF9800',
                }}
              >
                {drill.performance}/10
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>
          Confidential Scouting Report • {player.firstName} {player.lastName} •{' '}
          Page <Text render={({ pageNumber }) => pageNumber} /> of{' '}
          <Text render={({ totalPages }) => totalPages} />
        </Text>
      </View>
    </Page>
  </Document>
);

const formatTimestamp = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

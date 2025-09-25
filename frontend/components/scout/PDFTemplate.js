import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Document, Page, Text, View, StyleSheet, Image, Font, } from '@react-pdf/renderer';
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
export const PDFTemplate = ({ player, badges, aiRecap, videoSnapshots, drillHistory, organizationLogo, }) => (_jsxs(Document, { children: [_jsxs(Page, { size: "A4", style: styles.page, children: [_jsxs(View, { style: styles.header, children: [_jsx(Image, { src: organizationLogo, style: styles.logo }), _jsxs(Text, { style: styles.headerText, children: ["Generated on ", new Date().toLocaleDateString()] })] }), _jsx(View, { style: styles.section, children: _jsxs(View, { style: styles.playerHeader, children: [_jsx(Image, { src: player.mediaUrls.profileImage, style: styles.playerImage }), _jsxs(View, { style: styles.playerInfo, children: [_jsxs(Text, { style: styles.playerName, children: [player.firstName, " ", player.lastName] }), _jsxs(Text, { style: styles.playerDetails, children: [player.nationality, " \u2022 ", player.primaryPosition] }), _jsxs(Text, { style: styles.playerDetails, children: [player.currentTeam.name, " \u2022 ", player.currentTeam.league] }), _jsxs(Text, { style: styles.playerDetails, children: ["Born: ", new Date(player.dateOfBirth).toLocaleDateString()] })] })] }) }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Player Analysis" }), _jsx(Text, { children: aiRecap.summary }), _jsx(View, { style: styles.statGrid, children: aiRecap.roleRecommendations.map((role, index) => (_jsxs(View, { style: styles.statItem, children: [_jsxs(Text, { style: styles.statValue, children: [(role.confidence * 100).toFixed(0), "%"] }), _jsx(Text, { style: styles.statLabel, children: role.role })] }, index))) })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Performance Statistics" }), _jsx(View, { style: styles.statGrid, children: Object.entries(player.stats).map(([key, value]) => (_jsxs(View, { style: styles.statItem, children: [_jsx(Text, { style: styles.statValue, children: value }), _jsx(Text, { style: styles.statLabel, children: key.replace(/([A-Z])/g, ' $1').trim() })] }, key))) })] })] }), _jsxs(Page, { size: "A4", style: styles.page, children: [_jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Achievements & Badges" }), _jsx(View, { style: styles.badgeGrid, children: badges.map((badge) => (_jsxs(View, { style: styles.badge, children: [_jsx(Image, { src: badge.icon, style: styles.badgeIcon }), _jsx(Text, { style: styles.badgeName, children: badge.name })] }, badge.id))) })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Highlight Moments" }), _jsx(View, { style: styles.snapshotGrid, children: videoSnapshots.map((snapshot, index) => (_jsxs(View, { style: styles.snapshot, children: [_jsx(Image, { src: snapshot.url, style: styles.snapshotImage }), _jsxs(Text, { style: styles.snapshotCaption, children: [snapshot.description, " (", formatTimestamp(snapshot.timestamp), ")"] })] }, index))) })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Recent Training Performance" }), drillHistory.map((drill, index) => (_jsxs(View, { style: {
                                marginBottom: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }, children: [_jsxs(View, { style: { flex: 1 }, children: [_jsx(Text, { style: { fontSize: 12, fontWeight: 700 }, children: drill.name }), _jsx(Text, { style: { fontSize: 10, color: '#666' }, children: drill.date })] }), _jsx(View, { style: { width: 100, alignItems: 'flex-end' }, children: _jsxs(Text, { style: {
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: drill.performance >= 7 ? '#4CAF50' : '#FF9800',
                                        }, children: [drill.performance, "/10"] }) })] }, index)))] }), _jsx(View, { style: styles.footer, fixed: true, children: _jsxs(Text, { children: ["Confidential Scouting Report \u2022 ", player.firstName, " ", player.lastName, " \u2022", ' ', "Page ", _jsx(Text, { render: ({ pageNumber }) => pageNumber }), " of", ' ', _jsx(Text, { render: ({ totalPages }) => totalPages })] }) })] })] }));
const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

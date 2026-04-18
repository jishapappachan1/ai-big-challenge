import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

/** Competition window: 90 days from this instant (UTC). Change for your launch. */
const COMPETITION_START_MS = Date.UTC(2026, 3, 18, 0, 0, 0, 0);
const COMPETITION_END_MS = COMPETITION_START_MS + 90 * 86400000;

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function initialsFromEmail(email) {
  if (!email || typeof email !== 'string') return '?';
  const local = email.split('@')[0] || '';
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return (local[0] || '?').toUpperCase();
}

function displayNameFromEmail(email) {
  if (!email) return 'Member';
  const local = email.split('@')[0] || '';
  if (!local) return 'Member';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [creative, setCreative] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const shortlisted =
    creative?.submitted && creative.rank != null && creative.rank <= 300;

  const tickCountdown = useCallback(() => {
    let diff = COMPETITION_END_MS - Date.now();
    if (diff < 0) diff = 0;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setCd({ d, h, m, s });
  }, []);

  useEffect(() => {
    tickCountdown();
    const id = setInterval(tickCountdown, 1000);
    return () => clearInterval(id);
  }, [tickCountdown]);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = (await AsyncStorage.getItem('userEmail')) || '';
      setUserEmail(email);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [leaderboardRes, attemptsRes, creativeRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/leaderboard`),
        axios.get(`${API_BASE}/my-quiz-attempts`, { headers }),
        token
          ? axios.get(`${API_BASE}/my-creative-result`, { headers }).catch(() => ({ data: { submitted: false } }))
          : Promise.resolve({ data: { submitted: false } }),
        token
          ? axios.get(`${API_BASE}/my-creative-submissions`, { headers }).catch(() => ({ data: { submissions: [] } }))
          : Promise.resolve({ data: { submissions: [] } }),
      ]);

      setLeaderboard(leaderboardRes.data.leaderboard || []);
      setAttemptsUsed(attemptsRes.data.attempts_used ?? 0);
      setMaxAttempts(attemptsRes.data.max_attempts ?? 10);
      setAttemptsRemaining(attemptsRes.data.attempts_remaining ?? 0);
      setCreative(creativeRes.data?.submitted ? creativeRes.data : null);
      setSubmissionHistory(historyRes.data?.submissions || []);
    } catch {
      setLeaderboard([]);
      setSubmissionHistory([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'latestAiResult', 'userEmail']);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  const openShortlistOrResult = () => {
    if (!creative?.submitted) {
      navigation.navigate('Result');
      return;
    }
    if (shortlisted) {
      navigation.navigate('ShortlistResult', {
        scores: creative.scores,
        responseText: creative.content || '',
        rank: creative.rank,
        totalEntries: creative.total_entries,
      });
    } else {
      navigation.navigate('Result');
    }
  };

  const memberSince = useMemo(() => {
    try {
      return new Date(COMPETITION_START_MS).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return '2026';
    }
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.hBrand}>The Big Skill Challenge™</Text>
        <Text style={styles.userLabel} numberOfLines={1}>
          {displayNameFromEmail(userEmail)}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'dashboard' && (
          <>
            {creative?.submitted ? (
              <TouchableOpacity style={styles.shortlistBanner} onPress={openShortlistOrResult} activeOpacity={0.85}>
                <View style={styles.slIcon}>
                  <Text style={styles.slIconTxt}>🏆</Text>
                </View>
                <View style={styles.slMid}>
                  <Text style={styles.slTitle}>
                    {shortlisted ? "You're Shortlisted!" : 'Creative entry submitted'}
                  </Text>
                  <Text style={styles.slSub}>
                    {shortlisted && creative.rank != null && creative.total_entries
                      ? `Rank #${creative.rank} · Top cohort`
                      : 'Tap to view AI evaluation'}
                  </Text>
                </View>
                <Text style={styles.slChev}>›</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statN}>{attemptsUsed}</Text>
                <Text style={styles.statL}>Entries Used</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statN}>{attemptsRemaining}</Text>
                <Text style={styles.statL}>Slots Left</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statN, shortlisted && { color: '#4ADE80' }]}>
                  {shortlisted ? 1 : 0}
                </Text>
                <Text style={styles.statL}>Shortlisted</Text>
              </View>
            </View>

            <View style={styles.countdown}>
              <Text style={styles.cdLabel}>Competition Closes In</Text>
              <View style={styles.cdRow}>
                <View style={styles.cdUnit}>
                  <Text style={styles.cdN}>{pad2(cd.d)}</Text>
                  <Text style={styles.cdL}>Days</Text>
                </View>
                <View style={styles.cdUnit}>
                  <Text style={styles.cdN}>{pad2(cd.h)}</Text>
                  <Text style={styles.cdL}>Hours</Text>
                </View>
                <View style={styles.cdUnit}>
                  <Text style={styles.cdN}>{pad2(cd.m)}</Text>
                  <Text style={styles.cdL}>Mins</Text>
                </View>
                <View style={styles.cdUnit}>
                  <Text style={styles.cdN}>{pad2(cd.s)}</Text>
                  <Text style={styles.cdL}>Secs</Text>
                </View>
              </View>
            </View>

            {attemptsRemaining > 0 ? (
              <TouchableOpacity
                style={styles.btnAdd}
                onPress={() => navigation.navigate('Quiz', { restart: true })}
                activeOpacity={0.9}
              >
                <Text style={styles.btnAddText}>Add Another Entry →</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noRetryBox}>
                <Text style={styles.noRetryText}>Maximum entries reached. No reattempts available.</Text>
              </View>
            )}

            <Text style={styles.entriesHint}>
              {attemptsUsed} of {maxAttempts} entries used · {attemptsRemaining} remaining
            </Text>

            <TouchableOpacity style={styles.actionRowLite} onPress={() => navigation.navigate('Result')}>
              <Text style={styles.actionRowLiteText}>VIEW AI RESULT</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.subhead}>Global Leaderboard (Top 10)</Text>
            <View style={styles.leaderboardBox}>
              {leaderboard.map((item, index) => (
                <View key={`${item.email}-${index}`} style={styles.lbRow}>
                  <Text style={styles.lbRank}>#{index + 1}</Text>
                  <Text style={styles.lbEmail}>{item.email}</Text>
                  <Text style={styles.lbScore}>{item.score} / 100</Text>
                </View>
              ))}
              {leaderboard.length === 0 && (
                <Text style={styles.lbEmpty}>No entries yet.</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'entries' && (
          <>
            <View style={styles.entriesHeader}>
              <Text style={styles.entriesTitle}>My Entries</Text>
            </View>
            <Text style={styles.entriesMetaLine}>
              {submissionHistory.length} saved pitch{submissionHistory.length === 1 ? '' : 'es'} (history)
            </Text>
            <Text style={styles.entriesMetaSub}>
              Quiz attempts used: {attemptsUsed} of {maxAttempts} (each try / timeout / submit can use one)
            </Text>

            {submissionHistory.length > 0 ? (
              submissionHistory.map((item, index) => {
                const isLatest = index === 0;
                const rowShortlisted = isLatest && shortlisted;
                const score = Math.round(Number(item.total_score ?? 0));
                const expanded = expandedSubmissionId === item.id;
                const dateStr = item.created_at
                  ? new Date(item.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';
                return (
                  <View key={item.id} style={styles.entryCard}>
                    <View style={styles.eHead}>
                      <View
                        style={[
                          styles.eStatus,
                          rowShortlisted ? styles.eStatusShort : styles.eStatusOk,
                        ]}
                      >
                        <Text style={rowShortlisted ? styles.eStatusTxtShort : styles.eStatusTxtOk}>
                          {rowShortlisted ? '⭐ Shortlisted' : isLatest ? '✓ Latest' : '✓ Submitted'}
                        </Text>
                      </View>
                      <Text style={styles.eDate}>{dateStr}</Text>
                    </View>
                    <Text style={styles.eRef}>#{item.id} · Score {score} / 100</Text>
                    <Text style={styles.ePreview} numberOfLines={expanded ? undefined : 2}>
                      {item.content ? `"${item.content}"` : '—'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setExpandedSubmissionId(expanded ? null : item.id)}
                      hitSlop={{ top: 8, bottom: 8 }}
                    >
                      <Text style={styles.entryHint}>{expanded ? 'Tap to collapse' : 'Tap to expand full text'}</Text>
                    </TouchableOpacity>
                    {isLatest ? (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Result')}
                        style={styles.entryLink}
                      >
                        <Text style={styles.entryLinkTxt}>Open current AI result screen →</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            ) : creative?.submitted ? (
              <View style={styles.entryCard}>
                <Text style={styles.entriesFallbackTitle}>Current pitch (no history yet)</Text>
                <Text style={styles.entriesFallbackBody}>
                  Your next resubmit will start a saved history. Score{' '}
                  {Math.round(Number(creative.scores?.total_score ?? 0))} / 100
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Result')} style={styles.entryLink}>
                  <Text style={styles.entryLinkTxt}>View details →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.entriesEmpty}>No creative submission yet. Pass the quiz and submit your pitch.</Text>
            )}
          </>
        )}

        {activeTab === 'account' && (
          <>
            <View style={styles.accountTop}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{initialsFromEmail(userEmail)}</Text>
              </View>
              <Text style={styles.accountName}>{displayNameFromEmail(userEmail)}</Text>
              <Text style={styles.accountSince}>Member since {memberSince}</Text>
            </View>
            <View style={styles.actionGroup}>
              <View style={styles.actionRow}>
                <Text style={styles.actionIcon}>✉</Text>
                <View style={styles.actionMid}>
                  <Text style={styles.actionTitle}>Email</Text>
                  <Text style={styles.actionSub}>{userEmail || '—'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.btnSignOut} onPress={handleLogout}>
              <Text style={styles.btnSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Text style={styles.footer}>Pure skill. One prize. One winner.</Text>

      <View style={styles.nav}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setActiveTab('dashboard')}
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>🧠</Text>
            <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>Dashboard</Text>
            {activeTab === 'dashboard' ? <View style={styles.navDot} /> : <View style={styles.navDotHidden} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('entries')}>
            <Text style={styles.navIcon}>🏆</Text>
            <Text style={[styles.navLabel, activeTab === 'entries' && styles.navLabelActive]}>My Entries</Text>
            {activeTab === 'entries' ? <View style={styles.navDot} /> : <View style={styles.navDotHidden} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('account')}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={[styles.navLabel, activeTab === 'account' && styles.navLabelActive]}>Account</Text>
            {activeTab === 'account' ? <View style={styles.navDot} /> : <View style={styles.navDotHidden} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08002E' },
  header: {
    paddingTop: 48,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 0, 46, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  hBrand: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    marginRight: 8,
  },
  userLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', maxWidth: 120, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  shortlistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  slIcon: {
    marginRight: 12,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  slIconTxt: { fontSize: 20 },
  slMid: { flex: 1 },
  slTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  slSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  slChev: { color: '#F59E0B', fontSize: 20, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statN: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  statL: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textAlign: 'center' },
  countdown: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cdLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  cdRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cdUnit: {
    width: '23%',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  cdN: { fontSize: 20, fontWeight: '900', color: '#C4B5FD' },
  cdL: { fontSize: 10, color: 'rgba(196,181,253,0.6)', fontWeight: '600', marginTop: 2 },
  btnAdd: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#EA580C',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnAddText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  noRetryBox: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  noRetryText: { color: '#FCA5A5', textAlign: 'center', fontSize: 13, fontWeight: '600' },
  entriesHint: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 14,
  },
  actionRowLite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  actionRowLiteText: { color: '#F59E0B', fontWeight: '800', fontSize: 14 },
  chevron: { color: 'rgba(255,255,255,0.25)', fontSize: 18 },
  subhead: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  leaderboardBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  lbRank: { color: '#F59E0B', fontWeight: '800', width: 36 },
  lbEmail: { color: '#FFF', flex: 1, fontSize: 14 },
  lbScore: { color: '#4ADE80', fontWeight: '800', fontSize: 14 },
  lbEmpty: { color: 'rgba(255,255,255,0.5)', paddingVertical: 8, textAlign: 'center' },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entriesTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  entriesMetaLine: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  entriesMetaSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
    lineHeight: 16,
  },
  entriesFallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 8,
  },
  entriesFallbackBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    marginBottom: 8,
  },
  entriesEmpty: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22 },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  eHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  eStatus: { borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1 },
  eStatusShort: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
  eStatusOk: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.25)' },
  eStatusTxtShort: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  eStatusTxtOk: { color: '#4ADE80', fontSize: 12, fontWeight: '700' },
  eRef: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' },
  eSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  eDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  ePreview: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
  entryHint: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 8,
    fontWeight: '700',
  },
  entryLink: { marginTop: 10 },
  entryLinkTxt: { color: '#F59E0B', fontWeight: '700', fontSize: 14 },
  accountTop: {
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  accountName: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  accountSince: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  actionIcon: { width: 28, textAlign: 'center', fontSize: 18, marginRight: 12 },
  actionMid: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  actionSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  btnSignOut: {
    marginTop: 14,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  btnSignOutText: { color: '#F87171', fontWeight: '700', fontSize: 15 },
  footer: {
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  nav: {
    backgroundColor: 'rgba(8, 0, 46, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  navRow: { flexDirection: 'row', justifyContent: 'space-around' },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcon: { fontSize: 20, marginBottom: 2 },
  navLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  navLabelActive: { color: '#F59E0B' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#F59E0B', marginTop: 3 },
  navDotHidden: { width: 4, height: 4, marginTop: 3 },
});

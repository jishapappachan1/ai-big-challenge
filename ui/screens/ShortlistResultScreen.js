import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

const PROMPT =
  'In exactly 25 words, tell us why you should win this prize.';

function pct25(score) {
  const n = Number(score) || 0;
  return Math.min(100, Math.round((n / 25) * 100));
}

function formatCount(n) {
  const x = Number(n) || 0;
  return x.toLocaleString('en-US');
}

export default function ShortlistResultScreen({ navigation, route }) {
  const {
    scores: initialScores,
    responseText: initialResponse,
    rank: initialRank,
    totalEntries: initialTotal,
  } = route.params || {};

  const [scores, setScores] = useState(initialScores || null);
  const [responseText, setResponseText] = useState(initialResponse || '');
  const [rank, setRank] = useState(initialRank ?? null);
  const [totalEntries, setTotalEntries] = useState(initialTotal ?? null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rubricOpen, setRubricOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const total = scores?.total_score != null ? Math.round(Number(scores.total_score)) : 0;
  const shortlisted = rank != null && rank <= 300;

  const loadAudit = useCallback(async () => {
    if (auditEvents.length > 0 || auditLoading) return;
    setAuditLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/my-evaluation-audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditEvents(res.data?.events || []);
    } catch {
      setAuditEvents([]);
    } finally {
      setAuditLoading(false);
    }
  }, [auditEvents.length, auditLoading]);

  useEffect(() => {
    if (auditOpen) loadAudit();
  }, [auditOpen, loadAudit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        const res = await axios.get(`${API_BASE}/my-creative-result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || !res.data?.submitted) return;
        setScores(res.data.scores);
        if (res.data.content) setResponseText(res.data.content);
        if (res.data.rank != null) setRank(res.data.rank);
        if (res.data.total_entries != null) setTotalEntries(res.data.total_entries);
      } catch {
        /* keep route params */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rel = pct25(scores?.relevance);
  const cre = pct25(scores?.creativity);
  const cla = pct25(scores?.clarity);
  const imp = pct25(scores?.impact);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <View style={styles.trophy}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </View>
        {shortlisted ? (
          <View style={styles.slBadge}>
            <Text style={styles.slBadgeText}>⭐ Shortlisted — Top 300</Text>
          </View>
        ) : (
          <View style={[styles.slBadge, styles.slBadgeMuted]}>
            <Text style={styles.slBadgeTextMuted}>✅ Entry scored</Text>
          </View>
        )}
        <Text style={styles.heroTitle}>Congratulations!</Text>
        <Text style={styles.heroSub}>
          {rank != null && totalEntries != null ? (
            <>
              Your entry is <Text style={styles.heroAccent}>#{rank}</Text> of{' '}
              <Text style={styles.heroAccent}>{formatCount(totalEntries)}</Text> scored submissions
              {totalEntries >= 100 ? (
                <>
                  {' '}
                  (top <Text style={styles.heroAccent}>{topPercent(rank, totalEntries)}%</Text> by placement).
                </>
              ) : (
                '.'
              )}
            </>
          ) : (
            'Your creative entry has been scored and recorded.'
          )}
        </Text>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoBarText}>
          <Text style={styles.infoStrong}>🧠 Lucid Engine AI™</Text> — structured evaluation against a fixed
          rubric. <Text style={styles.infoStrong}>Final winners confirmed by independent human judges.</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>AI Evaluation Score</Text>
          <Text style={styles.cardTitleMeta}>Lucid Engine AI™</Text>
        </View>
        <View style={styles.scoreWrap}>
          <View style={styles.scoreCircleOuter}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleNum}>{total}</Text>
              <Text style={styles.scoreCircleSlash}>/100</Text>
            </View>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreRank}>Rank #{rank != null ? rank : '—'}</Text>
            <Text style={styles.scoreCount}>of {formatCount(totalEntries ?? 0)} entries</Text>
            {shortlisted ? (
              <View style={styles.proceeding}>
                <Text style={styles.proceedingText}>✅ Proceeding to judging</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.accBtn}
          onPress={() => setRubricOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel="Toggle rubric breakdown"
        >
          <Text style={styles.accBtnText}>View Rubric Breakdown</Text>
          <Text style={styles.accArrow}>{rubricOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {rubricOpen ? (
          <View style={styles.breakdown}>
            <RubricBar label="Relevance to the Prompt" pct={rel} color="#F59E0B" />
            <RubricBar label="Creativity & Originality" pct={cre} color="#7C3AED" />
            <RubricBar label="Clarity & Expression" pct={cla} color="#3B82F6" />
            <RubricBar label="Overall Impact" pct={imp} color="#4ADE80" last />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitleOnly}>Your Submission</Text>
        <View style={styles.promptBox}>
          <Text style={styles.plbl}>Prompt</Text>
          <Text style={styles.ptextMuted}>"{PROMPT}"</Text>
        </View>
        <Text style={styles.plbl}>Your response</Text>
        <Text style={styles.ptextItalic}>{responseText ? `"${responseText}"` : '—'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>✅ 25 words</Text>
          <Text style={[styles.metaItem, styles.metaItemRight]}>🔒 Submitted</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitleOnly}>What Happens Next</Text>
        <Step n={1} text="Independent judges may score your entry separately." />
        <Step n={2} text="Evaluations are aggregated after all reviews complete." />
        <Step n={3} text="Tied entries may go through secondary review." />
        <Step n={4} text="Process can be verified against the audit trail." />
        <Step n={5} text="Winners announced at competition close." last />
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.accBtn}
          onPress={() => setAuditOpen((o) => !o)}
          accessibilityRole="button"
        >
          <Text style={styles.accBtnText}>🛡 Immutable Audit Trail</Text>
          <Text style={styles.accArrow}>{auditOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {auditOpen ? (
          <View style={styles.auditBox}>
            {auditLoading ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 12 }} />
            ) : auditEvents.length === 0 ? (
              <Text style={styles.auditEmpty}>No audit events stored for this submission yet.</Text>
            ) : (
              auditEvents.map((ev, i) => (
                <View key={i} style={[styles.auditRow, i === auditEvents.length - 1 && styles.auditRowLast]}>
                  <Text style={styles.auditEv}>
                    {ev.tool_name || ev.stage || 'event'}
                    {ev.agent ? ` · ${ev.agent}` : ''}
                  </Text>
                  <Text style={styles.auditTs}>{ev.created_at || ''}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.btnCta}
        onPress={() => navigation.navigate('Dashboard')}
        activeOpacity={0.9}
      >
        <Text style={styles.btnCtaText}>View All My Entries →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Result')}>
        <Text style={styles.btnSecondaryText}>Detailed AI rubric view</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Pure skill. One prize. One winner.</Text>
    </ScrollView>
  );
}

function topPercent(rank, total) {
  if (!rank || !total || total < 1) return '—';
  const p = (rank / total) * 100;
  if (p < 0.01) return '0.01';
  if (p < 1) return p.toFixed(2);
  return Math.max(1, Math.round(p)).toString();
}

function RubricBar({ label, pct, color, last }) {
  return (
    <View style={[styles.rubricRow, last && { marginBottom: 0 }]}>
      <View style={styles.rubricHead}>
        <Text style={styles.rubricLabel}>{label}</Text>
        <Text style={[styles.rubricPct, { color }]}>{pct}</Text>
      </View>
      <View style={styles.rubricTrack}>
        <View style={[styles.rubricFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Step({ n, text, last }) {
  return (
    <View style={[styles.stepItem, last && { marginBottom: 0 }]}>
      <View style={[styles.stepN, { marginRight: 10 }]}>
        <Text style={styles.stepNText}>{n}</Text>
      </View>
      <Text style={styles.stepBody}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#08002E' },
  scrollContent: { paddingBottom: 40 },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  trophy: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  trophyEmoji: { fontSize: 34 },
  slBadge: {
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    marginBottom: 10,
  },
  slBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  slBadgeText: { color: '#4ADE80', fontSize: 12, fontWeight: '800' },
  slBadgeTextMuted: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  heroSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  heroAccent: { color: '#F59E0B', fontWeight: '800' },
  infoBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoBarText: { fontSize: 13, color: 'rgba(180, 210, 255, 0.85)', lineHeight: 20 },
  infoStrong: { color: '#FFF', fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  cardTitleMeta: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  cardTitleOnly: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  scoreCircleOuter: { marginRight: 18 },
  scoreCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: 'rgba(245, 158, 11, 0.85)',
    backgroundColor: 'rgba(8, 0, 46, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleNum: { fontSize: 26, fontWeight: '900', color: '#F59E0B' },
  scoreCircleSlash: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  scoreInfo: { flex: 1 },
  scoreRank: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  scoreCount: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  proceeding: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  proceedingText: { fontSize: 12, fontWeight: '700', color: '#4ADE80' },
  accBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 40,
  },
  accBtnText: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  accArrow: { color: '#F59E0B', fontSize: 14 },
  breakdown: { marginTop: 12 },
  rubricRow: { marginBottom: 12 },
  rubricHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  rubricLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', flex: 1, paddingRight: 8 },
  rubricPct: { fontSize: 13, fontWeight: '700' },
  rubricTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  rubricFill: { height: 8, borderRadius: 8 },
  promptBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  plbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  ptextMuted: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  ptextItalic: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  metaItem: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  metaItemRight: { textAlign: 'right' },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepN: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNText: { fontSize: 11, fontWeight: '800', color: '#C4B5FD' },
  stepBody: { flex: 1, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.55)' },
  auditBox: { marginTop: 12 },
  auditRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  auditRowLast: { borderBottomWidth: 0 },
  auditEv: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  auditTs: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  auditEmpty: { fontSize: 13, color: 'rgba(255,255,255,0.45)', paddingVertical: 8 },
  btnCta: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnCtaText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  btnSecondary: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#C4B5FD', fontSize: 14, fontWeight: '700' },
  footer: {
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});

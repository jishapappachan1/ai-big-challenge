import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResultScreen({ navigation }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const stored = await AsyncStorage.getItem('latestAiResult');
        if (stored) {
          setResult(JSON.parse(stored));
        } else {
          // Fallback if no result is found
          setResult({
            total_score: 0,
            relevance: 0,
            creativity: 0,
            clarity: 0,
            impact: 0
          });
        }
      } catch (e) {
        console.error("Failed to load result", e);
      }
    };
    loadResult();
  }, []);

  if (!result) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backTxt}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.header}>AI Evaluation Result</Text>
      
      <View style={styles.scoreCircle}>
        <Text style={styles.scoreNum}>{result.total_score}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
      </View>

      <Text style={styles.rubricHead}>Rubric Breakdown</Text>
      
      <View style={styles.rubricBox}>
        <RubricRow title="Relevance (25)" score={result.relevance} />
        <RubricRow title="Creativity (25)" score={result.creativity} />
        <RubricRow title="Clarity (25)" score={result.clarity} />
        <RubricRow title="Impact (25)" score={result.impact} />
      </View>
      
    </ScrollView>
  );
}

function RubricRow({ title, score }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowScore}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08002E',
    padding: 20,
    paddingTop: 50,
  },
  backBtn: {
    marginBottom: 20,
  },
  backTxt: {
    color: '#F59E0B',
    fontSize: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: '#4ADE80',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  scoreNum: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreMax: {
    fontSize: 18,
    color: '#C4B5FD',
  },
  rubricHead: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  rubricBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowTitle: {
    color: '#C4B5FD',
    fontSize: 16,
  },
  rowScore: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>BIG WIN</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>WIN A £250,000 DREAM HOME</Text>
        <Text style={styles.subtitle}>Enter now for your chance to win life-changing prizes.</Text>
        
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaText}>ENTER NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08002E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 20,
  },
  badgeText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#C4B5FD',
    textAlign: 'center',
    marginBottom: 40,
  },
  ctaButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 50,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

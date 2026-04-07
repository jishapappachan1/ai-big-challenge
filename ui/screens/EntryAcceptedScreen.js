import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EntryAcceptedScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎯</Text>
      <Text style={styles.header}>Entry Accepted</Text>
      <Text style={styles.message}>
        Your creative response has been recorded and handed to the Global AI evaluators.
      </Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.buttonText}>GO TO DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#08002E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    color: '#C4B5FD',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

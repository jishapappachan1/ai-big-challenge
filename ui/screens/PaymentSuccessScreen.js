import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PaymentSuccessScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.header}>Payment Confirmed!</Text>
      <Text style={styles.details}>
        Your £2.99 entry fee has been received. 
        You now have 1 attempt to complete the quiz.
      </Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Quiz')}
      >
        <Text style={styles.buttonText}>START QUIZ</Text>
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
    marginBottom: 15,
  },
  details: {
    color: '#C4B5FD',
    fontSize: 16,
    textAlign: 'center',
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

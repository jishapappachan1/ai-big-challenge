import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PaymentScreen({ navigation }) {
  const handlePayment = () => {
    // Mocking payment processing
    setTimeout(() => {
      navigation.navigate('PaymentSuccess');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Complete Entry</Text>
      
      <View style={styles.card}>
        <Text style={styles.price}>£2.99</Text>
        <Text style={styles.details}>1x Challenge Entry Fee</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePayment}>
        <Text style={styles.buttonText}>PAY NOW</Text>
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
  },
  header: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 40,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ADE80',
    marginBottom: 10,
  },
  details: {
    color: '#C4B5FD',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

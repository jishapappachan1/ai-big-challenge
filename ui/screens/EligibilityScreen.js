import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EligibilityScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Confirm Eligibility</Text>
      
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => setAgreed(!agreed)}
      >
        <View style={[styles.checkbox, agreed && styles.checked]} />
        <Text style={styles.checkboxText}>
          I confirm I am over 18, a UK resident, and agree to the Terms & Conditions.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, !agreed && styles.buttonDisabled]} 
        onPress={() => agreed && navigation.navigate('Payment')}
        disabled={!agreed}
      >
        <Text style={styles.buttonText}>CONTINUE TO PAYMENT</Text>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderRadius: 4,
    marginRight: 15,
  },
  checked: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  checkboxText: {
    color: '#FFF',
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

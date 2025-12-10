import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  size?: number;
  color?: string;
  renderTrigger?: (onPress: () => void) => React.ReactNode;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  selectedCurrency,
  onCurrencyChange,
  size = 20,
  color = '#666',
  renderTrigger
}) => {
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currencies = [
    { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', flag: '🇧🇷' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  ];

  const handleSelectCurrency = (code: string) => {
    onCurrencyChange(code);
    setModalVisible(false);
  };

  const getCurrentCurrency = () => {
    return currencies.find(curr => curr.code === selectedCurrency) || currencies[0];
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setModalVisible(true))
      ) : (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.container}>
          <MaterialCommunityIcons name="currency-usd" size={size} color={color} />
        </TouchableOpacity>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('profile.selectCurrency')}</Text>
            
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  selectedCurrency === currency.code && styles.selectedCurrency
                ]}
                onPress={() => handleSelectCurrency(currency.code)}
              >
                <View style={styles.currencyIcon}>
                  <Text style={styles.flagEmoji}>{currency.flag}</Text>
                </View>
                <View style={styles.currencyInfo}>
                  <Text style={[
                    styles.currencyName,
                    selectedCurrency === currency.code && styles.selectedCurrencyName
                  ]}>
                    {currency.name}
                  </Text>
                  <Text style={[
                    styles.currencyCode,
                    selectedCurrency === currency.code && styles.selectedCurrencyCode
                  ]}>
                    {currency.code} ({currency.symbol})
                  </Text>
                </View>
                {selectedCurrency === currency.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 380,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedCurrency: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  currencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  flagEmoji: {
    fontSize: 20,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedCurrencyName: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  currencyCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedCurrencyCode: {
    color: '#2196F3',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
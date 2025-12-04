import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, Image, Pressable } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  size?: number;
  color?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  size = 28, 
  color = '#FFFFFF' 
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const getFlag = () => {
    switch (language) {
      case 'es': return require('../../assets/images/es.png');
      case 'en': return require('../../assets/images/en.png');
      case 'pt': return require('../../assets/images/pt.png');
      default: return require('../../assets/images/es.png');
    }
  };

  const languages = [
    { code: 'es', name: 'Español', flag: require('../../assets/images/es.png') },
    { code: 'en', name: 'English', flag: require('../../assets/images/en.png') },
    { code: 'pt', name: 'Português', flag: require('../../assets/images/pt.png') },
  ];

  const handleSelectLanguage = (code: string) => {
    setLanguage(code as 'es' | 'en' | 'pt');
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.container}>
        <Image source={getFlag()} style={{ width: size, height: size, borderRadius: size / 2 }} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('message.selectLanguage')}</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedLanguage
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <Image source={lang.flag} style={styles.flagImage} />
                <Text style={[
                  styles.languageName,
                  language === lang.code && styles.selectedLanguageName
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
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
    width: '80%',
    maxWidth: 340,
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedLanguage: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  flagImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  selectedLanguageName: {
    color: '#2196F3',
    fontWeight: 'bold',
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
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

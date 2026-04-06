import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, Pressable } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  size?: number;
  color?: string;
  renderTrigger?: (onPress: () => void) => React.ReactNode;
  // Control externo del modal (para evitar Modals anidados)
  visible?: boolean;
  onClose?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  size = 28, 
  color = '#FFFFFF',
  renderTrigger,
  visible: externalVisible,
  onClose
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [internalVisible, setInternalVisible] = useState(false);

  // Si se pasa visible externamente, usar ese; si no, usar estado interno
  const isControlled = externalVisible !== undefined;
  const modalVisible = isControlled ? externalVisible : internalVisible;
  const openModal = () => { if (!isControlled) setInternalVisible(true); };
  const closeModal = () => {
    if (isControlled) { onClose?.(); }
    else { setInternalVisible(false); }
  };

  const getFlag = () => {
    switch (language) {
      case 'es': return '🇦🇷';
      case 'en': return '🇺🇸';
      case 'pt': return '🇧🇷';
      default: return '🇦🇷';
    }
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇦🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
  ];

  const handleSelectLanguage = (code: string) => {
    setLanguage(code as 'es' | 'en' | 'pt');
    closeModal();
  };

  return (
    <>
      {/* Solo renderizar el trigger si no está en modo controlado externamente */}
      {!isControlled && (
        renderTrigger ? (
          renderTrigger(openModal)
        ) : (
          <TouchableOpacity onPress={openModal} style={styles.container}>
            <Text style={{ fontSize: size }}>{getFlag()}</Text>
          </TouchableOpacity>
        )
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
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
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
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
  flagEmoji: {
    fontSize: 32,
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

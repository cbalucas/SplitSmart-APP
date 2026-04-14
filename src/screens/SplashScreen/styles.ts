import { StyleSheet } from 'react-native';

export const createStyles = (logoSize: number) => StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  splashLogo: {
    width: logoSize,
    height: logoSize,
    marginBottom: 8,
  },
  splashVersion: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 40,
  },
  splashSlogan: {
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginHorizontal: 20,
    minHeight: 60, // Para mantener consistencia durante las transiciones
  },
});

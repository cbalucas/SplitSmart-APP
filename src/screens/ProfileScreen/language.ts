// ProfileScreen language keys and helper functions

export const PROFILE_KEYS = {
  // Header
  TITLE: 'profile.title',
  
  // Personal Info Section
  PERSONAL_INFO: 'profile.personalInfo',
  NAME: 'profile.name',
  USERNAME: 'profile.username', // NUEVO
  EMAIL: 'profile.email',
  PHONE: 'profile.phone',
  // CBU: 'profile.cbu', // ELIMINADO
  SAVE_CHANGES: 'profile.saveChanges',
  
  // Stats Section
  STATS: 'profile.stats',
  ACTIVE_EVENTS: 'profile.activeEvents',
  // TOTAL_EXPENSES: 'profile.totalExpenses', // ELIMINADO
  // TOTAL_SPENT: 'profile.totalSpent', // ELIMINADO
  FRIENDS_COUNT: 'profile.friendsCount',
  
  // Preferences Section
  PREFERENCES: 'profile.preferences',
  THEME: 'profile.theme',
  THEME_DARK: 'profile.themeDark',
  THEME_LIGHT: 'profile.themeLight',
  CURRENCY: 'profile.currency',
  LANGUAGE: 'profile.language',
  AUTO_LOGOUT: 'profile.autoLogout',
  AUTO_LOGOUT_DESC: 'profile.autoLogoutDesc',
  AUTO_LOGOUT_NEVER: 'profile.autoLogoutNever',
  AUTO_LOGOUT_5MIN: 'profile.autoLogout5min',
  AUTO_LOGOUT_15MIN: 'profile.autoLogout15min',
  AUTO_LOGOUT_30MIN: 'profile.autoLogout30min',
  
  // Notifications Section
  NOTIFICATIONS: 'profile.notifications',
  
  // Privacy Section
  PRIVACY: 'profile.privacy',
  // SHARE_EMAIL: 'profile.shareEmail', // ELIMINADO
  // SHARE_EMAIL_DESC: 'profile.shareEmailDesc', // ELIMINADO
  // SHARE_PHONE: 'profile.sharePhone', // ELIMINADO
  // SHARE_PHONE_DESC: 'profile.sharePhoneDesc', // ELIMINADO
  SHARE_EVENT: 'profile.shareEvent', // NUEVO
  SHARE_EVENT_DESC: 'profile.shareEventDesc', // NUEVO
  ALLOW_INVITATIONS: 'profile.allowInvitations',
  ALLOW_INVITATIONS_DESC: 'profile.allowInvitationsDesc',
  
  // Security Section
  SECURITY: 'profile.security',
  CHANGE_PASSWORD: 'profile.changePassword',
  NEW_PASSWORD: 'profile.newPassword',
  UPDATE_PASSWORD: 'profile.updatePassword',
  SKIP_PASSWORD: 'profile.skipPassword',
  SKIP_PASSWORD_ON: 'profile.skipPasswordOn',
  SKIP_PASSWORD_OFF: 'profile.skipPasswordOff',
  PASSWORD_UPDATED: 'profile.passwordUpdated',
  PASSWORD_UPDATE_SUCCESS: 'profile.passwordUpdateSuccess',
  SKIP_PASSWORD_UPDATED: 'profile.skipPasswordUpdated',
  SKIP_PASSWORD_ENABLED: 'profile.skipPasswordEnabled',
  SKIP_PASSWORD_DISABLED: 'profile.skipPasswordDisabled',
  
  // Data & Backup Section
  DATA_BACKUP: 'profile.dataBackup',
  EXPORT_DATA: 'profile.exportData',
  EXPORT_DATA_DESC: 'profile.exportDataDesc',
  IMPORT_DATA: 'profile.importData', // NUEVO
  IMPORT_DATA_DESC: 'profile.importDataDesc', // NUEVO
  DELETE_ALL_DATA: 'profile.deleteAllData',
  DELETE_ALL_DATA_DESC: 'profile.deleteAllDataDesc',
  
  // Information Section
  INFORMATION: 'profile.information',
  APP_VERSION: 'profile.appVersion',
  PREVIOUS_VERSIONS: 'profile.previousVersions', // NUEVO
  ABOUT_APP: 'profile.aboutApp', // NUEVO
  TERMS_OF_SERVICE: 'profile.termsOfService',
  PRIVACY_POLICY: 'profile.privacyPolicy',
  CONTACT_SUPPORT: 'profile.contactSupport',
  
  // Modal Keys
  ABOUT_TITLE: 'profile.about.title',
  TERMS_TITLE: 'profile.terms.title',
  PRIVACY_TITLE: 'profile.privacy.title',
  SUPPORT_TITLE: 'profile.support.title',
  
  // Common
  OPTIONAL: 'optional',
  CANCEL: 'cancel',
  SAVE: 'save',
  ERROR: 'error',
  SUCCESS: 'success',
  LOGOUT: 'logout',
  
  // Messages
  MESSAGES: {
    SELECT_LANGUAGE: 'profile.message.selectLanguage',
    CHOOSE_LANGUAGE: 'message.chooseLanguage',
    PICK_IMAGE_ERROR: 'profile.message.pickImageError',
    TAKE_PHOTO_ERROR: 'profile.message.takePhotoError',
    UPDATE_AVATAR_SUCCESS: 'profile.message.updateAvatarSuccess',
    UPDATE_AVATAR_ERROR: 'profile.message.updateAvatarError',
    EXPORT_DATA_TITLE: 'profile.message.exportDataTitle',
    EXPORT_DATA_MESSAGE: 'profile.message.exportDataMessage',
    ALL_DATA: 'profile.message.allData',
    EXPORT_SUCCESS: 'profile.message.exportSuccess',
    EXPORT_ERROR: 'profile.message.exportError',
    DELETE_ALL_DATA_TITLE: 'profile.message.deleteAllDataTitle',
    DELETE_ALL_DATA_MESSAGE: 'profile.message.deleteAllDataMessage',
    DELETE_ALL: 'profile.message.deleteAll',
    DELETE_COMPLETED: 'profile.message.deleteCompleted',
    DELETE_ERROR: 'profile.message.deleteError',
    LOGOUT_TITLE: 'profile.message.logoutTitle',
    LOGOUT_MESSAGE: 'profile.message.logoutMessage',
    CHANGE_AVATAR_TITLE: 'profile.message.changeAvatarTitle',
    CHOOSE_OPTION: 'profile.message.chooseOption',
    TAKE_PHOTO: 'profile.message.takePhoto',
    CHOOSE_FROM_GALLERY: 'profile.message.chooseFromGallery',
    REMOVE_PHOTO: 'profile.message.removePhoto',
    PERMISSION_REQUIRED: 'profile.message.permissionRequired',
    GALLERY_PERMISSION: 'profile.message.galleryPermission',
    CAMERA_PERMISSION: 'profile.message.cameraPermission',
    COMING_SOON: 'profile.message.comingSoon',
    USER_NOT_FOUND: 'profile.message.userNotFound',
    PROFILE_SAVED: 'profile.message.profileSaved',
    PROFILE_SAVE_ERROR: 'profile.message.profileSaveError',
    PASSWORD_TOO_SHORT: 'profile.message.passwordTooShort',
    PASSWORD_CHANGE_ERROR: 'profile.message.passwordChangeError',
    SETTING_UPDATE_ERROR: 'profile.message.settingUpdateError',
    CURRENCY_SELECTOR: 'profile.message.currencySelector',
    TERMS_COMING_SOON: 'profile.message.termsComingSoon',
    PRIVACY_COMING_SOON: 'profile.message.privacyComingSoon',
    SUPPORT_COMING_SOON: 'profile.message.supportComingSoon',
  }
} as const;

export const NOTIFICATION_KEYS = {
  EXPENSE_ADDED: 'notifications.expenseAdded',
  EXPENSE_ADDED_DESC: 'notifications.expenseAddedDesc',
  PAYMENT_RECEIVED: 'notifications.paymentReceived',
  PAYMENT_RECEIVED_DESC: 'notifications.paymentReceivedDesc',
  EVENT_UPDATED: 'notifications.eventUpdated',
  EVENT_UPDATED_DESC: 'notifications.eventUpdatedDesc',
  // WEEKLY_REPORT: 'notifications.weeklyReport', // ELIMINADO
  // WEEKLY_REPORT_DESC: 'notifications.weeklyReportDesc', // ELIMINADO
} as const;

// Helper function to get language display name
export const getLanguageDisplayName = (language: string): string => {
  switch (language) {
    case 'es': return 'Español';
    case 'en': return 'English';
    case 'pt': return 'Português';
    default: return 'Español';
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'ARS' ? 'ARS' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};

// Helper function to get user initials
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
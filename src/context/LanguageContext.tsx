import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the shape of the translation object for each language
interface LanguageTranslations {
  [key: string]: string;
}

// Define the shape of the translations for each key
interface Translations {
  [key: string]: {
    en: string;
    nl: string;
    fr: string;
  };
}

// Define a language option type
interface LanguageOption {
  code: string;
  name: string;
}

// Define the context type
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  availableLanguages: LanguageOption[];
}

// Default language
const defaultLanguage = 'en';

// Available languages
const availableLanguageOptions: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'fr', name: 'Français' },
];

// Initial translations
const translations: Translations = {
  'common.loading': {
    en: 'Loading...',
    nl: 'Laden...',
    fr: 'Chargement...',
  },
  'common.error': {
    en: 'Error',
    nl: 'Fout',
    fr: 'Erreur',
  },
  'nav.home': {
    en: 'Home',
    nl: 'Thuis',
    fr: 'Accueil',
  },
  'nav.profile': {
    en: 'Profile',
    nl: 'Profiel',
    fr: 'Profil',
  },
  'nav.messages': {
    en: 'Messages',
    nl: 'Berichten',
    fr: 'Messages',
  },
  'nav.settings': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
  },
  'nav.notifications': {
    en: 'Notifications',
    nl: 'Meldingen',
    fr: 'Notifications',
  },
  'nav.search': {
    en: 'Search',
    nl: 'Zoeken',
    fr: 'Rechercher',
  },
  'auth.requiresLogin': {
    en: 'Requires Login',
    nl: 'Vereist Login',
    fr: 'Connexion Requise',
  },
  'auth.loginToSave': {
    en: 'Please log in to save posts.',
    nl: 'Log in om berichten op te slaan.',
    fr: 'Veuillez vous connecter pour enregistrer les messages.',
  },
  'auth.logout': {
    en: 'Logout',
    nl: 'Uitloggen',
    fr: 'Déconnexion',
  },
  'post.removed': {
    en: 'Removed',
    nl: 'Verwijderd',
    fr: 'Supprimé',
  },
  'post.removedFromSaved': {
    en: 'Removed from saved posts.',
    nl: 'Verwijderd uit opgeslagen berichten.',
    fr: 'Supprimé des messages enregistrés.',
  },
  'post.saved': {
    en: 'Saved',
    nl: 'Opgeslagen',
    fr: 'Enregistré',
  },
  'post.addedToSaved': {
    en: 'Added to saved posts.',
    nl: 'Toegevoegd aan opgeslagen berichten.',
    fr: 'Ajouté aux messages enregistrés.',
  },
  'post.loadError': {
    en: 'Failed to load posts.',
    nl: 'Kon berichten niet laden.',
    fr: 'Échec du chargement des messages.',
  },
  'post.noPosts': {
    en: 'No posts yet',
    nl: 'Nog geen berichten',
    fr: 'Pas encore de messages',
  },
  'post.beFirst': {
    en: 'Be the first to post!',
    nl: 'Wees de eerste om te posten!',
    fr: 'Soyez le premier à poster !',
  },
  'games.snake': {
    en: 'Snake Game',
    nl: 'Slangen Spel',
    fr: 'Jeu du Serpent',
  },
  'games.title': {
    en: 'Games',
    nl: 'Spellen',
    fr: 'Jeux',
  },
  'leaderboard.title': {
    en: 'Leaderboard',
    nl: 'Klassement',
    fr: 'Classement',
  },
  'coins.earn': {
    en: 'Earn Coins',
    nl: 'Verdien Munten',
    fr: 'Gagner des Pièces',
  },
  'settings.title': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
  },
  'settings.description': {
    en: 'Manage your account settings and preferences.',
    nl: 'Beheer je accountinstellingen en voorkeuren.',
    fr: 'Gérez les paramètres et préférences de votre compte.',
  },
  'settings.profile': {
    en: 'Profile',
    nl: 'Profiel',
    fr: 'Profil',
  },
  'settings.appearance': {
    en: 'Appearance',
    nl: 'Uiterlijk',
    fr: 'Apparence',
  },
  'settings.language': {
    en: 'Language',
    nl: 'Taal',
    fr: 'Langue',
  },
  'settings.notifications': {
    en: 'Notifications',
    nl: 'Meldingen',
    fr: 'Notifications',
  },
  'settings.privacy': {
    en: 'Privacy',
    nl: 'Privacy',
    fr: 'Confidentialité',
  },
  'settings.friends': {
    en: 'Friends',
    nl: 'Vrienden',
    fr: 'Amis',
  },
  'settings.profileSettings': {
    en: 'Profile Settings',
    nl: 'Profielinstellingen',
    fr: 'Paramètres du Profil',
  },
  'settings.profileSettingsDesc': {
    en: 'Update your profile information and preferences.',
    nl: 'Werk je profielinformatie en voorkeuren bij.',
    fr: 'Mettez à jour vos informations de profil et préférences.',
  },
  'settings.accountSettings': {
    en: 'Account Settings',
    nl: 'Accountinstellingen',
    fr: 'Paramètres du Compte',
  },
  'settings.updateProfile': {
    en: 'Update Profile',
    nl: 'Profiel Bijwerken',
    fr: 'Mettre à Jour le Profil',
  },
  'settings.themeSettings': {
    en: 'Theme Settings',
    nl: 'Thema-instellingen',
    fr: 'Paramètres du Thème',
  },
  'settings.themeSettingsDesc': {
    en: 'Customize the appearance of the application.',
    nl: 'Pas het uiterlijk van de applicatie aan.',
    fr: 'Personnalisez l\'apparence de l\'application.',
  },
  'settings.darkMode': {
    en: 'Dark Mode',
    nl: 'Donkere Modus',
    fr: 'Mode Sombre',
  },
  'settings.lightMode': {
    en: 'Light Mode',
    nl: 'Lichte Modus',
    fr: 'Mode Clair',
  },
  'settings.darkModeDesc': {
    en: 'Easier on the eyes at night.',
    nl: 'Rustiger voor de ogen \'s nachts.',
    fr: 'Plus doux pour les yeux la nuit.',
  },
  'settings.lightModeDesc': {
    en: 'Classic bright look.',
    nl: 'Klassieke heldere look.',
    fr: 'Apparence classique et lumineuse.',
  },
  'settings.darkModeEnabled': {
    en: 'Dark Mode Enabled',
    nl: 'Donkere Modus Ingeschakeld',
    fr: 'Mode Sombre Activé',
  },
  'settings.lightModeEnabled': {
    en: 'Light Mode Enabled',
    nl: 'Lichte Modus Ingeschakeld',
    fr: 'Mode Clair Activé',
  },
  'settings.languageSettings': {
    en: 'Language Settings',
    nl: 'Taalinstellingen',
    fr: 'Paramètres de Langue',
  },
  'settings.languageSettingsDesc': {
    en: 'Select your preferred language.',
    nl: 'Selecteer je voorkeurstaal.',
    fr: 'Sélectionnez votre langue préférée.',
  },
  'settings.languageUpdated': {
    en: 'Language Updated',
    nl: 'Taal Bijgewerkt',
    fr: 'Langue Mise à Jour',
  },
  'settings.languageUpdatedDesc': {
    en: 'Your language preference has been updated.',
    nl: 'Je taalvoorkeur is bijgewerkt.',
    fr: 'Votre préférence de langue a été mise à jour.',
  },
  'settings.languageUpdateError': {
    en: 'Failed to update language.',
    nl: 'Kon taal niet bijwerken.',
    fr: 'Échec de la mise à jour de la langue.',
  },
  'settings.themeUpdateError': {
    en: 'Failed to update theme.',
    nl: 'Kon thema niet bijwerken.',
    fr: 'Échec de la mise à jour du thème.',
  },
  'settings.notificationSettings': {
    en: 'Notification Settings',
    nl: 'Meldingsinstellingen',
    fr: 'Paramètres de Notification',
  },
  'settings.notificationSettingsDesc': {
    en: 'Customize when and how you receive notifications.',
    nl: 'Pas aan wanneer en hoe je meldingen ontvangt.',
    fr: 'Personnalisez quand et comment vous recevez des notifications.',
  },
  'settings.messageNotifications': {
    en: 'Message Notifications',
    nl: 'Berichtmeldingen',
    fr: 'Notifications de Messages',
  },
  'settings.messageNotificationsDesc': {
    en: 'Get notified about new messages.',
    nl: 'Word op de hoogte gebracht van nieuwe berichten.',
    fr: 'Soyez informé des nouveaux messages.',
  },
  'settings.likeNotifications': {
    en: 'Like Notifications',
    nl: 'Like-meldingen',
    fr: 'Notifications de J\'aime',
  },
  'settings.likeNotificationsDesc': {
    en: 'Get notified when someone likes your content.',
    nl: 'Word op de hoogte gebracht wanneer iemand je content leuk vindt.',
    fr: 'Soyez informé quand quelqu\'un aime votre contenu.',
  },
  'settings.friendNotifications': {
    en: 'Friend Notifications',
    nl: 'Vriendmeldingen',
    fr: 'Notifications d\'Amis',
  },
  'settings.friendNotificationsDesc': {
    en: 'Get notified about friend requests and updates.',
    nl: 'Word op de hoogte gebracht van vriendschapsverzoeken en updates.',
    fr: 'Soyez informé des demandes d\'amis et des mises à jour.',
  },
  'settings.privacySettings': {
    en: 'Privacy Settings',
    nl: 'Privacy-instellingen',
    fr: 'Paramètres de Confidentialité',
  },
  'settings.privacySettingsDesc': {
    en: 'Control who can see your content and how your data is used.',
    nl: 'Beheer wie je content kan zien en hoe je gegevens worden gebruikt.',
    fr: 'Contrôlez qui peut voir votre contenu et comment vos données sont utilisées.',
  },
  'settings.privateProfile': {
    en: 'Private Profile',
    nl: 'Privé Profiel',
    fr: 'Profil Privé',
  },
  'settings.privateProfileDesc': {
    en: 'Only approved followers can see your posts.',
    nl: 'Alleen goedgekeurde volgers kunnen je berichten zien.',
    fr: 'Seuls les abonnés approuvés peuvent voir vos publications.',
  },
  'settings.showOnlineStatus': {
    en: 'Show Online Status',
    nl: 'Toon Online Status',
    fr: 'Afficher le Statut En Ligne',
  },
  'settings.showOnlineStatusDesc': {
    en: 'Let others see when you\'re active.',
    nl: 'Laat anderen zien wanneer je actief bent.',
    fr: 'Laissez les autres voir quand vous êtes actif.',
  },
  'profile.userOffline': {
    en: 'User is offline',
    nl: 'Gebruiker is offline',
    fr: 'L\'utilisateur est hors ligne',
  },
  'post.save': {
    en: 'Save',
    nl: 'Opslaan',
    fr: 'Enregistrer',
  },
};

// Create the context
const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key: string) => translations[key]?.[defaultLanguage] || key, // Basic implementation
  availableLanguages: availableLanguageOptions,
});

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(defaultLanguage);

  // Function to translate a key
  const t = useCallback((key: string): string => {
    const translation = translations[key]?.[language as keyof typeof translations[typeof key]] || 
                       translations[key]?.[defaultLanguage as keyof typeof translations[typeof key]] || 
                       key;
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      availableLanguages: availableLanguageOptions 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};

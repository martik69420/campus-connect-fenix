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

// Define the context type
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

// Default language
const defaultLanguage = 'en';

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
};

// Create the context
const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key: string) => translations[key]?.[defaultLanguage] || key, // Basic implementation
});

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(defaultLanguage);

  // Function to translate a key
  const t = useCallback((key: string): string => {
    const translation = translations[key]?.[language] || translations[key]?.[defaultLanguage] || key;
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};

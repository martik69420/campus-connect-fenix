
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define available languages
export type LanguageCode = 'en' | 'nl' | 'fr';

export type Translations = {
  [key: string]: {
    [key in LanguageCode]: string;
  };
};

// Define translations
export const translations: Translations = {
  // Common
  'app.name': {
    en: 'Campus Connect',
    nl: 'Campus Connect',
    fr: 'Campus Connect',
  },
  'common.save': {
    en: 'Save',
    nl: 'Opslaan',
    fr: 'Enregistrer',
  },
  'common.cancel': {
    en: 'Cancel',
    nl: 'Annuleren',
    fr: 'Annuler',
  },
  'common.loading': {
    en: 'Loading...',
    nl: 'Laden...',
    fr: 'Chargement...',
  },
  'common.error': {
    en: 'An error occurred',
    nl: 'Er is een fout opgetreden',
    fr: 'Une erreur s\'est produite',
  },
  'common.success': {
    en: 'Success!',
    nl: 'Succes!',
    fr: 'Succès!',
  },
  'common.ok': {
    en: 'OK',
    nl: 'OK',
    fr: 'OK',
  },
  'common.yes': {
    en: 'Yes',
    nl: 'Ja',
    fr: 'Oui',
  },
  'common.no': {
    en: 'No',
    nl: 'Nee',
    fr: 'Non',
  },

  // Auth
  'auth.login': {
    en: 'Login',
    nl: 'Inloggen',
    fr: 'Connexion',
  },
  'auth.signup': {
    en: 'Sign Up',
    nl: 'Registreren',
    fr: 'S\'inscrire',
  },
  'auth.logout': {
    en: 'Logout',
    nl: 'Uitloggen',
    fr: 'Déconnexion',
  },
  'auth.username': {
    en: 'Username',
    nl: 'Gebruikersnaam',
    fr: 'Nom d\'utilisateur',
  },
  'auth.email': {
    en: 'Email',
    nl: 'E-mail',
    fr: 'E-mail',
  },
  'auth.password': {
    en: 'Password',
    nl: 'Wachtwoord',
    fr: 'Mot de passe',
  },

  // Navigation
  'nav.home': {
    en: 'Home',
    nl: 'Home',
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
  'nav.search': {
    en: 'Search',
    nl: 'Zoeken',
    fr: 'Rechercher',
  },
  
  // Messages
  'messages.new': {
    en: 'New Message',
    nl: 'Nieuw Bericht',
    fr: 'Nouveau Message',
  },
  'messages.send': {
    en: 'Send',
    nl: 'Versturen',
    fr: 'Envoyer',
  },
  'messages.placeholder': {
    en: 'Type a message...',
    nl: 'Typ een bericht...',
    fr: 'Tapez un message...',
  },
  'messages.noMessages': {
    en: 'No messages yet',
    nl: 'Nog geen berichten',
    fr: 'Pas encore de messages',
  },
  'messages.selectContact': {
    en: 'Select a contact to start messaging',
    nl: 'Selecteer een contact om te beginnen met chatten',
    fr: 'Sélectionnez un contact pour commencer à discuter',
  },
  
  // Settings
  'settings.account': {
    en: 'Account Settings',
    nl: 'Account Instellingen',
    fr: 'Paramètres du Compte',
  },
  'settings.profile': {
    en: 'Profile Settings',
    nl: 'Profiel Instellingen',
    fr: 'Paramètres du Profil',
  },
  'settings.privacy': {
    en: 'Privacy Settings',
    nl: 'Privacy Instellingen',
    fr: 'Paramètres de Confidentialité',
  },
  'settings.notifications': {
    en: 'Notification Settings',
    nl: 'Notificatie Instellingen',
    fr: 'Paramètres de Notification',
  },
  'settings.language': {
    en: 'Language',
    nl: 'Taal',
    fr: 'Langue',
  },
  'settings.language.english': {
    en: 'English',
    nl: 'Engels',
    fr: 'Anglais',
  },
  'settings.language.dutch': {
    en: 'Dutch',
    nl: 'Nederlands',
    fr: 'Néerlandais',
  },
  'settings.language.french': {
    en: 'French',
    nl: 'Frans',
    fr: 'Français',
  },
  
  // Posts
  'post.create': {
    en: 'Create Post',
    nl: 'Bericht Maken',
    fr: 'Créer une Publication',
  },
  'post.comment': {
    en: 'Comment',
    nl: 'Reactie',
    fr: 'Commentaire',
  },
  'post.like': {
    en: 'Like',
    nl: 'Leuk',
    fr: 'J\'aime',
  },
  'post.share': {
    en: 'Share',
    nl: 'Delen',
    fr: 'Partager',
  },
  'post.report': {
    en: 'Report',
    nl: 'Rapporteren',
    fr: 'Signaler',
  },
  
  // Games
  'games.title': {
    en: 'Games',
    nl: 'Spellen',
    fr: 'Jeux',
  },
  'games.play': {
    en: 'Play Now',
    nl: 'Nu Spelen',
    fr: 'Jouer Maintenant',
  },
  'games.leaderboard': {
    en: 'Leaderboard',
    nl: 'Scorebord',
    fr: 'Classement',
  },
  'games.rewards': {
    en: 'Rewards',
    nl: 'Beloningen',
    fr: 'Récompenses',
  }
};

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: string) => string;
  availableLanguages: Array<{ code: LanguageCode, name: string }>;
}

const defaultLanguage: LanguageCode = 'nl';

const LanguageContext = createContext<LanguageContextProps>({
  language: defaultLanguage,
  setLanguage: async () => {},
  t: () => '',
  availableLanguages: [
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ]
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch the user's language preference when they authenticate
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('language')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching language preference:', error);
            return;
          }
          
          if (data?.language) {
            setLanguageState(data.language as LanguageCode);
          }
        } catch (error) {
          console.error('Failed to fetch language settings:', error);
        }
      }
    };
    
    fetchLanguagePreference();
  }, [isAuthenticated, user?.id]);
  
  // Function to set language and save preference to database
  const setLanguage = async (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    
    if (isAuthenticated && user?.id) {
      try {
        // Check if user settings exist
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (existingSettings) {
          // Update existing settings
          const { error } = await supabase
            .from('user_settings')
            .update({ language: newLanguage })
            .eq('user_id', user.id);
            
          if (error) {
            console.error('Error updating language preference:', error);
          }
        } else {
          // Create new settings
          const { error } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id, language: newLanguage });
            
          if (error) {
            console.error('Error creating language preference:', error);
          }
        }
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };
  
  // Translation function
  const t = (key: string) => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return translation[language] || translation.en || key;
  };
  
  const availableLanguages = [
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

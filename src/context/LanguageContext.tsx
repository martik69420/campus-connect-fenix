
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

// Define the available languages with their metadata
export const availableLanguages: Array<{ code: LanguageCode; name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'fr', name: 'Français' }
];

// Define translations
export const translations: Translations = {
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
  'nav.games': {
    en: 'Games',
    nl: 'Spellen',
    fr: 'Jeux',
  },
  'nav.auth': {
    en: 'Login/Register',
    nl: 'Inloggen/Registreren',
    fr: 'Se connecter/S\'inscrire',
  },
  'auth.requiresLogin': {
    en: 'Requires Login',
    nl: 'Vereist Inloggen',
    fr: 'Connexion Requise',
  },
  'auth.loginToSave': {
    en: 'Please log in to save this post.',
    nl: 'Log in om dit bericht op te slaan.',
    fr: 'Veuillez vous connecter pour enregistrer ce post.',
  },
  'common.error': {
    en: 'Error',
    nl: 'Fout',
    fr: 'Erreur',
  },
  'common.loading': {
    en: 'Loading...',
    nl: 'Laden...',
    fr: 'Chargement...',
  },
  'common.delete': {
    en: 'Delete',
    nl: 'Verwijderen',
    fr: 'Supprimer',
  },
  'post.removed': {
    en: 'Removed',
    nl: 'Verwijderd',
    fr: 'Supprimé',
  },
  'post.removedFromSaved': {
    en: 'Post removed from saved posts.',
    nl: 'Bericht verwijderd uit opgeslagen berichten.',
    fr: 'Post supprimé des messages enregistrés.',
  },
  'post.saved': {
    en: 'Saved',
    nl: 'Opgeslagen',
    fr: 'Enregistré',
  },
  'post.addedToSaved': {
    en: 'Post added to saved posts.',
    nl: 'Bericht toegevoegd aan opgeslagen berichten.',
    fr: 'Post ajouté aux messages enregistrés.',
  },
  'post.loadError': {
    en: 'Failed to load posts. Please try again.',
    nl: 'Kon berichten niet laden. Probeer het opnieuw.',
    fr: 'Impossible de charger les messages. Veuillez réessayer.',
  },
  'post.noPosts': {
    en: 'No posts yet',
    nl: 'Nog geen berichten',
    fr: 'Pas encore de messages',
  },
  'post.beFirst': {
    en: 'Be the first to post something!',
    nl: 'Wees de eerste om iets te posten!',
    fr: 'Soyez le premier à poster quelque chose!',
  },
  'post.report': {
    en: 'Report post',
    nl: 'Bericht melden',
    fr: 'Signaler le post',
  },
  'post.copyLink': {
    en: 'Copy link',
    nl: 'Link kopiëren',
    fr: 'Copier le lien',
  },
  'post.linkCopied': {
    en: 'Link Copied!',
    nl: 'Link Gekopieerd!',
    fr: 'Lien Copié!',
  },
  'post.linkCopiedDesc': {
    en: 'Share this post with your friends.',
    nl: 'Deel dit bericht met je vrienden.',
    fr: 'Partagez ce post avec vos amis.',
  },
  'games.coming': {
    en: 'Coming Soon!',
    nl: 'Binnenkort Beschikbaar!',
    fr: 'Bientôt Disponible!',
  },
  'games.comingSoon': {
    en: 'Coming Soon',
    nl: 'Binnenkort Beschikbaar',
    fr: 'Bientôt Disponible',
  },
  'games.comingSoonDescription': {
    en: 'This game is still under development.',
    nl: 'Dit spel is nog in ontwikkeling.',
    fr: 'Ce jeu est encore en développement.',
  },
  'games.playNow': {
    en: 'Play Now',
    nl: 'Speel Nu',
    fr: 'Jouer Maintenant',
  },
  'games.trivia': {
    en: 'Trivia Game',
    nl: 'Trivia Spel',
    fr: 'Jeu de Trivia',
  },
  'games.triviaDescription': {
    en: 'Test your knowledge with fun trivia questions.',
    nl: 'Test je kennis met leuke trivia vragen.',
    fr: 'Testez vos connaissances avec des questions de trivia amusantes.',
  },
  'games.snake': {
    en: 'Snake Game',
    nl: 'Slangen Spel',
    fr: 'Jeu de Serpent',
  },
  'games.snakeDescription': {
    en: 'A classic snake game to challenge your reflexes.',
    nl: 'Een klassiek slangen spel om je reflexen uit te dagen.',
    fr: 'Un jeu de serpent classique pour défier vos réflexes.',
  },
  'earn.dailyCoins': {
    en: 'Daily Coins',
    nl: 'Dagelijkse Munten',
    fr: 'Pièces Quotidiennes',
  },
  'earn.claimCoins': {
    en: 'Claim Coins',
    nl: 'Claim Munten',
    fr: 'Réclamer Pièces',
  },
  'earn.coinsClaimed': {
    en: 'Coins Claimed!',
    nl: 'Munten Geclaimd!',
    fr: 'Pièces Réclamées!',
  },
  'earn.comeBackTomorrow': {
    en: 'Come back tomorrow to claim more coins.',
    nl: 'Kom morgen terug om meer munten te claimen.',
    fr: 'Revenez demain pour réclamer plus de pièces.',
  },
  'earn.alreadyClaimed': {
    en: 'Already Claimed',
    nl: 'Al Geclaimed',
    fr: 'Déjà Réclamé',
  },
};

// Define the Language Context Type
export type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  availableLanguages: Array<{ code: LanguageCode; name: string }>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('nl');
  const { user } = useAuth();

  // Load the user's language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      // First check localStorage for cached preference
      const cachedLanguage = localStorage.getItem('languagePreference');
      if (cachedLanguage && (cachedLanguage === 'en' || cachedLanguage === 'nl' || cachedLanguage === 'fr')) {
        setLanguageState(cachedLanguage as LanguageCode);
      }

      if (user) {
        try {
          // Check if user_settings table exists and has language field
          const { data, error } = await supabase
            .from('user_settings')
            .select('language')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error loading language preference from user_settings:', error);
            
            // Fallback to checking profiles table
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profileError) {
              console.error('Error loading profile:', profileError);
            } else if (profileData) {
              // Check if profileData has a language field and it's one of our supported languages
              if ('language' in profileData && 
                  (profileData.language === 'en' || 
                   profileData.language === 'nl' || 
                   profileData.language === 'fr')) {
                const userLanguage = profileData.language as LanguageCode;
                setLanguageState(userLanguage);
                localStorage.setItem('languagePreference', userLanguage);
              }
            }
          } else if (data && data.language) {
            // Validate that it's one of our supported languages
            if (data.language === 'en' || data.language === 'nl' || data.language === 'fr') {
              const userLanguage = data.language as LanguageCode;
              setLanguageState(userLanguage);
              localStorage.setItem('languagePreference', userLanguage);
            }
          }
        } catch (error) {
          console.error('Failed to load language preference:', error);
        }
      }
    };

    loadLanguagePreference();
  }, [user]);

  // Function to update the language
  const setLanguage = async (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    localStorage.setItem('languagePreference', newLanguage);

    if (user) {
      try {
        // Try to update user_settings first
        const { error } = await supabase
          .from('user_settings')
          .update({ language: newLanguage })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating language in user_settings:', error);
          
          // Check if profiles table has a language column already (added in SQL migrations)
          // For now, log the error but don't attempt to update profiles
          console.error('Could not update language preference in database');
        }
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };

  // Translation function
  const t = (key: string, variables?: Record<string, string | number>): string => {
    // First check if the key exists in translations
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Then check if the language exists for that key
    if (!translations[key][language]) {
      console.warn(`Translation for key ${key} not found in language ${language}`);
      // Try to return English as fallback
      return translations[key].en || key;
    }

    // Get the translation
    let translation = translations[key][language];

    // Replace variables if any
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        translation = translation.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
      });
    }

    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

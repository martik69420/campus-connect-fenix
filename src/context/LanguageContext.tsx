
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';
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
    en: 'Campus Fenix',
    nl: 'Campus Fenix',
    fr: 'Campus Fenix',
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
  'messages.conversations': {
    en: 'Conversations',
    nl: 'Gesprekken',
    fr: 'Conversations',
  },
  'messages.searchContacts': {
    en: 'Search contacts...',
    nl: 'Zoek contacten...',
    fr: 'Rechercher des contacts...',
  },
  'messages.noConversations': {
    en: 'No conversations yet',
    nl: 'Nog geen gesprekken',
    fr: 'Pas encore de conversations',
  },
  'messages.noMessagesYet': {
    en: 'No messages yet',
    nl: 'Nog geen berichten',
    fr: 'Pas encore de messages',
  },
  'messages.startConversation': {
    en: 'Start a conversation now',
    nl: 'Begin nu een gesprek',
    fr: 'Commencez une conversation maintenant',
  },
  'messages.typeMessage': {
    en: 'Type a message...',
    nl: 'Typ een bericht...',
    fr: 'Tapez un message...',
  },
  'messages.sending': {
    en: 'Sending...',
    nl: 'Versturen...',
    fr: 'Envoi en cours...',
  },
  'messages.newMessage': {
    en: 'New Message',
    nl: 'Nieuw Bericht',
    fr: 'Nouveau Message',
  },
  'messages.view': {
    en: 'View',
    nl: 'Bekijken',
    fr: 'Voir',
  },
  'messages.viewProfile': {
    en: 'View Profile',
    nl: 'Bekijk Profiel',
    fr: 'Voir le Profil',
  },
  'messages.muteNotifications': {
    en: 'Mute Notifications',
    nl: 'Meldingen Dempen',
    fr: 'Désactiver les Notifications',
  },
  'messages.reportUser': {
    en: 'Report User',
    nl: 'Gebruiker Rapporteren',
    fr: 'Signaler l\'Utilisateur',
  },
  'messages.sendError': {
    en: 'Failed to send message',
    nl: 'Bericht versturen mislukt',
    fr: 'Échec de l\'envoi du message',
  },
  
  // Settings
  'settings.title': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
  },
  'settings.description': {
    en: 'Manage your account settings and preferences.',
    nl: 'Beheer je accountinstellingen en voorkeuren.',
    fr: 'Gérer vos paramètres de compte et préférences.',
  },
  'settings.account': {
    en: 'Account Settings',
    nl: 'Account Instellingen',
    fr: 'Paramètres du Compte',
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
  'settings.profileSettings': {
    en: 'Profile Settings',
    nl: 'Profielinstellingen',
    fr: 'Paramètres de Profil',
  },
  'settings.profileSettingsDesc': {
    en: 'Update your profile information',
    nl: 'Werk je profielinformatie bij',
    fr: 'Mettre à jour vos informations de profil',
  },
  'settings.updateProfile': {
    en: 'Update Profile',
    nl: 'Profiel Bijwerken',
    fr: 'Mettre à Jour le Profil',
  },
  'settings.accountSettings': {
    en: 'Account Settings',
    nl: 'Accountinstellingen',
    fr: 'Paramètres du Compte',
  },
  'settings.themeSettings': {
    en: 'Theme Settings',
    nl: 'Thema-instellingen',
    fr: 'Paramètres de Thème',
  },
  'settings.themeSettingsDesc': {
    en: 'Customize your app appearance',
    nl: 'Pas het uiterlijk van je app aan',
    fr: 'Personnaliser l\'apparence de votre application',
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
    en: 'Easier on the eyes in low light',
    nl: 'Makkelijker voor de ogen bij weinig licht',
    fr: 'Plus facile pour les yeux en faible luminosité',
  },
  'settings.lightModeDesc': {
    en: 'Better visibility in bright light',
    nl: 'Betere zichtbaarheid bij fel licht',
    fr: 'Meilleure visibilité en pleine lumière',
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
  'settings.themeUpdateError': {
    en: 'Failed to update theme',
    nl: 'Thema bijwerken mislukt',
    fr: 'Échec de la mise à jour du thème',
  },
  'settings.languageSettings': {
    en: 'Language Settings',
    nl: 'Taalinstellingen',
    fr: 'Paramètres de Langue',
  },
  'settings.languageSettingsDesc': {
    en: 'Choose your preferred language',
    nl: 'Kies je voorkeurstaal',
    fr: 'Choisissez votre langue préférée',
  },
  'settings.languageUpdated': {
    en: 'Language Updated',
    nl: 'Taal Bijgewerkt',
    fr: 'Langue Mise à Jour',
  },
  'settings.languageUpdatedDesc': {
    en: 'Your language preference has been saved',
    nl: 'Je taalvoorkeur is opgeslagen',
    fr: 'Votre préférence de langue a été enregistrée',
  },
  'settings.languageUpdateError': {
    en: 'Failed to update language',
    nl: 'Taal bijwerken mislukt',
    fr: 'Échec de la mise à jour de la langue',
  },
  'settings.notificationSettings': {
    en: 'Notification Settings',
    nl: 'Meldingsinstellingen',
    fr: 'Paramètres de Notification',
  },
  'settings.notificationSettingsDesc': {
    en: 'Manage your notification preferences',
    nl: 'Beheer je meldingsvoorkeuren',
    fr: 'Gérer vos préférences de notification',
  },
  'settings.messageNotifications': {
    en: 'Message Notifications',
    nl: 'Berichtmeldingen',
    fr: 'Notifications de Messages',
  },
  'settings.messageNotificationsDesc': {
    en: 'Get notified when you receive a new message',
    nl: 'Word op de hoogte gesteld wanneer je een nieuw bericht ontvangt',
    fr: 'Soyez notifié lorsque vous recevez un nouveau message',
  },
  'settings.likeNotifications': {
    en: 'Like Notifications',
    nl: 'Like-meldingen',
    fr: 'Notifications de J\'aime',
  },
  'settings.likeNotificationsDesc': {
    en: 'Get notified when someone likes your post',
    nl: 'Word op de hoogte gesteld wanneer iemand je bericht leuk vindt',
    fr: 'Soyez notifié lorsque quelqu\'un aime votre publication',
  },
  'settings.friendNotifications': {
    en: 'Friend Notifications',
    nl: 'Vriendmeldingen',
    fr: 'Notifications d\'Amis',
  },
  'settings.friendNotificationsDesc': {
    en: 'Get notified about friend requests',
    nl: 'Word op de hoogte gesteld over vriendschapsverzoeken',
    fr: 'Soyez notifié des demandes d\'amitié',
  },
  'settings.privacySettings': {
    en: 'Privacy Settings',
    nl: 'Privacy-instellingen',
    fr: 'Paramètres de Confidentialité',
  },
  'settings.privacySettingsDesc': {
    en: 'Manage your privacy preferences',
    nl: 'Beheer je privacyvoorkeuren',
    fr: 'Gérer vos préférences de confidentialité',
  },
  'settings.privateProfile': {
    en: 'Private Profile',
    nl: 'Privé Profiel',
    fr: 'Profil Privé',
  },
  'settings.privateProfileDesc': {
    en: 'Only friends can see your posts and activity',
    nl: 'Alleen vrienden kunnen je berichten en activiteit zien',
    fr: 'Seuls les amis peuvent voir vos publications et activités',
  },
  'settings.showOnlineStatus': {
    en: 'Show Online Status',
    nl: 'Online Status Tonen',
    fr: 'Afficher le Statut En Ligne',
  },
  'settings.showOnlineStatusDesc': {
    en: 'Let others see when you\'re online',
    nl: 'Laat anderen zien wanneer je online bent',
    fr: 'Permettre aux autres de voir quand vous êtes en ligne',
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
  },
  
  // Online status
  'profile.online': {
    en: 'Online',
    nl: 'Online',
    fr: 'En ligne',
  },
  'profile.offline': {
    en: 'Offline',
    nl: 'Offline',
    fr: 'Hors ligne',
  },
  'profile.userOnline': {
    en: 'User is online',
    nl: 'Gebruiker is online',
    fr: 'Utilisateur est en ligne',
  },
  'profile.userOffline': {
    en: 'User is offline',
    nl: 'Gebruiker is offline',
    fr: 'Utilisateur est hors ligne',
  },
  
  // Coins
  'coins.balance': {
    en: 'Coin Balance',
    nl: 'Muntsaldo',
    fr: 'Solde de Pièces',
  },
  'coins.earn': {
    en: 'Earn Coins',
    nl: 'Munten Verdienen',
    fr: 'Gagner des Pièces',
  },
  'coins.spend': {
    en: 'Spend Coins',
    nl: 'Munten Uitgeven',
    fr: 'Dépenser des Pièces',
  },
  
  // Leaderboard
  'leaderboard.title': {
    en: 'Leaderboard',
    nl: 'Ranglijst',
    fr: 'Classement',
  },
  'leaderboard.rank': {
    en: 'Rank',
    nl: 'Rang',
    fr: 'Rang',
  },
  'leaderboard.user': {
    en: 'User',
    nl: 'Gebruiker',
    fr: 'Utilisateur',
  },
  'leaderboard.score': {
    en: 'Score',
    nl: 'Score',
    fr: 'Score',
  },
  'leaderboard.points': {
    en: 'Points',
    nl: 'Punten',
    fr: 'Points',
  },
  'leaderboard.coins': {
    en: 'Coins',
    nl: 'Munten',
    fr: 'Pièces',
  },
  'leaderboard.topScorers': {
    en: 'Top Scorers',
    nl: 'Topscorers',
    fr: 'Meilleurs Marqueurs',
  },
  'leaderboard.yourRank': {
    en: 'Your Rank',
    nl: 'Jouw Rang',
    fr: 'Votre Rang',
  },
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
  const auth = useAuth();
  const { user, isAuthenticated } = auth;
  
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
          
          if (data && data.language) {
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
  
  const availableLanguages: Array<{ code: LanguageCode, name: string }> = [
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

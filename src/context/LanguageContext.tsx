
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'nl' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  nl: {
    // Dutch translations
    "settings": "Instellingen",
    "profile": "Profiel",
    "security": "Beveiliging",
    "notifications": "Meldingen",
    "privacy": "Privacy",
    "language": "Taal",
    "save_changes": "Wijzigingen opslaan",
    "profile_settings": "Profielinstellingen",
    "display_name": "Weergavenaam",
    "username": "Gebruikersnaam",
    "email": "E-mail",
    "bio": "Bio",
    "location": "Locatie",
    "pronouns": "Voornaamwoorden",
    "birthday": "Geboortedatum",
    "online": "Online",
    "offline": "Offline",
    "saving": "Opslaan...",
    "messages": "Berichten",
    "friends": "Vrienden",
    "search": "Zoeken",
    "games": "Spellen",
    "send_message": "Bericht versturen",
    "type_message": "Typ een bericht...",
    "no_messages_yet": "Nog geen berichten",
    "send_first_message": "Stuur een bericht om het gesprek te starten",
    "new_conversation": "Nieuw gesprek",
    "search_conversations": "Zoek gesprekken...",
    "online_status": "Online status",
    "activity_status": "Activiteitsstatus",
    "read_receipts": "Leesbevestigingen",
    "data_sharing": "Gegevensdeling",
    "password": "Wachtwoord",
    "current_password": "Huidig wachtwoord",
    "new_password": "Nieuw wachtwoord",
    "confirm_password": "Bevestig wachtwoord",
    "change_password": "Wachtwoord wijzigen",
    "two_factor_auth": "Tweefactorauthenticatie",
    "login_notifications": "Inlogmeldingen",
    "update_password": "Wachtwoord bijwerken",
    "prefer_not_to_say": "Liever niet zeggen",
    "he_him": "Hij/Hem",
    "she_her": "Zij/Haar",
    "they_them": "Hen/Hun",
    "custom": "Aangepast"
  },
  en: {
    // English translations
    "settings": "Settings",
    "profile": "Profile",
    "security": "Security",
    "notifications": "Notifications",
    "privacy": "Privacy",
    "language": "Language",
    "save_changes": "Save Changes",
    "profile_settings": "Profile Settings",
    "display_name": "Display Name",
    "username": "Username",
    "email": "Email",
    "bio": "Bio",
    "location": "Location",
    "pronouns": "Pronouns",
    "birthday": "Birthday",
    "online": "Online",
    "offline": "Offline",
    "saving": "Saving...",
    "messages": "Messages",
    "friends": "Friends",
    "search": "Search",
    "games": "Games",
    "send_message": "Send Message",
    "type_message": "Type a message...",
    "no_messages_yet": "No messages yet",
    "send_first_message": "Send a message to start the conversation",
    "new_conversation": "New Conversation",
    "search_conversations": "Search conversations...",
    "online_status": "Online Status",
    "activity_status": "Activity Status",
    "read_receipts": "Read Receipts",
    "data_sharing": "Data Sharing",
    "password": "Password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "confirm_password": "Confirm Password",
    "change_password": "Change Password",
    "two_factor_auth": "Two-Factor Authentication",
    "login_notifications": "Login Notifications",
    "update_password": "Update Password",
    "prefer_not_to_say": "Prefer not to say",
    "he_him": "He/Him",
    "she_her": "She/Her",
    "they_them": "They/Them",
    "custom": "Custom"
  },
  fr: {
    // French translations
    "settings": "Paramètres",
    "profile": "Profil",
    "security": "Sécurité",
    "notifications": "Notifications",
    "privacy": "Confidentialité",
    "language": "Langue",
    "save_changes": "Enregistrer les modifications",
    "profile_settings": "Paramètres du profil",
    "display_name": "Nom d'affichage",
    "username": "Nom d'utilisateur",
    "email": "E-mail",
    "bio": "Bio",
    "location": "Emplacement",
    "pronouns": "Pronoms",
    "birthday": "Date de naissance",
    "online": "En ligne",
    "offline": "Hors ligne",
    "saving": "Enregistrement...",
    "messages": "Messages",
    "friends": "Amis",
    "search": "Rechercher",
    "games": "Jeux",
    "send_message": "Envoyer un message",
    "type_message": "Tapez un message...",
    "no_messages_yet": "Pas encore de messages",
    "send_first_message": "Envoyez un message pour commencer la conversation",
    "new_conversation": "Nouvelle conversation",
    "search_conversations": "Rechercher des conversations...",
    "online_status": "Statut en ligne",
    "activity_status": "Statut d'activité",
    "read_receipts": "Accusés de lecture",
    "data_sharing": "Partage de données",
    "password": "Mot de passe",
    "current_password": "Mot de passe actuel",
    "new_password": "Nouveau mot de passe",
    "confirm_password": "Confirmer le mot de passe",
    "change_password": "Changer le mot de passe",
    "two_factor_auth": "Authentification à deux facteurs",
    "login_notifications": "Notifications de connexion",
    "update_password": "Mettre à jour le mot de passe",
    "prefer_not_to_say": "Préfère ne pas dire",
    "he_him": "Il/Lui",
    "she_her": "Elle/Elle",
    "they_them": "Ils/Eux",
    "custom": "Personnalisé"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'nl',
  setLanguage: () => {},
  t: (key) => key
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('nl');

  // Load language preference from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['nl', 'en', 'fr'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference to user profile if logged in
  const saveLanguagePreference = async (lang: Language) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: session.user.id,
            language: lang
          }, {
            onConflict: 'user_id'
          });
          
        if (error) {
          console.error('Error saving language preference:', error);
        }
      }
    } catch (error) {
      console.error('Error in saveLanguagePreference:', error);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    saveLanguagePreference(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

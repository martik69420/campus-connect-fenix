
import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the shape of the translation object for each language
type TranslationKey = string;

// Define the available languages
type Language = 'en' | 'nl' | 'fr';

// Define the shape of translations
type Translations = Record<TranslationKey, Record<Language, string>>;

// Define the context type
type LanguageContextType = {
  language: Language;
  t: (key: TranslationKey) => string;
  setLanguage: (language: Language) => void;
  availableLanguages: { code: Language, name: string }[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Available languages for the UI
const availableLanguages: { code: Language, name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'fr', name: 'French (Français)' },
];

// Translations data
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
    nl: 'Startpagina',
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
  'nav.friends': {
    en: 'Friends',
    nl: 'Vrienden',
    fr: 'Amis',
  },
  'nav.addFriends': {
    en: 'Add Friends',
    nl: 'Vrienden Toevoegen',
    fr: 'Ajouter des Amis',
  },
  'nav.games': {
    en: 'Games',
    nl: 'Spellen',
    fr: 'Jeux',
  },
  'nav.leaderboard': {
    en: 'Leaderboard',
    nl: 'Ranglijst',
    fr: 'Classement',
  },
  'auth.requiresLogin': {
    en: 'Requires Login',
    nl: 'Vereist Inloggen',
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
  'auth.signOut': {
    en: 'Sign Out',
    nl: 'Uitloggen',
    fr: 'Déconnexion',
  },
  'auth.viewProfile': {
    en: 'View Profile',
    nl: 'Profiel Bekijken',
    fr: 'Voir le Profil',
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
  'post.save': {
    en: 'Save',
    nl: 'Opslaan',
    fr: 'Enregistrer',
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
  'games.description': {
    en: 'Play games and earn coins!',
    nl: 'Speel spellen en verdien munten!',
    fr: 'Jouez à des jeux et gagnez des pièces !',
  },
  'games.playNow': {
    en: 'Play Now',
    nl: 'Nu Spelen',
    fr: 'Jouer Maintenant',
  },
  'games.earnCoins': {
    en: 'Earn up to 50 coins per game',
    nl: 'Verdien tot 50 munten per spel',
    fr: 'Gagnez jusqu\'à 50 pièces par jeu',
  },
  'games.trivia': {
    en: 'Trivia Quiz',
    nl: 'Trivia Quiz',
    fr: 'Quiz Trivia',
  },
  'games.triviaDesc': {
    en: 'Test your knowledge',
    nl: 'Test je kennis',
    fr: 'Testez vos connaissances',
  },
  'games.snakeDesc': {
    en: 'Classic arcade fun',
    nl: 'Klassiek arcade plezier',
    fr: 'Plaisir d\'arcade classique',
  },
  'leaderboard.title': {
    en: 'Leaderboard',
    nl: 'Ranglijst',
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
  'profile.addFriend': {
    en: 'Add Friend',
    nl: 'Vriend Toevoegen',
    fr: 'Ajouter un Ami',
  },
  'profile.message': {
    en: 'Message',
    nl: 'Bericht',
    fr: 'Message',
  },
  'profile.reportProfile': {
    en: 'Report Profile',
    nl: 'Profiel Rapporteren',
    fr: 'Signaler le Profil',
  },
  'profile.blockProfile': {
    en: 'Block Profile',
    nl: 'Profiel Blokkeren',
    fr: 'Bloquer le Profil',
  },
  'profile.privacySettings': {
    en: 'Privacy Settings',
    nl: 'Privacy-instellingen',
    fr: 'Paramètres de Confidentialité',
  },
  'profile.joined': {
    en: 'Joined',
    nl: 'Lid geworden',
    fr: 'Rejoint le',
  },
  'profile.aboutMe': {
    en: 'About Me',
    nl: 'Over Mij',
    fr: 'À Propos de Moi',
  },
  // Messages translations
  'messages.viewProfile': {
    en: 'View Profile',
    nl: 'Profiel Bekijken',
    fr: 'Voir le Profil',
  },
  'messages.muteNotifications': {
    en: 'Mute Notifications',
    nl: 'Meldingen Uitschakelen',
    fr: 'Désactiver les Notifications',
  },
  'messages.clearChat': {
    en: 'Clear Chat',
    nl: 'Chat Wissen',
    fr: 'Effacer la Discussion',
  },
  'messages.reportUser': {
    en: 'Report User',
    nl: 'Gebruiker Rapporteren',
    fr: 'Signaler l\'Utilisateur',
  },
  'messages.searchFriends': {
    en: 'Search friends...',
    nl: 'Vrienden zoeken...',
    fr: 'Rechercher des amis...',
  },
  'messages.newMessage': {
    en: 'New Message',
    nl: 'Nieuw Bericht',
    fr: 'Nouveau Message',
  },
  'messages.noConversation': {
    en: 'No conversation selected',
    nl: 'Geen gesprek geselecteerd',
    fr: 'Aucune conversation sélectionnée',
  },
  'messages.selectContact': {
    en: 'Select a contact to start messaging',
    nl: 'Selecteer een contact om te beginnen met berichten sturen',
    fr: 'Sélectionnez un contact pour commencer à envoyer des messages',
  },
  'messages.findFriends': {
    en: 'Find Friends',
    nl: 'Vrienden Zoeken',
    fr: 'Trouver des Amis',
  },
  'messages.typeMessage': {
    en: 'Type a message...',
    nl: 'Typ een bericht...',
    fr: 'Tapez un message...',
  },
  'messages.sendMessage': {
    en: 'Send message',
    nl: 'Bericht versturen',
    fr: 'Envoyer le message',
  },
  // Friends translations
  'friends.forYou': {
    en: 'Friends For You',
    nl: 'Vrienden Voor Jou',
    fr: 'Amis Pour Vous',
  },
  'friends.mutualFriends': {
    en: 'mutual friends',
    nl: 'gemeenschappelijke vrienden',
    fr: 'amis en commun',
  },
  'friends.connect': {
    en: 'Connect',
    nl: 'Verbinden',
    fr: 'Se Connecter',
  },
  'friends.noSuggestions': {
    en: 'No one to suggest',
    nl: 'Niemand om voor te stellen',
    fr: 'Personne à suggérer',
  },
  'friends.noSuggestionsDesc': {
    en: 'There is no one to suggest right now',
    nl: 'Er is op dit moment niemand om voor te stellen',
    fr: 'Il n\'y a personne à suggérer pour le moment',
  },
  'friends.findNewSuggestions': {
    en: 'Find new suggestions',
    nl: 'Nieuwe suggesties zoeken',
    fr: 'Trouver de nouvelles suggestions',
  },
  'friends.findMoreFriends': {
    en: 'Find more friends',
    nl: 'Meer vrienden zoeken',
    fr: 'Trouver plus d\'amis',
  },
  'friends.findingNewFriends': {
    en: 'Finding new friends',
    nl: 'Nieuwe vrienden zoeken',
    fr: 'Trouver de nouveaux amis',
  },
  'friends.loadingNewSuggestions': {
    en: 'Loading new friend suggestions for you',
    nl: 'Nieuwe vriendensuggesties voor je laden',
    fr: 'Chargement de nouvelles suggestions d\'amis pour vous',
  },
  'friends.requestSent': {
    en: 'Friend request sent',
    nl: 'Vriendschapsverzoek verzonden',
    fr: 'Demande d\'ami envoyée',
  },
  'friends.requestSentDesc': {
    en: 'They will be notified of your request.',
    nl: 'Ze worden op de hoogte gebracht van je verzoek.',
    fr: 'Ils seront informés de votre demande.',
  },
  'friends.requestFailed': {
    en: 'Failed to send request',
    nl: 'Verzoek verzenden mislukt',
    fr: 'Échec de l\'envoi de la demande',
  },
  // Table translations
  'table.noResults': {
    en: 'No results found',
    nl: 'Geen resultaten gevonden',
    fr: 'Aucun résultat trouvé',
  },
  'table.search': {
    en: 'Search...',
    nl: 'Zoeken...',
    fr: 'Rechercher...',
  },
  'table.showing': {
    en: 'Showing',
    nl: 'Tonen',
    fr: 'Affichage de',
  },
  'table.to': {
    en: 'to',
    nl: 'tot',
    fr: 'à',
  },
  'table.of': {
    en: 'of',
    nl: 'van',
    fr: 'sur',
  },
  'table.results': {
    en: 'results',
    nl: 'resultaten',
    fr: 'résultats',
  },
};

// Language Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('nl'); // Changed default to Dutch

  // Function to get translation
  const t = useCallback((key: TranslationKey): string => {
    if (!translations[key]) {
      console.warn(`Translation key "${key}" not found.`);
      return key;
    }
    return translations[key][language] || translations[key]['en'] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

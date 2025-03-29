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
  'common.edit': {
    en: 'Edit',
    nl: 'Bewerken',
    fr: 'Modifier',
  },
  'common.delete': {
    en: 'Delete',
    nl: 'Verwijderen',
    fr: 'Supprimer',
  },
  'common.update': {
    en: 'Update',
    nl: 'Bijwerken',
    fr: 'Mettre à jour',
  },
  'common.coins': {
    en: 'coins',
    nl: 'munten',
    fr: 'pièces',
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
  'nav.games': {
    en: 'Games',
    nl: 'Spellen',
    fr: 'Jeux',
  },
  'nav.notifications': {
    en: 'Notifications',
    nl: 'Meldingen',
    fr: 'Notifications',
  },
  'nav.friends': {
    en: 'Friends',
    nl: 'Vrienden',
    fr: 'Amis',
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
  'messages.clearChat': {
    en: 'Clear Chat',
    nl: 'Chat Wissen',
    fr: 'Effacer le Chat',
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
  'settings.coinNotifications': {
    en: 'Coin Notifications',
    nl: 'Muntmeldingen',
    fr: 'Notifications de Pièces',
  },
  'settings.coinNotificationsDesc': {
    en: 'Get notified when you earn coins',
    nl: 'Word op de hoogte gesteld wanneer je munten verdient',
    fr: 'Soyez notifié lorsque vous gagnez des pièces',
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
  'settings.friends': {
    en: 'Friends',
    nl: 'Vrienden',
    fr: 'Amis',
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
  'post.save': {
    en: 'Save',
    nl: 'Opslaan',
    fr: 'Enregistrer',
  },
  'post.saved': {
    en: 'Saved',
    nl: 'Opgeslagen',
    fr: 'Enregistré',
  },
  'post.unsave': {
    en: 'Unsave',
    nl: 'Verwijderen',
    fr: 'Retirer',
  },
  'post.noPosts': {
    en: 'No posts yet',
    nl: 'Nog geen berichten',
    fr: 'Pas encore de publications',
  },
  'post.beFirst': {
    en: 'Be the first to post something!',
    nl: 'Wees de eerste om iets te plaatsen!',
    fr: 'Soyez le premier à publier quelque chose!',
  },
  'post.loadError': {
    en: 'Please try refreshing the page',
    nl: 'Probeer de pagina te vernieuwen',
    fr: 'Veuillez essayer de rafraîchir la page',
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
  'games.tetris': {
    en: 'Tetris',
    nl: 'Tetris',
    fr: 'Tetris',
  },
  'games.tetrisDesc': {
    en: 'Classic block stacking game',
    nl: 'Klassiek blokken stapelspel',
    fr: 'Jeu classique d\'empilement de blocs',
  },
  'games.score': {
    en: 'Score',
    nl: 'Score',
    fr: 'Score',
  },
  'games.gameOver': {
    en: 'Game Over',
    nl: 'Spel Voorbij',
    fr: 'Jeu Terminé',
  },
  'games.restart': {
    en: 'Restart',
    nl: 'Opnieuw starten',
    fr: 'Redémarrer',
  },
  'games.pause': {
    en: 'Pause',
    nl: 'Pauze',
    fr: 'Pause',
  },
  'games.completed': {
    en: 'Game Completed',
    nl: 'Spel Voltooid',
    fr: 'Jeu Terminé',
  },
  'games.scoreEarned': {
    en: 'You earned {{score}} points',
    nl: 'Je hebt {{score}} punten verdiend',
    fr: 'Vous avez gagné {{score}} points',
  },
  'games.newHighScore': {
    en: 'New High Score!',
    nl: 'Nieuwe Topscore!',
    fr: 'Nouveau Record!',
  },
  'games.scoreUpdated': {
    en: 'Your score of {{score}} has been saved',
    nl: 'Je score van {{score}} is opgeslagen',
    fr: 'Votre score de {{score}} a été enregistré',
  },
  'games.snakeGame': {
    en: 'Snake',
    nl: 'Slang',
    fr: 'Serpent',
  },
  'games.triviaGame': {
    en: 'Trivia',
    nl: 'Quiz',
    fr: 'Quiz',
  },
  'games.tetrisGame': {
    en: 'Tetris',
    nl: 'Tetris',
    fr: 'Tetris',
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
  'profile.away': {
    en: 'Away',
    nl: 'Afwezig',
    fr: 'Absent',
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
  'profile.userAway': {
    en: 'User is away',
    nl: 'Gebruiker is afwezig',
    fr: 'Utilisateur est absent',
  },
  'profile.loading': {
    en: 'Loading status...',
    nl: 'Status laden...',
    fr: 'Chargement du statut...',
  },
  'profile.neverActive': {
    en: 'Never active',
    nl: 'Nooit actief geweest',
    fr: 'Jamais actif',
  },
  'profile.lastSeen': {
    en: 'Last seen',
    nl: 'Laatst gezien',
    fr: 'Dernière connexion',
  },
  'profile.editProfile': {
    en: 'Edit Profile',
    nl: 'Profiel Bewerken',
    fr: 'Modifier le Profil',
  },
  'profile.saveChanges': {
    en: 'Save Changes',
    nl: 'Wijzigingen Opslaan',
    fr: 'Enregistrer les Modifications',
  },
  'profile.bio': {
    en: 'Bio',
    nl: 'Bio',
    fr: 'Bio',
  },
  'profile.noBio': {
    en: 'No bio available',
    nl: 'Geen bio beschikbaar',
    fr: 'Aucune bio disponible',
  },
  'profile.displayName': {
    en: 'Display Name',
    nl: 'Weergavenaam',
    fr: 'Nom d\'affichage',
  },
  'profile.school': {
    en: 'School',
    nl: 'School',
    fr: 'École',
  },
  'profile.location': {
    en: 'Location',
    nl: 'Locatie',
    fr: 'Emplacement',
  },
  'profile.joined': {
    en: 'Joined',
    nl: 'Lid geworden',
    fr: 'Inscrit',
  },
  'profile.aboutMe': {
    en: 'About Me',
    nl: 'Over Mij',
    fr: 'À Propos de Moi',
  },
  'profile.readMore': {
    en: 'Read more',
    nl: 'Meer lezen',
    fr: 'Lire plus',
  },
  'profile.readLess': {
    en: 'Read less',
    nl: 'Minder lezen',
    fr: 'Lire moins',
  },
  'profile.addFriend': {
    en: 'Add Friend',
    nl: 'Vriend Toevoegen',
    fr: 'Ajouter un Ami',
  },
  'profile.removeFriend': {
    en: 'Remove Friend',
    nl: 'Vriend Verwijderen',
    fr: 'Supprimer un Ami',
  },
  'profile.message': {
    en: 'Message',
    nl: 'Bericht',
    fr: 'Message',
  },
  'profile.adding': {
    en: 'Adding...',
    nl: 'Toevoegen...',
    fr: 'Ajout en cours...',
  },
  'profile.removing': {
    en: 'Removing...',
    nl: 'Verwijderen...',
    fr: 'Suppression en cours...',
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

  // Notifications
  'notifications.all': {
    en: 'All Notifications',
    nl: 'Alle Meldingen',
    fr: 'Toutes les Notifications',
  },
  'notifications.unread': {
    en: 'Unread',
    nl: 'Ongelezen',
    fr: 'Non lues',
  },
  'notifications.markAllRead': {
    en: 'Mark All as Read',
    nl: 'Markeer Alles als Gelezen',
    fr: 'Marquer tout comme lu',
  },
  'notifications.empty': {
    en: 'No notifications yet',
    nl: 'Nog geen meldingen',
    fr: 'Pas encore de notifications',
  },
  'notifications.friendRequest': {
    en: 'Friend Request',
    nl: 'Vriendschapsverzoek',
    fr: 'Demande d\'ami',
  },
  'notifications.message': {
    en: 'New Message',
    nl: 'Nieuw Bericht',
    fr: 'Nouveau Message',
  },
  'notifications.like': {
    en: 'Post Like',
    nl: 'Bericht Like',
    fr: 'J\'aime sur Publication',
  },
  'notifications.comment': {
    en: 'Post Comment',
    nl: 'Bericht Reactie',
    fr: 'Commentaire sur Publication',
  },
  'notifications.coinEarned': {
    en: 'Coins Earned',
    nl: 'Munten Verdiend',
    fr: 'Pièces Gagnées',
  },

  // Earn
  'earn.earnCoins': {
    en: 'Earn Coins',
    nl: 'Munten Verdienen',
    fr: 'Gagner des Pièces',
  },
  'earn.earnCoinsDesc': {
    en: 'Complete tasks to earn coins for your profile',
    nl: 'Voltooi taken om munten te verdienen voor je profiel',
    fr: 'Complétez des tâches pour gagner des pièces pour votre profil',
  },
  'earn.dailyStreak': {
    en: 'Daily Streak',
    nl: 'Dagelijkse Reeks',
    fr: 'Série Quotidienne',
  },
  'earn.streakDesc': {
    en: 'Log in daily to earn bonus coins',
    nl: 'Log dagelijks in om bonusmunten te verdienen',
    fr: 'Connectez-vous quotidiennement pour gagner des pièces bonus',
  },
  'earn.days': {
    en: 'days',
    nl: 'dagen',
    fr: 'jours',
  },
  'earn.coinsPerDay': {
    en: 'coins per day',
    nl: 'munten per dag',
    fr: 'pièces par jour',
  },
  'earn.streakBonusText': {
    en: 'Streak bonus active',
    nl: 'Reeksbonus actief',
    fr: 'Bonus de série actif',
  },
  'earn.claimDaily': {
    en: 'Claim Daily Reward',
    nl: 'Claim Dagelijkse Beloning',
    fr: 'Réclamer Récompense Quotidienne',
  },
  'earn.nextReward': {
    en: 'Next reward',
    nl: 'Volgende beloning',
    fr: 'Prochaine récompense',
  },
  'earn.checkBackTomorrow': {
    en: 'Check back tomorrow',
    nl: 'Kom morgen terug',
    fr: 'Revenez demain',
  },
  'earn.ways': {
    en: 'Ways to Earn',
    nl: 'Manieren om te Verdienen',
    fr: 'Façons de Gagner',
  },
  'earn.dailyLogin': {
    en: 'Daily Login',
    nl: 'Dagelijks Inloggen',
    fr: 'Connexion Quotidienne',
  },
  'earn.dailyLoginDesc': {
    en: 'Log in every day to earn coins',
    nl: 'Log elke dag in om munten te verdienen',
    fr: 'Connectez-vous chaque jour pour gagner des pièces',
  },
  'earn.playGames': {
    en: 'Play Games',
    nl: 'Speel Spellen',
    fr: 'Jouer aux Jeux',
  },
  'earn.playGamesDesc': {
    en: 'Play games to earn bonus coins',
    nl: 'Speel spellen om bonusmunten te verdienen',
    fr: 'Jouez à des jeux pour gagner des pièces bonus',
  },
  'earn.inviteFriends': {
    en: 'Invite Friends',
    nl: 'Nodig Vrienden Uit',
    fr: 'Inviter des Amis',
  },
  'earn.inviteFriendsDesc': {
    en: 'Invite friends to earn coins',
    nl: 'Nodig vrienden uit om munten te verdienen',
    fr: 'Invitez des amis pour gagner des pièces',
  },
  'earn.reachTop10': {
    en: 'Reach Top 10',
    nl: 'Bereik Top 10',
    fr: 'Atteindre le Top 10',
  },
  'earn.reachTop10Desc': {
    en: 'Get into the leaderboard top 10',
    nl: 'Kom in de top 10 van het scorebord',
    fr: 'Entrez dans le top 10 du classement',
  },
  'earn.completionOnce': {
    en: 'Complete once per day',
    nl: 'Eenmaal per dag voltooien',
    fr: 'Complétez une fois par jour',
  },
  'earn.gameCompletion': {
    en: 'Complete 3 games',
    nl: 'Voltooi 3 spellen',
    fr: 'Terminez 3 jeux',
  },
  'earn.perFriend': {
    en: 'Per friend who joins',
    nl: 'Per vriend die zich aanmeldt',
    fr: 'Par ami qui rejoint',
  },
  'earn.oneTime': {
    en: 'One time achievement',
    nl: 'Eenmalige prestatie',
    fr: 'Réalisation unique',
  },
  'earn.completed': {
    en: 'Completed',
    nl: 'Voltooid',
    fr: 'Terminé',
  },
  'earn.goTo': {
    en: 'Go to Task',
    nl: 'Ga naar Taak',
    fr: 'Aller à la Tâche',
  },
  'earn.streakBonus': {
    en: 'Streak Bonus!',
    nl: 'Reeksbonus!',
    fr: 'Bonus de Série!',
  },
  'earn.streakBonusDesc': {
    en: '{{days}} day streak: +{{bonus}} bonus coins',
    nl: '{{days}} dagen reeks: +{{bonus}} bonusmunten',
    fr: '{{days}} jours de série: +{{bonus}} pièces bonus',
  },
  
  'earn.alreadyClaimed': {
    en:

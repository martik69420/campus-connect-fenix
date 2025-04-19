
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

const NotificationPermissionBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { requestNotificationPermission, isNotificationPermissionGranted } = useNotification();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Check if we should show the banner
  useEffect(() => {
    // Only show if notifications are supported and not already granted
    const shouldShow = 
      'Notification' in window && 
      Notification.permission !== 'granted' && 
      Notification.permission !== 'denied' && 
      !localStorage.getItem('notificationBannerDismissed');
      
    setShowBanner(shouldShow);
  }, [isNotificationPermissionGranted]);
  
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      toast({
        title: t('settings.notificationSettings'),
        description: "You'll receive push notifications for important updates",
      });
      setShowBanner(false);
      
      // Register service worker for push notifications if not already registered
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered with scope:', registration.scope);
          
          // You could also register for push notifications here
          // if your backend supports sending them
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                // Your VAPID public key would go here
                'BNbKwYmjX0Wa9yE1-ViOLskE4cxgLgo5Pvb7EqtsgvrEeVJUkFl-hX2WEP_172RAQv1PU6_ik0ANZQpJUXJYO5Y'
              )
            });
            
            // Send the subscription to your server
            console.log('Push Subscription:', JSON.stringify(subscription));
            
            // Here you would typically send this subscription to your backend
            // await sendSubscriptionToBackend(subscription);
            
          } catch (err) {
            console.error('Error subscribing to push notifications:', err);
          }
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      }
    } else {
      toast({
        title: "Notifications disabled",
        description: "You can enable them later in your browser settings",
      });
    }
  };
  
  const handleDismiss = () => {
    localStorage.setItem('notificationBannerDismissed', 'true');
    setShowBanner(false);
  };
  
  // Convert base64 to Uint8Array for applicationServerKey
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div className="relative bg-primary/10 p-4 rounded-lg mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/20 p-2 rounded-full">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{t('settings.notificationSettings')}</p>
          <p className="text-sm text-muted-foreground">
            {t('settings.notificationSettingsDesc')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={handleRequestPermission}>
          {t('messages.enable')}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;

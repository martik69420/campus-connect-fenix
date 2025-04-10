
import type { Notification as AppNotification } from '@/context/NotificationContext';

class PushNotificationService {
  private static instance: PushNotificationService;
  private isPermissionGranted = false;
  private sendAutomaticNotifications = false; 
  private lastNotificationTime: Record<string, number> = {};
  private notificationCooldown = 60000; // 1 minute cooldown between similar notifications

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Request permission to show notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.isPermissionGranted = permission === 'granted';
      return this.isPermissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notification permission is already granted
   */
  private checkPermission(): void {
    if (!('Notification' in window)) {
      return;
    }
    
    this.isPermissionGranted = Notification.permission === 'granted';
  }

  /**
   * Enable or disable automatic notifications
   */
  public setAutomaticNotifications(enable: boolean): void {
    this.sendAutomaticNotifications = enable;
  }

  /**
   * Show a native push notification
   */
  public showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isPermissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configure sound (coin sound for coin notifications)
      if (options?.data?.type === 'coin') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      }
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play sound
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      const notification = new window.Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Process and display an app notification as a push notification
   */
  public processNotification(notification: AppNotification): void {
    if (!this.isPermissionGranted || !this.sendAutomaticNotifications) {
      return;
    }
    
    // Check cooldown for this notification type
    const now = Date.now();
    const lastShown = this.lastNotificationTime[notification.type] || 0;
    if (now - lastShown < this.notificationCooldown) {
      return;
    }
    
    // Update last notification time
    this.lastNotificationTime[notification.type] = now;

    const icon = notification.sender?.avatar || '/favicon.ico';
    const title = this.getNotificationTitle(notification);
    const body = notification.message;
    
    this.showNotification(title, {
      body,
      icon,
      requireInteraction: notification.type === 'coin', // Keep coin notifications visible until user interacts
      data: {
        id: notification.id,
        type: notification.type,
        url: notification.url,
        relatedId: notification.relatedId
      }
    });
  }

  private getNotificationTitle(notification: AppNotification): string {
    const senderName = notification.sender?.name || 'Campus Connect';
    
    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'friend':
        return `${senderName} sent you a friend request`;
      case 'message':
        return `New message from ${senderName}`;
      case 'mention':
        return `${senderName} mentioned you`;
      case 'coin':
        return '🎉 You earned coins!';
      case 'system':
        return 'System Notification';
      default:
        return 'New notification';
    }
  }
}

export default PushNotificationService;

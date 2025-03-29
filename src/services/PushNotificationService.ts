
import type { Notification as AppNotification } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';

class PushNotificationService {
  private static instance: PushNotificationService;
  private isPermissionGranted = false;

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
   * Show a native push notification
   */
  public showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isPermissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
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
    if (!this.isPermissionGranted) {
      return;
    }

    const icon = notification.sender?.avatar || '/favicon.ico';
    const title = this.getNotificationTitle(notification);
    const body = notification.message;
    
    this.showNotification(title, {
      body,
      icon,
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
        return 'You earned coins!';
      case 'system':
        return 'System Notification';
      default:
        return 'New notification';
    }
  }
}

export default PushNotificationService;

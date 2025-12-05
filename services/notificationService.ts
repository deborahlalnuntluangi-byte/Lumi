export const NotificationService = {
  requestPermission: async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }
    
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  },

  sendNotification: (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' // Generic robot/ai icon
      });
    }
  }
};
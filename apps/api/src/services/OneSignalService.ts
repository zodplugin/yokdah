import * as OneSignal from '@onesignal/node-onesignal';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

const configuration = OneSignal.createConfiguration({
  authMethods: {
    rest_api_key: {
      tokenProvider: {
        getToken() {
          return ONESIGNAL_REST_API_KEY;
        },
      },
    },
  },
});

const client = new OneSignal.DefaultApi(configuration);

export const sendPushNotification = async (userIds: string[], title: string, message: string, data?: any) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal credentials not set');
    return;
  }

  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;
  (notification as any).include_external_user_ids = userIds;
  notification.contents = {
    en: message,
  };
  notification.headings = {
    en: title,
  };
  if (data) {
    notification.data = data;
  }

  try {
    const response = await client.createNotification(notification);
    return response;
  } catch (error: any) {
    console.error('Error sending OneSignal notification:', error?.body || error);
  }
};

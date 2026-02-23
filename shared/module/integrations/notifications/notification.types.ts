export enum NotificationExchange {
  NOTIFICATIONS_EXCHANGE = 'notifications.exchange',
  DIRECT_EXCHANGE = 'amq.direct',
}

export enum NotificationExchangeType {
  DIRECT = 'direct',
  FANOUT = 'fanout',
  TOPIC = 'topic',
  HEADERS = 'headers',
}

export enum NotificationQueue {
  NOTIFICATIONS_EMAIL_QUEUE = 'notifications.email',
  NOTIFICATIONS_PUSH_QUEUE = 'notifications.push',
}

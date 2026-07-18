import { prepare } from '@/lib/config/database';

export interface NotificationRow {
  id: number;
  recipient_id: number;
  title: string;
  body: string;
  channel: string;
  is_read: number;
  created_at: string;
}

export function createNotification(recipientId: number, title: string, body: string, channel = 'in_app') {
  const result = prepare(
    `INSERT INTO notifications (recipient_id, title, body, channel, is_read, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`
  ).run(recipientId, title, body, channel) as { lastInsertRowid: number };

  return prepare('SELECT * FROM notifications WHERE id = ?').get(Number(result.lastInsertRowid)) as NotificationRow;
}

export function listNotifications(recipientId: number) {
  return prepare('SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC').all(recipientId) as NotificationRow[];
}

const notificationService = { createNotification, listNotifications };

export default notificationService;

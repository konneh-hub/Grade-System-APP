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

export function getNotificationById(id: number): NotificationRow | null {
  return prepare('SELECT * FROM notifications WHERE id = ?').get(id) as NotificationRow | null;
}

export function markAsRead(id: number) {
  prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  return getNotificationById(id);
}

export function markMultipleAsRead(ids: number[]) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  prepare(`UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function getUnreadCount(recipientId: number) {
  const result = prepare('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(recipientId) as { count: number };
  return result?.count ?? 0;
}

const notificationService = { createNotification, listNotifications, getNotificationById, markAsRead, markMultipleAsRead, getUnreadCount };

export default notificationService;

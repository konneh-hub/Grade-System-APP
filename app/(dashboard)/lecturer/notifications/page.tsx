'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';

type NotificationItem = {
  id: number;
  subject: string;
  audience: string;
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
  publishedDate: string;
  message: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    subject: 'CSC 302 assignment reminder',
    audience: 'CSC 302 students',
    status: 'Sent',
    publishedDate: '2026-04-12',
    message: 'Submit your assignment by Wednesday and include proper references.',
  },
  {
    id: 2,
    subject: 'Exam venue update',
    audience: 'All 300 level students',
    status: 'Scheduled',
    publishedDate: '2026-04-30',
    message: 'CSC 302 exam venue has been relocated to Hall B at 9:00 AM.',
  },
  {
    id: 3,
    subject: 'Tutorial session cancelled',
    audience: 'STA 301 students',
    status: 'Draft',
    publishedDate: '-',
    message: 'Today’s tutorial session is cancelled due to departmental meeting.',
  },
];

export default function Page() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formState, setFormState] = useState({
    subject: '',
    audience: 'All students',
    message: '',
    publishedDate: '',
  });

  useEffect(() => {
    void fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const payload = (await res.json()) as any;
      if (!res.ok) throw new Error(payload?.error || 'Failed to load notifications');
      const rows = Array.isArray(payload.notifications) ? payload.notifications : [];
      const mapped = rows.map((r: any) => ({
        id: Number(r.id),
        subject: String(r.title ?? 'Notice'),
        audience: String(r.recipient_email ?? 'All students'),
        status: (r.is_read ? 'Sent' : 'Draft') as NotificationItem['status'],
        publishedDate: r.created_at ? String(r.created_at).split('T')[0] : '-',
        message: String(r.body ?? ''),
      }));
      setNotifications(mapped);
    } catch (err) {
      // keep local mocks on failure
    }
  }

  const unreadCount = notifications.filter((item) => item.status === 'Draft' || item.status === 'Scheduled').length;
  const sentCount = notifications.filter((item) => item.status === 'Sent').length;
  const draftCount = notifications.filter((item) => item.status === 'Draft').length;
  const scheduledCount = notifications.filter((item) => item.status === 'Scheduled').length;

  const latestNotifications = useMemo(
    () => notifications.slice(0, 3),
    [notifications]
  );

  const handleCreate = async () => {
    try {
      const payload = {
        title: formState.subject || 'New lecturer notice',
        message: formState.message || 'Draft notice content',
        deliveryType: 'dashboard',
        targetAudience: formState.audience === 'All students' ? 'all' : formState.audience,
        scheduled_for: formState.publishedDate || undefined,
      } as Record<string, unknown>;

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(result.error || 'Failed to create notification');
      setShowCreateModal(false);
      setFormState({ subject: '', audience: 'All students', message: '', publishedDate: '' });
      await fetchNotifications();
    } catch (err) {
      // fallback to local create when API fails
      const nextId = Math.max(...notifications.map((item) => item.id)) + 1;
      setNotifications([
        {
          id: nextId,
          subject: formState.subject || 'New lecturer notice',
          audience: formState.audience,
          status: 'Draft',
          publishedDate: formState.publishedDate || '-',
          message: formState.message || 'Draft notice content',
        },
        ...notifications,
      ]);
      setShowCreateModal(false);
      setFormState({ subject: '', audience: 'All students', message: '', publishedDate: '' });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Lecturer notifications</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage classroom notices</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Create announcements, schedule reminders, and monitor student-facing communication activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            New notification
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unread Notices</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{unreadCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sent Notices</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{sentCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{draftCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scheduled</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{scheduledCount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent notifications</h2>
            <p className="text-sm text-slate-600">Latest notices created for your students and programmes.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Subject</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Audience</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Publish date</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{item.subject}</td>
                  <td className="px-3 py-3 text-slate-700">{item.audience}</td>
                  <td className="px-3 py-3 text-slate-700">{item.status}</td>
                  <td className="px-3 py-3 text-slate-700">{item.publishedDate}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedNotification(item);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification details</h3>
          {selectedNotification ? (
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-slate-500">Subject</p>
                <p className="font-semibold">{selectedNotification.subject}</p>
              </div>
              <div>
                <p className="text-slate-500">Audience</p>
                <p className="font-semibold">{selectedNotification.audience}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-semibold">{selectedNotification.status}</p>
              </div>
              <div>
                <p className="text-slate-500">Published date</p>
                <p className="font-semibold">{selectedNotification.publishedDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Message</p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">{selectedNotification.message}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Select a notification to see its details.</p>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create notification</h3>
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Subject</label>
              <input
                value={formState.subject}
                onChange={(event) => setFormState({ ...formState, subject: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Audience</label>
              <select
                value={formState.audience}
                onChange={(event) => setFormState({ ...formState, audience: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option>All students</option>
                <option>CSC 302 students</option>
                <option>STA 301 students</option>
                <option>300 level students</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Publish date</label>
              <input
                type="date"
                value={formState.publishedDate}
                onChange={(event) => setFormState({ ...formState, publishedDate: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Message</label>
              <textarea
                value={formState.message}
                onChange={(event) => setFormState({ ...formState, message: event.target.value })}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Create draft
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

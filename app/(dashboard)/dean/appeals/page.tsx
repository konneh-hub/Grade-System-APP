'use client';

import { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Appeal {
  id: number;
  student_id: number;
  student_name: string;
  email: string;
  course_id: number;
  course_title: string;
  issue_type: string;
  complaint_text: string;
  original_result: number;
  requested_correction: number;
  status: string;
  dean_comment: string;
  created_at: string;
}

interface AppealDetails extends Appeal {
  student_email: string;
  reg_number: string;
  course_code: string;
  course_id: number;
}

export default function Page() {
  const [openAppeals, setOpenAppeals] = useState<Appeal[]>([]);
  const [resolvedAppeals, setResolvedAppeals] = useState<Appeal[]>([]);
  const [summaryData, setSummaryData] = useState({ open_appeals: 0, resolved_appeals: 0 });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<AppealDetails | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');

  // Load initial data
  useEffect(() => {
    const loadAppeals = async () => {
      try {
        const [summaryRes, openRes, resolvedRes] = await Promise.all([
          fetch('/api/dean/appeals/summary'),
          fetch('/api/dean/appeals/list?status=pending'),
          fetch('/api/dean/appeals/list?status=approved'),
        ]);

        if (summaryRes.ok) setSummaryData(await summaryRes.json());
        if (openRes.ok) {
          const data = await openRes.json();
          setOpenAppeals(data.appeals || []);
        }
        if (resolvedRes.ok) {
          const data = await resolvedRes.json();
          setResolvedAppeals(data.appeals || []);
        }
      } catch (err) {
        console.error('Error loading appeals:', err);
      }
    };

    loadAppeals();
  }, []);

  const openReviewModal = useCallback(async (appealId: number) => {
    try {
      const res = await fetch(`/api/dean/appeals/details?appeal_id=${appealId}`);
      if (!res.ok) throw new Error('Failed to load appeal details');

      const details: AppealDetails = await res.json();
      setSelectedAppeal(details);
      setDecisionComment('');
      setReviewModalOpen(true);
    } catch (err) {
      console.error('Error loading appeal details:', err);
      alert('Failed to load appeal details');
    }
  }, []);

  const handleDecision = useCallback(
    async (decision: 'approved' | 'rejected') => {
      if (!selectedAppeal) return;

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/dean/appeals/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appeal_id: selectedAppeal.id,
            decision,
            comment: decisionComment,
          }),
        });

        if (!res.ok) throw new Error('Failed to submit decision');

        alert(`Appeal ${decision} successfully`);
        setReviewModalOpen(false);

        // Reload appeals
        const [summaryRes, openRes, resolvedRes] = await Promise.all([
          fetch('/api/dean/appeals/summary'),
          fetch('/api/dean/appeals/list?status=pending'),
          fetch('/api/dean/appeals/list?status=approved'),
        ]);

        if (summaryRes.ok) setSummaryData(await summaryRes.json());
        if (openRes.ok) {
          const data = await openRes.json();
          setOpenAppeals(data.appeals || []);
        }
        if (resolvedRes.ok) {
          const data = await resolvedRes.json();
          setResolvedAppeals(data.appeals || []);
        }
      } catch (err) {
        console.error('Error submitting decision:', err);
        alert('Failed to submit decision');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedAppeal, decisionComment]
  );

  const appeals = activeTab === 'open' ? openAppeals : resolvedAppeals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Appeals Management</h1>
          <p className="text-slate-600">Review and manage student complaints and appeals</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Open Appeals Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Open Appeals</h3>
              <span className="text-3xl font-bold text-orange-600">{summaryData.open_appeals}</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">Pending Review</p>
            <button
              onClick={() => setActiveTab('open')}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Review Appeals
            </button>
          </div>

          {/* Resolved Appeals Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Resolved Appeals</h3>
              <span className="text-3xl font-bold text-green-600">{summaryData.resolved_appeals}</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">Approved & Rejected</p>
            <button
              onClick={() => setActiveTab('resolved')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              View History
            </button>
          </div>
        </div>

        {/* Appeals Table */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {activeTab === 'open' ? 'Open Appeals' : 'Resolved Appeals'}
            </h2>
            <span className="text-sm text-slate-600">{appeals.length} total</span>
          </div>

          {appeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No {activeTab === 'open' ? 'open' : 'resolved'} appeals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Course</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Issue</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">Original</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">Requested</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appeals.map((appeal) => (
                    <tr key={appeal.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-900 font-medium">{appeal.student_name}</td>
                      <td className="px-4 py-3 text-slate-900">{appeal.course_title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {appeal.issue_type === 'wrong_mark' ? 'Wrong Mark' : appeal.issue_type === 'missing_mark' ? 'Missing Mark' : 'Other'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-900 font-semibold">{appeal.original_result}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-amber-600">{appeal.requested_correction}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            appeal.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : appeal.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {appeal.status === 'pending' ? (
                          <button
                            onClick={() => openReviewModal(appeal.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            onClick={() => openReviewModal(appeal.id)}
                            className="text-slate-600 hover:text-slate-800 font-medium hover:underline"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Review Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        {selectedAppeal && (
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Appeal Details</h2>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Student</p>
                <p className="text-lg font-semibold text-slate-900">{selectedAppeal.student_name}</p>
                <p className="text-sm text-slate-600">{selectedAppeal.student_email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Course</p>
                <p className="text-lg font-semibold text-slate-900">{selectedAppeal.course_title}</p>
                <p className="text-sm text-slate-600">{selectedAppeal.course_code}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Issue Type</p>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedAppeal.issue_type === 'wrong_mark'
                    ? 'Wrong Mark'
                    : selectedAppeal.issue_type === 'missing_mark'
                    ? 'Missing Mark'
                    : 'Other'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</p>
                <p
                  className={`text-lg font-semibold ${
                    selectedAppeal.status === 'pending'
                      ? 'text-orange-600'
                      : selectedAppeal.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedAppeal.status.charAt(0).toUpperCase() + selectedAppeal.status.slice(1)}
                </p>
              </div>
            </div>

            {/* Complaint Text */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Complaint</p>
              <p className="text-slate-900 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {selectedAppeal.complaint_text}
              </p>
            </div>

            {/* Result Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Original Result</p>
                <p className="text-3xl font-bold text-red-600">{selectedAppeal.original_result}</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Requested Correction</p>
                <p className="text-3xl font-bold text-green-600">{selectedAppeal.requested_correction}</p>
              </div>
            </div>

            {/* Current Dean Comment (if resolved) */}
            {selectedAppeal.status !== 'pending' && selectedAppeal.dean_comment && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dean Comment</p>
                <p className="text-slate-900 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {selectedAppeal.dean_comment}
                </p>
              </div>
            )}

            {/* Comment Input (if pending) */}
            {selectedAppeal.status === 'pending' && (
              <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Dean Decision Comment
                </label>
                <textarea
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Enter your decision comment..."
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium"
              >
                Close
              </button>

              {selectedAppeal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleDecision('rejected')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Reject Appeal'}
                  </button>

                  <button
                    onClick={() => handleDecision('approved')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Approve Correction'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

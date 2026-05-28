import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useBugs from '../hooks/useBugs';
import useProjects from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import BugModal from '../components/BugModal';
import CommentThread from '../components/CommentThread';
import { Bug, Member, Severity, BugStatus } from '../types';

const severityClasses: Record<Severity, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusClasses: Record<BugStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function BugDetail() {
  const { projectId, bugId } = useParams<{ projectId: string; bugId: string }>();
  const { user } = useAuth();
  const { getBug, updateBug, assignBug } = useBugs(projectId!);
  const { getProjectMembers } = useProjects();

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !bugId) return;
    getBug(bugId)
      .then(setBug)
      .catch(() => setError('Failed to load bug.'))
      .finally(() => setLoading(false));
    getProjectMembers(projectId).then(setMembers).catch(() => {});
  }, [projectId, bugId]);

  const handleUpdate = async (payload: Parameters<typeof updateBug>[1]) => {
    const updated = await updateBug(bugId!, payload);
    setBug(updated);
    return updated;
  };

  const handleAssign = async (assignedToId: string | null) => {
    setAssignLoading(true);
    try {
      const updated = await assignBug(bugId!, assignedToId);
      setBug(updated);
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) return <p className="text-center py-12 text-gray-500 dark:text-gray-400">Loading bug...</p>;
  if (error) return <p className="text-center py-12 text-red-600 dark:text-red-400">{error}</p>;
  if (!bug) return null;

  const currentUserRole = members.find((m) => m.userId === user?.id)?.role ?? 'MEMBER';
  const isAdmin = currentUserRole === 'ADMIN';
  const assignedToSelf = bug.assignedToId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bug.title}</h1>
        <button onClick={() => setModalOpen(true)} className="btn-secondary shrink-0">
          Edit bug
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[bug.status]}`}>
          {bug.status.replace('_', ' ')}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severityClasses[bug.severity]}`}>
          {bug.severity}
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {bug.assignedTo ? bug.assignedTo.email : 'Unassigned'}
        </span>
      </div>

      <div className="mb-8">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Assign to</label>
            <select
              value={bug.assignedToId ?? ''}
              onChange={(e) => handleAssign(e.target.value || null)}
              disabled={assignLoading}
              className="input w-auto text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.email}</option>
              ))}
            </select>
          </div>
        )}

        {!isAdmin && !bug.assignedToId && (
          <button
            onClick={() => handleAssign(user!.id)}
            disabled={assignLoading}
            className="btn-secondary text-sm"
          >
            {assignLoading ? 'Claiming...' : 'Claim'}
          </button>
        )}

        {!isAdmin && assignedToSelf && (
          <button
            onClick={() => handleAssign(null)}
            disabled={assignLoading}
            className="btn-ghost text-sm text-red-500 hover:text-red-600 dark:text-red-400"
          >
            {assignLoading ? 'Unassigning...' : 'Unassign'}
          </button>
        )}
      </div>

      <div className="space-y-6 mb-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Description
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.description}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Expected behavior
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.expectedBehavior}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Actual behavior
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.actualBehavior}</p>
        </section>

        {bug.errorMessage && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Error message / stack trace
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
              {bug.errorMessage}
            </pre>
          </section>
        )}
      </div>

      {modalOpen && (
        <BugModal
          bug={bug}
          onClose={() => setModalOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      <CommentThread projectId={projectId!} bugId={bugId!} />
    </div>
  );
}

export default BugDetail;

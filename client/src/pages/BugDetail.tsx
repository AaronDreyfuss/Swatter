import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useBugs from '../hooks/useBugs';
import BugModal from '../components/BugModal';
import CommentThread from '../components/CommentThread';
import { Bug } from '../types';

function BugDetail() {
  const { projectId, bugId } = useParams<{ projectId: string; bugId: string }>();
  const { getBug, updateBug } = useBugs(projectId!);

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId || !bugId) return;
    getBug(bugId)
      .then(setBug)
      .catch(() => setError('Failed to load bug.'))
      .finally(() => setLoading(false));
  }, [projectId, bugId]);

  const handleUpdate = async (payload: Parameters<typeof updateBug>[1]) => {
    const updated = await updateBug(bugId!, payload);
    setBug(updated);
    return updated;
  };

  if (loading) return <p>Loading bug...</p>;
  if (error) return <p>{error}</p>;
  if (!bug) return null;

  return (
    <div>
      <h1>{bug.title}</h1>

      <p>
        <strong>Status:</strong> {bug.status}
      </p>
      <p>
        <strong>Severity:</strong> {bug.severity}
      </p>
      <p>
        <strong>Assignee:</strong> {bug.assignedToId ?? 'Unassigned'}
      </p>

      <h2>Description</h2>
      <p>{bug.description}</p>

      <h2>Expected behavior</h2>
      <p>{bug.expectedBehavior}</p>

      <h2>Actual behavior</h2>
      <p>{bug.actualBehavior}</p>

      {bug.errorMessage && (
        <>
          <h2>Error message / stack trace</h2>
          <pre>{bug.errorMessage}</pre>
        </>
      )}

      <button onClick={() => setModalOpen(true)}>Edit bug</button>

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

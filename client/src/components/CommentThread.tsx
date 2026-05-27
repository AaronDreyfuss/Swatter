import { useState } from 'react';
import useComments from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';

interface Props {
  projectId: string;
  bugId: string;
}

function CommentThread({ projectId, bugId }: Props) {
  const { data: comments, loading, error, createComment, updateComment, deleteComment } =
    useComments(projectId, bugId);
  const { user } = useAuth();

  const [newContent, setNewContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await createComment(newContent);
      setNewContent('');
    } catch {
      setSubmitError('Failed to post comment. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditError('');
  };

  const handleUpdate = async (commentId: string) => {
    setEditError('');
    setEditLoading(true);
    try {
      await updateComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeleteLoading(true);
    try {
      await deleteComment(commentId);
      setConfirmDeleteId(null);
    } catch {
      // swallow - comment stays in list
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <p>Loading comments...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h3>Comments</h3>

      {comments.length === 0 && <p>No comments yet.</p>}

      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>
            <p>{comment.author?.email ?? 'Unknown'}</p>

            {editingId === comment.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                {editError && <p>{editError}</p>}
                <button onClick={() => handleUpdate(comment.id)} disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={cancelEdit} disabled={editLoading}>
                  Cancel
                </button>
              </div>
            ) : (
              <p>{comment.content}</p>
            )}

            {user?.id === comment.authorId && editingId !== comment.id && (
              <div>
                <button onClick={() => startEdit(comment.id, comment.content)}>Edit</button>

                {confirmDeleteId === comment.id ? (
                  <span>
                    <span>Are you sure?</span>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDeleteId(comment.id)}>Delete</button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate}>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a comment..."
          required
        />
        {submitError && <p>{submitError}</p>}
        <button type="submit" disabled={submitLoading}>
          {submitLoading ? 'Posting...' : 'Post comment'}
        </button>
      </form>
    </div>
  );
}

export default CommentThread;

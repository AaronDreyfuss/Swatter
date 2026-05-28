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

  if (loading) return <p className="text-gray-500 dark:text-gray-400 py-4">Loading comments...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400 py-4">{error}</p>;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Comments {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {comments.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">No comments yet.</p>
      )}

      <ul className="space-y-4 mb-6">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {comment.author?.email ?? 'Unknown'}
            </p>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="input resize-none"
                />
                {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    disabled={editLoading}
                    className="btn-primary"
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} disabled={editLoading} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
            )}

            {user?.id === comment.authorId && editingId !== comment.id && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => startEdit(comment.id, comment.content)}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  Edit
                </button>

                {confirmDeleteId === comment.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteLoading}
                      className="btn-danger text-xs px-2 py-1"
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deleteLoading}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(comment.id)}
                    className="btn-ghost text-xs px-2 py-1 text-red-500 hover:text-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate} className="space-y-3">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a comment..."
          required
          rows={3}
          className="input resize-none"
        />
        {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
        <button type="submit" disabled={submitLoading} className="btn-primary">
          {submitLoading ? 'Posting...' : 'Post comment'}
        </button>
      </form>
    </div>
  );
}

export default CommentThread;

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Comment, Bug } from '../types';

function useComments(projectId: string, bugId: string) {
  const [data, setData] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Bug>(`/projects/${projectId}/bugs/${bugId}`)
      .then((res) => setData(res.data.comments ?? []))
      .catch(() => setError('Failed to load comments.'))
      .finally(() => setLoading(false));
  }, [projectId, bugId]);

  const createComment = async (content: string): Promise<Comment> => {
    const { data: comment } = await api.post<Comment>(
      `/projects/${projectId}/bugs/${bugId}/comments`,
      { content }
    );
    setData((prev) => [...prev, comment]);
    return comment;
  };

  const updateComment = async (commentId: string, content: string): Promise<Comment> => {
    const { data: updated } = await api.patch<Comment>(
      `/projects/${projectId}/bugs/${bugId}/comments/${commentId}`,
      { content }
    );
    setData((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    return updated;
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/bugs/${bugId}/comments/${commentId}`);
    setData((prev) => prev.filter((c) => c.id !== commentId));
  };

  return { data, loading, error, createComment, updateComment, deleteComment };
}

export default useComments;

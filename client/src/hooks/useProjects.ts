import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Project, Member } from '../types';

function useProjects() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Project[]>('/projects')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setLoading(false));
  }, []);

  const createProject = async (name: string): Promise<Project> => {
    const { data: project } = await api.post<Project>('/projects', { name });
    setData((prev) => [...prev, project]);
    return project;
  };

  const joinProject = async (inviteCode: string): Promise<Project> => {
    const { data: project } = await api.post<Project>('/projects/join', { inviteCode });
    setData((prev) => [...prev, project]);
    return project;
  };

  const getProject = async (id: string): Promise<Project> => {
    const { data: project } = await api.get<Project>(`/projects/${id}`);
    return project;
  };

  const getProjectMembers = async (id: string): Promise<Member[]> => {
    const { data: members } = await api.get<Member[]>(`/projects/${id}/members`);
    return members;
  };

  return { data, loading, error, createProject, joinProject, getProject, getProjectMembers };
}

export default useProjects;

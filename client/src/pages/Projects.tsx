import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';

function Projects() {
  const { data, loading, error, createProject, joinProject } = useProjects();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await createProject(projectName);
      setProjectName('');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setCreateError(message ?? 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinLoading(true);
    try {
      await joinProject(inviteCode);
      setInviteCode('');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setJoinError(message ?? 'Failed to join project.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div>
      <h1>Projects</h1>

      {loading && <p>Loading projects...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p>You have no projects yet.</p>
      )}
      {!loading && !error && data.length > 0 && (
        <ul>
          {data.map((project) => (
            <li key={project.id}>
              <button onClick={() => navigate(`/projects/${project.id}`)}>
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Create a project</h2>
      <form onSubmit={handleCreate}>
        <div>
          <label htmlFor="projectName">Project name</label>
          <input
            id="projectName"
            type="text"
            name="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        {createError && <p>{createError}</p>}
        <button type="submit" disabled={createLoading}>
          {createLoading ? 'Creating...' : 'Create project'}
        </button>
      </form>

      <h2>Join a project</h2>
      <form onSubmit={handleJoin}>
        <div>
          <label htmlFor="inviteCode">Invite code</label>
          <input
            id="inviteCode"
            type="text"
            name="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
        </div>
        {joinError && <p>{joinError}</p>}
        <button type="submit" disabled={joinLoading}>
          {joinLoading ? 'Joining...' : 'Join project'}
        </button>
      </form>
    </div>
  );
}

export default Projects;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';
import useBugs from '../hooks/useBugs';
import { useAuth } from '../hooks/useAuth';
import BugModal from '../components/BugModal';
import BugCard from '../components/BugCard';
import MemberPanel from '../components/MemberPanel';
import { Project, Bug, Member, BugStatus, Severity, Role } from '../types';

function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProject, getProjectMembers, removeMember, changeMemberRole } = useProjects();
  const { data: bugs, loading: bugsLoading, error: bugsError, createBug, updateBug } = useBugs(projectId!);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  const [members, setMembers] = useState<Member[]>([]);

  const [statusFilter, setStatusFilter] = useState<BugStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then(setProject)
      .catch(() => setProjectError('Failed to load project.'))
      .finally(() => setProjectLoading(false));
    getProjectMembers(projectId).then(setMembers).catch(() => {});
  }, [projectId]);

  const refreshMembers = () => {
    if (projectId) getProjectMembers(projectId).then(setMembers).catch(() => {});
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(projectId!, userId);
    refreshMembers();
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    await changeMemberRole(projectId!, userId, role);
    refreshMembers();
  };

  const filteredBugs = bugs.filter((bug) => {
    if (statusFilter !== 'ALL' && bug.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && bug.severity !== severityFilter) return false;
    return true;
  });

  if (projectLoading) return <p className="text-center py-12 text-gray-500 dark:text-gray-400">Loading project...</p>;
  if (projectError) return <p className="text-center py-12 text-red-600 dark:text-red-400">{projectError}</p>;
  if (!project) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
        {project.inviteCode && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Invite code:{' '}
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {project.inviteCode}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label htmlFor="statusFilter" className="form-label">Status</label>
          <select
            id="statusFilter"
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'ALL')}
            className="input w-auto"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label htmlFor="severityFilter" className="form-label">Severity</label>
          <select
            id="severityFilter"
            name="severityFilter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
            className="input w-auto"
          >
            <option value="ALL">All severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          Log a bug
        </button>
      </div>

      {bugsLoading && <p className="text-gray-500 dark:text-gray-400 py-4">Loading bugs...</p>}
      {bugsError && <p className="text-red-600 dark:text-red-400 py-4">{bugsError}</p>}
      {!bugsLoading && !bugsError && filteredBugs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 py-4">No bugs found.</p>
      )}
      {!bugsLoading && !bugsError && filteredBugs.length > 0 && (
        <ul className="space-y-2">
          {filteredBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              onNavigate={() => navigate(`/projects/${projectId}/bugs/${bug.id}`)}
              onEdit={() => { setEditingBug(bug); setModalOpen(true); }}
            />
          ))}
        </ul>
      )}

      {members.length > 0 && (
        <MemberPanel
          members={members}
          currentUserId={user!.id}
          currentUserRole={project.role}
          onRemove={handleRemoveMember}
          onRoleChange={handleRoleChange}
        />
      )}

      {modalOpen && (
        <BugModal
          bug={editingBug}
          onClose={() => { setModalOpen(false); setEditingBug(undefined); }}
          onSubmit={editingBug
            ? (payload) => updateBug(editingBug.id, payload)
            : (payload) => createBug(payload)
          }
        />
      )}
    </div>
  );
}

export default ProjectDetail;

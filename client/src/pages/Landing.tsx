import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Swatter</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-sm">
        Track bugs, manage projects, and collaborate with your team.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="btn-primary">Log in</Link>
        <Link to="/register" className="btn-secondary">Register</Link>
      </div>
    </div>
  );
}

export default Landing;

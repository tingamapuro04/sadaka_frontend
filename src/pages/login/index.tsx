import { Link } from 'react-router-dom';

export const LoginPage = () => {
  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Login</h1>
      <div className="p-6">Login route shell</div>
      <div className="mt-6 text-center">
        <p className="text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

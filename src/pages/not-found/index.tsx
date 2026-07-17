import { Link } from 'react-router-dom';

/** Generic 404 — intentionally bland (used to hide platform login from casual access). */
export const NotFoundPage = () => (
  <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
    <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">404</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
    <p className="mt-2 text-sm text-slate-600">
      The page you are looking for does not exist or is no longer available.
    </p>
    <Link
      to="/"
      className="mt-8 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
    >
      Go home
    </Link>
  </div>
);

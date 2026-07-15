import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/axios';

type ChurchHit = { id: string; name: string; username: string };

export const HomePage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChurchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<number | null>(null);
  const listboxId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await apiClient.get<{ churches?: ChurchHit[] }>('/api/churches', {
          params: { q: query }
        });
        setResults(res.data.churches || []);
        setActiveIndex(-1);
      } catch (err: unknown) {
        const apiError = err as { message?: string; response?: { data?: { message?: string } } };
        setError(
          apiError.response?.data?.message ||
            apiError.message ||
            'Search failed. Check your connection and try again.'
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query]);

  const onSelect = (username: string) => {
    navigate(`/pay/${encodeURIComponent(username)}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const hit = results[activeIndex];
      if (hit) onSelect(hit.username);
    } else if (event.key === 'Escape') {
      setActiveIndex(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Sadaka</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Give with M-Pesa</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Find your church, enter an amount, and complete payment with an M-Pesa prompt on your phone.
        </p>

        <ol className="mx-auto mt-8 grid max-w-2xl gap-3 text-left text-sm sm:grid-cols-3">
          {[
            { step: '1', title: 'Find church', body: 'Search by name or username' },
            { step: '2', title: 'Enter amount', body: 'Choose categories or event gift' },
            { step: '3', title: 'M-Pesa PIN', body: 'Confirm on your phone' }
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {item.step}
              </span>
              <p className="mt-2 font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.body}</p>
            </li>
          ))}
        </ol>

        <div className="relative mx-auto mt-10 max-w-2xl">
          <label htmlFor="church-search" className="sr-only">
            Search for a church
          </label>
          <input
            id="church-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            placeholder="Search by church name or username…"
            className="w-full rounded-full border border-slate-200 px-6 py-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            autoComplete="off"
          />
        </div>

        <div className="mx-auto mt-6 max-w-2xl text-left">
          {loading ? (
            <div className="text-center text-sm text-slate-500" role="status">
              Searching…
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {!loading && !error && results.length === 0 && query.trim() ? (
            <div className="rounded-xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-600">
              <p className="font-medium text-slate-800">No churches match “{query.trim()}”</p>
              <p className="mt-1 text-slate-500">
                Check spelling, try the church username, or ask for their payment link.
              </p>
            </div>
          ) : null}

          <ul id={listboxId} role="listbox" className="mt-4 space-y-3" aria-label="Search results">
            {results.map((c, index) => (
              <li key={c.id} role="option" id={`${listboxId}-option-${index}`} aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => onSelect(c.username)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    index === activeIndex
                      ? 'border-emerald-300 shadow-md'
                      : 'border-slate-100 hover:shadow-lg'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                    <div className="mt-1 text-xs text-slate-500">@{c.username}</div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">Give</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-center gap-3 text-sm text-slate-600 sm:flex-row sm:justify-center">
            <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
              Register your church
            </Link>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              ·
            </span>
            <Link to="/admin/login" className="font-semibold text-slate-700 hover:underline">
              Church admin login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

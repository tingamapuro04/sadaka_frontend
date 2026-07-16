import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconSearch, IconShield } from '../../components/icons';
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
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-brand-50 via-brand-50/40 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-700">Sadaka</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Give with M-Pesa
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
          Find your church, enter an amount, and complete payment with a secure prompt on your phone.
        </p>

        <ol className="mx-auto mt-10 grid max-w-2xl gap-3 text-left text-sm sm:grid-cols-3">
          {[
            { step: '1', title: 'Find church', body: 'Search by name or username' },
            { step: '2', title: 'Enter amount', body: 'Choose categories or event gift' },
            { step: '3', title: 'M-Pesa PIN', body: 'Confirm on your phone' }
          ].map((item) => (
            <li key={item.step} className="card card-pad shadow-card">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {item.step}
              </span>
              <p className="mt-2.5 font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{item.body}</p>
            </li>
          ))}
        </ol>

        <div className="relative mx-auto mt-10 max-w-2xl">
          <label htmlFor="church-search" className="sr-only">
            Search for a church
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-5 text-base text-ink shadow-card placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:text-lg"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl text-left">
          {loading ? (
            <div className="text-center text-sm text-ink-muted" role="status">
              Searching…
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {!loading && !error && results.length === 0 && query.trim() ? (
            <div className="card card-pad text-center text-sm">
              <p className="font-medium text-ink">No churches match “{query.trim()}”</p>
              <p className="mt-1 text-ink-muted">
                Check spelling, try the church username, or ask for their payment link.
              </p>
            </div>
          ) : null}

          <ul id={listboxId} role="listbox" className="mt-4 space-y-2.5" aria-label="Search results">
            {results.map((c, index) => (
              <li key={c.id} role="option" id={`${listboxId}-option-${index}`} aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => onSelect(c.username)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                    index === activeIndex
                      ? 'border-brand-300 shadow-card-hover'
                      : 'border-slate-100 hover:border-brand-200 hover:shadow-card'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink">{c.name}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">@{c.username}</div>
                  </div>
                  <span className="text-sm font-semibold text-brand-700">Give</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-2 text-sm text-ink-muted">
            <p className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide">
              <IconShield className="h-3.5 w-3.5 text-brand-600" />
              Secured via Safaricom M-Pesa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link to="/register" className="font-semibold text-brand-700 hover:underline">
                Register your church
              </Link>
              <Link to="/admin/login" className="font-semibold text-slate-700 hover:underline">
                Church admin login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

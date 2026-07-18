import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent
} from 'react';

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  /** Accessible name when label is not rendered (e.g. field array rows) */
  'aria-label'?: string;
  className?: string;
};

/**
 * In-page dropdown that avoids the native mobile <select> sheet/popup.
 */
export const DropdownSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  optional,
  disabled = false,
  error,
  id,
  'aria-label': ariaLabel,
  className = ''
}: DropdownSelectProps) => {
  const autoId = useId();
  const selectId = id ?? autoId;
  const listId = `${selectId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value);
  const enabledOptions = options.filter((option) => !option.disabled);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = enabledOptions.findIndex((option) => option.value === value);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, enabledOptions, value]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const optionEl = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    // jsdom does not implement scrollIntoView
    optionEl?.scrollIntoView?.({ block: 'nearest' });
  }, [highlight, open]);

  const pick = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
    }

    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, Math.max(enabledOptions.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = enabledOptions[highlight];
      if (option) pick(option);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setHighlight(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setHighlight(Math.max(enabledOptions.length - 1, 0));
    }
  };

  // Map highlight index (enabled-only) to visual option index for rendering
  let enabledCursor = -1;

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label id={`${selectId}-label`} className="field-label text-xs">
          {label}
          {optional ? <span className="ml-1 font-normal text-ink-muted">(optional)</span> : null}
        </label>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        id={selectId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={Boolean(error)}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={`field-control flex w-full items-center justify-between gap-2 text-left ${
          error ? 'field-control-error' : ''
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className={`min-w-0 truncate ${selected ? 'text-ink' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-overlay"
        >
          {options.map((option) => {
            if (!option.disabled) {
              enabledCursor += 1;
            }
            const enabledIndex = option.disabled ? -1 : enabledCursor;
            const isSelected = option.value === value;
            const isHighlighted = !option.disabled && enabledIndex === highlight;

            return (
              <li key={option.value || '__empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  data-index={enabledIndex}
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors ${
                    option.disabled
                      ? 'cursor-not-allowed text-slate-300'
                      : isHighlighted
                        ? 'bg-brand-50 text-brand-900'
                        : isSelected
                          ? 'bg-slate-50 font-medium text-ink'
                          : 'text-ink hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => {
                    if (!option.disabled && enabledIndex >= 0) {
                      setHighlight(enabledIndex);
                    }
                  }}
                  onClick={() => pick(option)}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? (
                    <span className="ml-2 shrink-0 text-brand-600" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <span className="text-xs font-medium text-red-500" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};

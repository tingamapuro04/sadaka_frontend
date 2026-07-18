import {
  Children,
  isValidElement,
  useMemo,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes
} from 'react';
import { DropdownSelect, type DropdownOption } from './DropdownSelect';

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'children'> & {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  value?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
};

function optionsFromChildren(children: ReactNode): DropdownOption[] {
  const options: DropdownOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    // Support both <option> and fragments of options
    if (child.type === 'option') {
      const props = child.props as {
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      };
      options.push({
        value: props.value == null ? '' : String(props.value),
        label: String(props.children ?? ''),
        disabled: Boolean(props.disabled)
      });
      return;
    }
    if (child.props && typeof child.props === 'object' && 'children' in child.props) {
      options.push(...optionsFromChildren((child.props as { children?: ReactNode }).children));
    }
  });

  return options;
}

/**
 * Drop-in select API backed by DropdownSelect so mobile never opens the OS picker sheet.
 */
export const Select = ({
  label,
  error,
  hint,
  optional,
  className = '',
  id,
  children,
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel
}: SelectProps) => {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const stringValue = value == null ? '' : String(Array.isArray(value) ? value[0] ?? '' : value);

  return (
    <div className={className}>
      <DropdownSelect
        id={id}
        label={label}
        optional={optional}
        value={stringValue}
        options={options}
        disabled={disabled}
        error={error}
        aria-label={ariaLabel}
        onChange={(next) => {
          if (!onChange) return;
          // Synthesize a change event-shaped object for existing handlers
          const event = {
            target: { value: next },
            currentTarget: { value: next }
          } as ChangeEvent<HTMLSelectElement>;
          onChange(event);
        }}
      />
      {!error && hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
};

Select.displayName = 'Select';

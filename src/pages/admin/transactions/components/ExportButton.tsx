import type { TransactionFiltersState } from '../../types';
import { transactionExportUrl } from '../../api';

export const ExportButton = ({
  filters,
  fullWidth = false
}: {
  filters: TransactionFiltersState;
  fullWidth?: boolean;
}) => {
  return (
    <a
      href={transactionExportUrl(filters)}
      download
      className={`inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:bg-brand-800 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      Export CSV
    </a>
  );
};

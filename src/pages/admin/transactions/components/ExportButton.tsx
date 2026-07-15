import type { TransactionFiltersState } from '../../types';
import { transactionExportUrl } from '../../api';

export const ExportButton = ({ filters }: { filters: TransactionFiltersState }) => {
  return (
    <a
      href={transactionExportUrl(filters)}
      download
      className="inline-flex rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Export CSV
    </a>
  );
};


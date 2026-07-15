import { useEffect, useState } from 'react';
import { Input, Modal } from '../../../components/ui';
import type { ChurchEvent, CreateEventPayload, EventStatus, UpdateEventPayload } from '../types';

type EventFormModalProps = {
  event: ChurchEvent | null;
  isSaving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: CreateEventPayload | UpdateEventPayload) => void;
};

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const EventFormModal = ({
  event,
  isSaving,
  error,
  onClose,
  onSave
}: EventFormModalProps) => {
  const isEdit = Boolean(event);
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [slug, setSlug] = useState(event?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'active');
  const [targetAmount, setTargetAmount] = useState(
    event?.target_amount != null ? String(event.target_amount) : ''
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setSlug(event?.slug ?? '');
    setSlugTouched(Boolean(event));
    setStatus(event?.status ?? 'active');
    setTargetAmount(event?.target_amount != null ? String(event.target_amount) : '');
    setLocalError(null);
  }, [event]);

  useEffect(() => {
    if (!isEdit && !slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, isEdit, slugTouched]);

  const canSubmit = title.trim().length >= 2 && (isEdit || slug.trim().length >= 3);

  return (
    <Modal
      title={isEdit ? 'Edit event' : 'Create event'}
      description={
        isEdit
          ? 'Update event details. The shareable slug cannot be changed.'
          : 'Create a fundraiser with its own payment link for congregants.'
      }
      onClose={onClose}
      onSubmit={() => {
        setLocalError(null);
        if (!canSubmit) return;

        const target = targetAmount.trim() === '' ? null : Number(targetAmount);
        if (targetAmount.trim() !== '' && (!Number.isFinite(target) || (target as number) <= 0)) {
          setLocalError('Target amount must be a positive number.');
          return;
        }

        if (isEdit) {
          onSave({
            title: title.trim(),
            description: description.trim() || null,
            status,
            target_amount: target
          });
          return;
        }

        onSave({
          title: title.trim(),
          description: description.trim() || null,
          slug: slug.trim().toLowerCase(),
          status,
          target_amount: target
        });
      }}
      submitLabel={isEdit ? 'Save changes' : 'Create event'}
      isSubmitting={isSaving}
      submitDisabled={!canSubmit}
    >
      {(error || localError) ? (
        <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error || localError}
        </p>
      ) : null}

      <div className="space-y-3">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>

        <Input
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
          disabled={isEdit}
          hint="Used in the public URL. Lowercase letters, numbers, and hyphens only."
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          minLength={3}
          maxLength={80}
        />

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="active">Active (accepting payments)</option>
            <option value="draft">Draft (hidden from public)</option>
            <option value="closed">Closed (no new payments)</option>
          </select>
        </label>

        <Input
          label="Target amount KES"
          optional
          type="number"
          min={1}
          step={1}
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="100000"
        />
      </div>
    </Modal>
  );
};

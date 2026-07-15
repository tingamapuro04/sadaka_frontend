import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmptyState, Modal, StatusBadge, ToastProvider, useToast } from '../src/components/ui';

describe('UI primitives', () => {
  it('renders EmptyState with action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No events yet"
        description="Create one to get started."
        actionLabel="Create event"
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(onAction).toHaveBeenCalled();
  });

  it('maps status badges with high-contrast labels', () => {
    render(<StatusBadge label="awaiting_payment" />);
    expect(screen.getByText(/awaiting payment/i)).toBeInTheDocument();
  });

  it('closes Modal on Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test modal" onClose={onClose} hideFooter>
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows toast messages via provider', async () => {
    const Probe = () => {
      const { success } = useToast();
      return (
        <button type="button" onClick={() => success('Saved OK')}>
          notify
        </button>
      );
    };
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /notify/i }));
    expect(await screen.findByText('Saved OK')).toBeInTheDocument();
  });
});

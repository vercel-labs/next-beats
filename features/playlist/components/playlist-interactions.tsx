'use client';

import * as Ariakit from '@ariakit/react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  createPlaylist,
  deletePlaylist,
  removeFromPlaylist,
  addToPlaylist,
} from '@/features/playlist/playlist-actions';
import { cn } from '@/lib/utils';

export function DeletePlaylistButton({ playlistId, size = 'sm' }: { playlistId: string; size?: 'sm' | 'lg' }) {
  const dialog = Ariakit.useDialogStore();
  const router = useRouter();

  async function handleConfirm(): Promise<boolean> {
    const result = await deletePlaylist(playlistId);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    toast.success('Playlist deleted');
    router.push('/playlist');
    return true;
  }

  return (
    <>
            <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          dialog.show();
        }}
        aria-label="Delete playlist"
        className={`text-gray hover:text-danger rounded-full transition-colors ${size === 'lg' ? 'p-1.5' : 'p-1.5'}`}
      >
        <Trash2 className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>
      <ConfirmDialog
        store={dialog}
        title="Delete playlist?"
        description="This playlist and all its track associations will be removed. This can't be undone."
        confirmLabel="Delete"
        confirmAction={handleConfirm}
      />
    </>
  );
}

export function RemoveFromPlaylistButton({ playlistId, trackId }: { playlistId: string; trackId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await removeFromPlaylist(playlistId, trackId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
        <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      data-pending={isPending || undefined}
      aria-label="Remove from playlist"
      className="text-gray hover:text-danger rounded-full p-1.5 transition-colors"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function AddToPlaylistButtons({
  trackId,
  items,
}: {
  trackId: string;
  items: { label: string; value: string; active: boolean }[];
}) {
  async function togglePlaylistAction(playlistId: string, currentlyActive: boolean, label: string) {
    if (currentlyActive) {
      const result = await removeFromPlaylist(playlistId, trackId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Removed from ${label}`);
      }
    } else {
      const result = await addToPlaylist(playlistId, trackId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Added to ${label}`);
      }
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map(item => (
        <PlaylistToggleItem key={item.value} item={item} toggleAction={togglePlaylistAction} />
      ))}
    </div>
  );
}

export function NewPlaylistDialog({ store, trackId }: { store: Ariakit.DialogStore; trackId: string }) {
  const [isPending, startTransition] = useTransition();

  async function createAndAddAction(formData: FormData) {
    const created = await createPlaylist(formData);
    if (!created.ok) {
      toast.error(created.error);
      return;
    }
    const added = await addToPlaylist(created.playlist.id, trackId);
    if (added.ok) {
      toast.success(`Added to ${created.playlist.name}`);
    } else {
      toast.error(added.error);
    }
    startTransition(() => store.hide());
  }

  return (
        <Ariakit.Dialog
      store={store}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      backdrop={
        <div
          onClick={e => e.stopPropagation()}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          style={{ viewTransitionName: 'modal-backdrop' }}
        />
      }
      className="border-divider dark:border-divider-dark fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-2xl outline-none dark:bg-black"
      style={{ viewTransitionName: 'modal' }}
      unmountOnHide
      hideOnInteractOutside={!isPending}
      hideOnEscape={!isPending}
    >
      <Ariakit.DialogHeading className="text-lg font-bold text-black dark:text-white">
        New playlist
      </Ariakit.DialogHeading>
      <Ariakit.DialogDescription className="text-muted mt-2 text-sm">
        This track will be added to it.
      </Ariakit.DialogDescription>
      <form action={createAndAddAction} className="mt-4 flex flex-col gap-4">
        <input
          name="name"
          placeholder="New playlist name…"
          required
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          disabled={isPending}
        />
        <div className="flex justify-end gap-3">
          <Ariakit.DialogDismiss
            className="border-divider hover:bg-card dark:border-divider-dark dark:hover:bg-card-dark inline-flex items-center justify-center rounded-full border bg-white px-5 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black dark:text-white"
            disabled={isPending}
          >
            Cancel
          </Ariakit.DialogDismiss>
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover inline-flex min-w-20 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
          >
            {isPending && <Spinner className="h-4 w-4" />}
            Create
          </button>
        </div>
      </form>
    </Ariakit.Dialog>
  );
}

function PlaylistToggleItem({
  item,
  toggleAction,
}: {
  item: { label: string; value: string; active: boolean };
  toggleAction: (value: string, active: boolean, label: string) => void | Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [optimisticActive, setOptimisticActive] = useOptimistic(item.active);

  function handleClick() {
    startTransition(async () => {
      setOptimisticActive(!optimisticActive);
      await toggleAction(item.value, optimisticActive, item.label);
    });
  }

  return (
    <Ariakit.MenuItem
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        handleClick();
      }}
      hideOnClick={false}
      className={cn(
        'hover:bg-card dark:hover:bg-card-dark data-active-item:bg-card dark:data-active-item:bg-card-dark flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors outline-none',
        optimisticActive ? 'text-accent' : 'text-black dark:text-white',
      )}
    >
      {optimisticActive ? <Check className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Ariakit.MenuItem>
  );
}

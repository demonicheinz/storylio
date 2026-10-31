import { CheckCircleIcon, TrashIcon } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ProjectsBatchActionsBar({
  selectedCount,
  selectedTitles,
  outsideViewCount,
  onSelectPage,
  pageSelected,
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  selectedTitles: string[];
  outsideViewCount: number;
  onSelectPage: () => void;
  pageSelected: boolean;
  isPending: boolean;
  onPublish: () => void;
  onMoveToDraft: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 bg-card/55 shadow-sm p-3 border border-border/70 rounded-2xl">
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">
          {selectedCount} {selectedCount === 1 ? "project" : "projects"}{" "}
          selected
        </p>
        <p className="text-muted-foreground text-xs">
          {outsideViewCount > 0
            ? `${outsideViewCount} selected outside this page. `
            : ""}
          Selection includes all chosen pages and filters.
        </p>
      </div>
      <div className="sm:flex sm:flex-wrap sm:justify-end gap-2 grid grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={onSelectPage}
        >
          {pageSelected ? "Deselect page" : "Select page"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || selectedCount === 0}
          onClick={onPublish}
        >
          <CheckCircleIcon data-icon="inline-start" />
          Publish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || selectedCount === 0}
          onClick={onMoveToDraft}
        >
          Move to draft
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || selectedCount === 0}
              />
            }
          >
            <TrashIcon data-icon="inline-start" />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected projects?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount}{" "}
                {selectedCount === 1 ? "project" : "projects"}. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
              {selectedTitles.map((title, index) => (
                <li key={`${index}-${title}`} className="wrap-anywhere">
                  {title}
                </li>
              ))}
            </ul>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending ? "Deleting..." : "Delete selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel selection
        </Button>
      </div>
    </div>
  );
}

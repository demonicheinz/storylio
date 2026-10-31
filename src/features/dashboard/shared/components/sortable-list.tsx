"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  type SortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortableItemBase = {
  id: string;
};

type SortableRenderArgs<TItem extends SortableItemBase> = {
  item: TItem;
  index: number;
  handle: ReactNode;
  isDragging: boolean;
  disabled?: boolean;
};

type DashboardSortableListProps<TItem extends SortableItemBase> = {
  items: TItem[];
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  strategy?: SortingStrategy;
  // biome-ignore lint/suspicious/noConfusingVoidType: Existing sync/async callbacks may return no value; explicit false requests optimistic rollback.
  onReorder: (items: TItem[]) => void | Promise<boolean | void>;
  getItemLabel?: (item: TItem) => string;
  handleVariant?: "rail" | "button";
  renderItem: (args: SortableRenderArgs<TItem>) => ReactNode;
};

export { rectSortingStrategy, verticalListSortingStrategy };

export function DashboardSortableList<TItem extends SortableItemBase>({
  items,
  disabled,
  className,
  itemClassName,
  strategy = verticalListSortingStrategy,
  onReorder,
  renderItem,
  getItemLabel,
  handleVariant = "rail",
}: DashboardSortableListProps<TItem>) {
  const [isMounted, setIsMounted] = useState(false);
  const [orderedItems, setOrderedItems] = useState(items);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const savedItems = useRef(items);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const itemIds = useMemo(
    () => orderedItems.map((item) => item.id),
    [orderedItems],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    savedItems.current = items;
    setOrderedItems(items);
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (disabled || inFlight.current) return;
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextItems = arrayMove(orderedItems, oldIndex, newIndex);

    setOrderedItems(nextItems);
    inFlight.current = true;
    setSaving(true);
    try {
      if ((await onReorder(nextItems)) === false)
        setOrderedItems(savedItems.current);
    } catch {
      setOrderedItems(savedItems.current);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={
        getItemLabel
          ? {
              announcements: {
                onDragStart: ({ active }) => {
                  const item = orderedItems.find(
                    (item) => item.id === active.id,
                  );
                  return item
                    ? `Picked up ${getItemLabel(item)}. Use the arrow keys to move it.`
                    : undefined;
                },
                onDragOver: ({ active, over }) => {
                  const item = orderedItems.find(
                    (item) => item.id === active.id,
                  );
                  return item && over
                    ? `${getItemLabel(item)}, position ${orderedItems.findIndex((item) => item.id === over.id) + 1} of ${orderedItems.length}.`
                    : undefined;
                },
                onDragEnd: ({ active, over }) => {
                  const item = orderedItems.find(
                    (item) => item.id === active.id,
                  );
                  return item && over
                    ? `Dropped ${getItemLabel(item)}. Saving order.`
                    : "Reordering cancelled.";
                },
                onDragCancel: () => "Reordering cancelled.",
              },
            }
          : undefined
      }
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div className={className}>
          {orderedItems.map((item, index) => (
            <DashboardSortableRow
              key={item.id}
              item={item}
              index={index}
              disabled={disabled || saving}
              label={getItemLabel?.(item)}
              handleVariant={handleVariant}
              className={itemClassName}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function DashboardSortableRow<TItem extends SortableItemBase>({
  item,
  index,
  disabled,
  className,
  renderItem,
  label,
  handleVariant,
}: {
  item: TItem;
  index: number;
  disabled?: boolean;
  className?: string;
  renderItem: (args: SortableRenderArgs<TItem>) => ReactNode;
  label?: string;
  handleVariant: "rail" | "button";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const handle = (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "text-muted-foreground touch-none cursor-grab active:cursor-grabbing",
        handleVariant === "rail"
          ? "justify-center items-center self-stretch p-0 border-border/50 border-r rounded-none w-11 h-full min-h-16"
          : "size-11",
      )}
      disabled={disabled}
      {...attributes}
      {...listeners}
      aria-label={label ? `Drag ${label} to reorder` : "Drag to reorder"}
    >
      <DotsSixVerticalIcon />
    </Button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid min-w-0 h-full",
        className,
        isDragging && "relative z-10 opacity-80",
      )}
    >
      {renderItem({
        item,
        index,
        handle,
        isDragging,
        disabled,
      })}
    </div>
  );
}

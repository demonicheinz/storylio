"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
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
import { useEffect, useMemo, useState } from "react";
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
  strategy?: SortingStrategy;
  onReorder: (items: TItem[]) => void;
  renderItem: (args: SortableRenderArgs<TItem>) => ReactNode;
};

export { rectSortingStrategy, verticalListSortingStrategy };

export function DashboardSortableList<TItem extends SortableItemBase>({
  items,
  disabled,
  className,
  strategy = verticalListSortingStrategy,
  onReorder,
  renderItem,
}: DashboardSortableListProps<TItem>) {
  const [isMounted, setIsMounted] = useState(false);
  const [orderedItems, setOrderedItems] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
    setOrderedItems(items);
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
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
    onReorder(nextItems);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div className={className}>
          {orderedItems.map((item, index) => (
            <DashboardSortableRow
              key={item.id}
              item={item}
              index={index}
              disabled={disabled}
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
  renderItem,
}: {
  item: TItem;
  index: number;
  disabled?: boolean;
  renderItem: (args: SortableRenderArgs<TItem>) => ReactNode;
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
      className="h-full min-h-16 w-11 cursor-grab items-center justify-center rounded-none border-r border-border/50 p-0 text-muted-foreground active:cursor-grabbing"
      disabled={disabled}
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <DotsSixVerticalIcon />
    </Button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10 opacity-80")}
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

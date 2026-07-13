"use client";

import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  id?: string;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toUtcValue(date: Date): string {
  return date.toISOString();
}

function parseValue(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatDisplay(value?: string): string {
  const date = parseValue(value);
  if (!date) {
    return "Pick date and time";
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  id,
}: DateTimePickerProps) {
  const selectedDate = parseValue(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    left: 0,
    top: 0,
    width: 430,
  });
  const [viewDate, setViewDate] = useState(
    selectedDate ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const days = useMemo(() => getMonthDays(viewDate), [viewDate]);
  const selectedHour = selectedDate?.getHours() ?? 9;
  const selectedMinute = selectedDate?.getMinutes() ?? 0;

  const commitDate = (nextDate: Date) => {
    const date = new Date(nextDate);
    date.setHours(selectedHour, selectedMinute, 0, 0);
    onChange(toUtcValue(date));
  };

  const commitTime = (hour: number, minute: number) => {
    const date = selectedDate ?? new Date();
    const nextDate = new Date(date);
    nextDate.setHours(hour, minute, 0, 0);
    onChange(toUtcValue(nextDate));
  };

  const updatePanelPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const panelWidth = Math.min(430, window.innerWidth - 32);
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - panelWidth),
      window.innerWidth - panelWidth - viewportPadding,
    );

    setPanelPosition({
      left,
      top: rect.bottom + 8,
      width: panelWidth,
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePanelPosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const panel = document.getElementById("storylio-date-time-picker-panel");

      if (triggerRef.current?.contains(target) || panel?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const panel = (
    <div
      id="storylio-date-time-picker-panel"
      className="z-100 fixed gap-4 grid bg-popover shadow-[0_24px_80px_rgba(0,0,0,0.48)] p-4 border border-border/70 rounded-3xl ring-1 ring-foreground/10 max-h-[min(560px,calc(100vh-2rem))] overflow-y-auto text-popover-foreground"
      style={{
        left: panelPosition.left,
        top: panelPosition.top,
        width: panelPosition.width,
      }}
    >
      <div className="gap-4 grid sm:grid-cols-[minmax(0,1fr)_104px]">
        <div className="gap-3 grid">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
                )
              }
            >
              <CaretLeftIcon />
            </Button>
            <p className="font-medium text-sm">
              {monthFormatter.format(viewDate)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
                )
              }
            >
              <CaretRightIcon />
            </Button>
          </div>

          <div className="gap-1 grid grid-cols-7 text-xs text-center">
            {dayLabels.map((day) => (
              <div key={day} className="py-1 text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isSelected =
                selectedDate?.toDateString() === day.toDateString();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={cn(
                    "hover:bg-accent py-1.5 rounded-2xl text-sm transition-colors hover:text-accent-foreground",
                    !isCurrentMonth && "text-muted-foreground/55",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => commitDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="gap-2 grid pt-3 sm:pt-0 sm:pl-3 border-border/60 border-t sm:border-t-0 sm:border-l">
          <p className="font-medium text-muted-foreground text-xs text-center">
            Time
          </p>
          <div className="gap-1 grid grid-cols-2">
            <div className="gap-1 grid max-h-60 overflow-y-auto no-scrollbar">
              {Array.from({ length: 24 }, (_, hour) => (
                <button
                  key={hour}
                  type="button"
                  className={cn(
                    "hover:bg-accent px-2 py-1.5 rounded-2xl text-sm text-center",
                    selectedHour === hour &&
                      "bg-primary text-primary-foreground",
                  )}
                  onClick={() => commitTime(hour, selectedMinute)}
                >
                  {pad(hour)}
                </button>
              ))}
            </div>
            <div className="gap-1 grid max-h-60 overflow-y-auto no-scrollbar">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => (
                <button
                  key={minute}
                  type="button"
                  className={cn(
                    "hover:bg-accent px-2 py-1.5 rounded-2xl text-sm text-center",
                    selectedMinute === minute &&
                      "bg-primary text-primary-foreground",
                  )}
                  onClick={() => commitTime(selectedHour, minute)}
                >
                  {pad(minute)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-3 border-border/60 border-t">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(undefined)}
        >
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!selectedDate) {
              onChange(toUtcValue(new Date()));
            }
            setOpen(false);
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        className="justify-between bg-input/50 px-3 rounded-3xl w-full h-9 font-normal"
        onClick={() => {
          updatePanelPosition();
          setOpen((current) => !current);
        }}
      >
        <span>{formatDisplay(value)}</span>
        <CalendarBlankIcon data-icon="inline-end" />
      </Button>

      {mounted && open ? createPortal(panel, document.body) : null}
    </div>
  );
}

"use client";

import { Popover } from "@base-ui/react/popover";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./date-time-picker.module.css";

type DateTimePickerProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "full" });
const dayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getMonthDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  start.setDate(1 - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function shiftMonth(date: Date, amount: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
}

function formatDisplay(date?: Date): string {
  if (!date) return "Pick date and time";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DateTimePickerProps) {
  const selectedDate = parseValue(value);
  const uid = useId();
  const activeDayRef = useRef<HTMLButtonElement>(null);
  const focusDayRequested = useRef(false);
  const [open, setOpen] = useState(false);
  const [timeZone, setTimeZone] = useState<string>();
  const [calendarDate, setCalendarDate] = useState(selectedDate ?? new Date());
  const days = getMonthDays(calendarDate);
  const selectedHour = selectedDate?.getHours() ?? 9;
  const selectedMinute = selectedDate?.getMinutes() ?? 0;
  const timezoneId = `${uid}-timezone`;
  const monthId = `${uid}-month`;
  const instructionsId = `${uid}-instructions`;

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (focusDayRequested.current) {
      activeDayRef.current?.focus({ preventScroll: true });
      activeDayRef.current?.scrollIntoView({ block: "nearest" });
      focusDayRequested.current = false;
    }
  });

  const commit = (day: Date, hour = selectedHour, minute = selectedMinute) => {
    const next = new Date(day);
    next.setHours(hour, minute, 0, 0);
    onChange(next.toISOString());
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = new Date(calendarDate);
    const dayOffsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -next.getDay(),
      End: 6 - next.getDay(),
    };
    if (event.key in dayOffsets) {
      next.setDate(next.getDate() + dayOffsets[event.key]);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      const amount =
        (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1);
      next.setTime(shiftMonth(next, amount).getTime());
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    focusDayRequested.current = true;
    setCalendarDate(next);
  };

  return (
    <div className={styles.field}>
      <Popover.Root
        open={open && !disabled}
        modal="trap-focus"
        onOpenChange={(nextOpen) => {
          if (nextOpen) setCalendarDate(parseValue(value) ?? new Date());
          setOpen(nextOpen);
        }}
      >
        <Popover.Trigger
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={[ariaDescribedBy, timezoneId]
            .filter(Boolean)
            .join(" ")}
          render={
            <Button
              type="button"
              variant="outline"
              className={styles.trigger}
            />
          }
        >
          <span>
            {selectedDate && !timeZone
              ? "Loading date and time…"
              : formatDisplay(selectedDate)}
          </span>
          <CalendarBlankIcon aria-hidden="true" data-icon="inline-end" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={16}
            collisionAvoidance={{ side: "flip", align: "shift" }}
            className={styles.positioner}
          >
            <Popover.Popup
              className={styles.panel}
              initialFocus={activeDayRef}
              finalFocus
            >
              <Popover.Title className={styles.title}>
                Choose date and time
              </Popover.Title>
              <Popover.Description className={styles.description}>
                Time zone: {timeZone ?? "local time"}. Shown in local time;
                saved in UTC.
              </Popover.Description>
              <div className={styles.monthNavigation}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous month"
                  onClick={() => setCalendarDate(shiftMonth(calendarDate, -1))}
                >
                  <CaretLeftIcon aria-hidden="true" />
                </Button>
                <p id={monthId} aria-live="polite" aria-atomic="true">
                  {monthFormatter.format(calendarDate)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next month"
                  onClick={() => setCalendarDate(shiftMonth(calendarDate, 1))}
                >
                  <CaretRightIcon aria-hidden="true" />
                </Button>
              </div>
              <p id={instructionsId} className="sr-only">
                Use arrow keys to move by day or week, Home and End for the
                start and end of the week, Page Up and Page Down to change
                month, or Shift with Page Up and Page Down to change year. Press
                Enter or Space to select a date.
              </p>
              <table
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA APG datepicker calendars use a table grid with roving date-button focus.
                role="grid"
                aria-labelledby={monthId}
                aria-describedby={instructionsId}
                className={styles.calendar}
              >
                <thead>
                  <tr>
                    {dayLabels.map((day) => (
                      <th key={day} scope="col" abbr={day}>
                        {day.slice(0, 2)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, week) => (
                    <tr key={days[week * 7].toISOString()}>
                      {days.slice(week * 7, week * 7 + 7).map((day) => {
                        const isSelected =
                          selectedDate?.toDateString() === day.toDateString();
                        const isActive =
                          calendarDate.toDateString() === day.toDateString();
                        return (
                          /* biome-ignore lint/a11y/useAriaPropsSupportedByRole: td inherits gridcell semantics from its calendar table grid, per WAI-ARIA APG. */
                          <td
                            key={day.toISOString()}
                            aria-selected={isSelected}
                          >
                            <button
                              ref={isActive ? activeDayRef : undefined}
                              type="button"
                              tabIndex={isActive ? 0 : -1}
                              aria-label={dayFormatter.format(day)}
                              aria-current={
                                day.toDateString() === new Date().toDateString()
                                  ? "date"
                                  : undefined
                              }
                              className={cn(
                                styles.day,
                                day.getMonth() !== calendarDate.getMonth() &&
                                  styles.outsideMonth,
                              )}
                              onKeyDown={handleDayKeyDown}
                              onClick={() => {
                                focusDayRequested.current = true;
                                setCalendarDate(day);
                                commit(day);
                              }}
                            >
                              {day.getDate()}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.time}>
                <div>
                  <label htmlFor={`${uid}-hour`}>Hour</label>
                  <select
                    id={`${uid}-hour`}
                    value={selectedHour}
                    onChange={(event) =>
                      commit(
                        selectedDate ?? calendarDate,
                        Number(event.target.value),
                        selectedMinute,
                      )
                    }
                  >
                    {Array.from({ length: 24 }, (_, hour) => hour).map(
                      (hour) => (
                        <option key={hour} value={hour}>
                          {pad(hour)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-minute`}>Minute</label>
                  <select
                    id={`${uid}-minute`}
                    value={selectedMinute}
                    onChange={(event) =>
                      commit(
                        selectedDate ?? calendarDate,
                        selectedHour,
                        Number(event.target.value),
                      )
                    }
                  >
                    {Array.from({ length: 60 }, (_, minute) => minute).map(
                      (minute) => (
                        <option key={minute} value={minute}>
                          {pad(minute)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div className={styles.footer}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(undefined)}
                >
                  Clear
                </Button>
                <Popover.Close render={<Button type="button" size="sm" />}>
                  Done
                </Popover.Close>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <p id={timezoneId} className={styles.description}>
        Time zone: {timeZone ?? "local time"}. Saved in UTC.
      </p>
    </div>
  );
}

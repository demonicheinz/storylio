"use client";

import { MinusIcon } from "@phosphor-icons/react";
import { OTPInput, type OTPInputProps } from "input-otp";
import { cn } from "@/lib/utils";
import styles from "./otp-input.module.css";

type OtpInputProps = Omit<
  OTPInputProps,
  | "children"
  | "render"
  | "type"
  | "onChange"
  | "inputMode"
  | "pattern"
  | "maxLength"
  | "autoComplete"
  | "pasteTransformer"
> & {
  onValueChange: (value: string) => void;
};

/** Imposia's grouped slots, backed by one accessible native input. */
export function OtpInput({
  onValueChange,
  className,
  ...props
}: OtpInputProps) {
  return (
    <OTPInput
      {...props}
      type="text"
      inputMode="numeric"
      pattern="^[0-9]*$"
      maxLength={6}
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      containerClassName={cn(styles.container, className)}
      onChange={(value) => onValueChange(value.replace(/\D/g, "").slice(0, 6))}
      pasteTransformer={(value) => value.replace(/[\s-]/g, "")}
      render={({ slots }) => (
        <div className={styles.slots} aria-hidden="true">
          {[0, 1].map((group) => (
            <div className={styles.group} key={group}>
              {slots.slice(group * 3, group * 3 + 3).map((slot, index) => (
                <div
                  key={index}
                  data-otp-slot
                  data-active={slot.isActive || undefined}
                  data-filled={!!slot.char || undefined}
                  data-invalid={props["aria-invalid"] || undefined}
                  className={styles.slot}
                >
                  {slot.char && (
                    <span className={styles.digit} key={slot.char}>
                      {slot.char}
                    </span>
                  )}
                  {slot.hasFakeCaret && <span className={styles.caret} />}
                </div>
              ))}
            </div>
          ))}
          <MinusIcon className={styles.separator} />
        </div>
      )}
    />
  );
}

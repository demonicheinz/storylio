import type { IconName } from "@/types/ui";
import type { HTMLAttributes } from "react";
import type { IconBaseProps } from "react-icons";

/**
 * Props untuk komponen Icon.
 */
export interface IconProps {
  /** Nama ikon dari library yang akan ditampilkan */
  name: IconName;
  /** Ukuran ikon dalam piksel */
  size?: number;
  /** Class CSS tambahan untuk ikon */
  className?: string;
  /** Class CSS tambahan untuk wrapper (jika digunakan) */
  wrapperClassName?: string;
  /** Apakah menggunakan div sebagai wrapper */
  useWrapper?: boolean;
  /** Props tambahan untuk komponen ikon dari react-icons */
  iconProps?: IconBaseProps;
  /** Props tambahan untuk elemen wrapper */
  wrapperProps?: HTMLAttributes<HTMLDivElement>;
}

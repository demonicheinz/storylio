import type { ReactNode } from "react";

/**
 * Props untuk komponen Card dalam Approach
 */
export interface CardProps {
  /**
   * Judul kartu
   */
  title: string;

  /**
   * Ikon yang ditampilkan di tengah kartu (biasanya MagicButton)
   */
  icon: ReactNode;

  /**
   * Konten yang ditampilkan saat kartu aktif/hover
   */
  children?: ReactNode;

  /**
   * Deskripsi kartu yang muncul saat aktif/hover
   */
  des: string;
}

/**
 * Props untuk komponen MagicButton
 */
export interface MagicButtonProps {
  /**
   * Teks yang ditampilkan di dalam button
   */
  order: string;
}

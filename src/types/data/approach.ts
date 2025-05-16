/**
 * Interface untuk card pada section Approach
 */
export interface ApproachCard {
  /**
   * ID unik untuk card
   */
  id: string;

  /**
   * Judul card
   */
  title: string;

  /**
   * Fase (ditampilkan dalam MagicButton)
   */
  phase: string;

  /**
   * Deskripsi card
   */
  description: string;

  /**
   * Class CSS untuk background
   */
  backgroundClassName: string;

  /**
   * Kecepatan animasi CanvasRevealEffect
   */
  animationSpeed: number;

  /**
   * Array warna untuk CanvasRevealEffect
   */
  colors?: number[][];

  /**
   * Ukuran dot untuk CanvasRevealEffect
   */
  dotSize?: number;
}

export interface CanvasRevealEffectProps {
  /**
   * Kecepatan animasi
   * 0.1 - lambat
   * 1.0 - cepat
   */
  animationSpeed?: number;

  /**
   * Nilai opasitas untuk titik-titik
   */
  opacities?: number[];

  /**
   * Warna dot matrix dalam format RGB array
   */
  colors?: number[][];

  /**
   * Class tambahan untuk container
   */
  containerClassName?: string;

  /**
   * Ukuran dot
   */
  dotSize?: number;

  /**
   * Apakah menampilkan gradient overlay
   */
  showGradient?: boolean;
}

export interface DotMatrixProps {
  /**
   * Warna dot matrix dalam format RGB array
   */
  colors?: number[][];

  /**
   * Nilai opasitas untuk titik-titik
   */
  opacities?: number[];

  /**
   * Ukuran total matriks
   */
  totalSize?: number;

  /**
   * Ukuran dot
   */
  dotSize?: number;

  /**
   * Shader custom
   */
  shader?: string;

  /**
   * Posisi perataan tengah
   */
  center?: ("x" | "y")[];
}

export interface ShaderProps {
  /**
   * Source code shader
   */
  source: string;

  /**
   * Uniform variables untuk shader
   */
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };

  /**
   * Maksimum FPS
   */
  maxFps?: number;
}

export type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

/**
 * Interface untuk Vector-like object dengan properti x, y, z
 */
export interface VectorLike {
  x: number;
  y: number;
  z?: number;
}

/**
 * Interface generik untuk array dari Vector-like objects
 */
export type VectorArray = VectorLike[];

export interface PreparedUniforms {
  [key: string]: {
    value: number | number[] | VectorLike | VectorArray;
    type?: string;
  };
}

export interface ShaderMaterialProps {
  /**
   * Source code shader
   */
  source: string;

  /**
   * Apakah element sedang di-hover
   */
  hovered?: boolean;

  /**
   * Maksimum FPS
   */
  maxFps?: number;

  /**
   * Uniform variables untuk shader
   */
  uniforms: Uniforms;
}

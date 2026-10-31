export const IMAGE_QUALITY = {
  thumbnail: 75,
  detail: 85,
} as const;

// Shared public archive cards: container gutters, grid gaps, borders and media padding.
export const PUBLIC_CARD_IMAGE_SIZES =
  "(min-width:1328px) 385px, (min-width:1200px) calc((100vw - 174px) / 3), (min-width:768px) calc((100vw - 124px) / 2), calc(100vw - 58px)";

export const PUBLIC_COVER_IMAGE_SIZES =
  "(min-width:1328px) 1280px, (min-width:768px) calc(100vw - 48px), calc(100vw - 32px)";

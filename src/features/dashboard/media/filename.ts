export function getMediaFilenameParts(filename: string, format: string) {
  const dot = filename.lastIndexOf(".");
  if (dot > 0 && dot < filename.length - 1) {
    return { base: filename.slice(0, dot), extension: filename.slice(dot) };
  }
  return {
    base: filename,
    extension: format ? `.${format.toLowerCase()}` : "",
  };
}

export function getMediaDisplayFilename(filename: string, format: string) {
  const { base, extension } = getMediaFilenameParts(filename, format);
  return `${base}${extension}`;
}

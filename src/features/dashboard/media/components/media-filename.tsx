import { cn } from "@/lib/utils";
import { getMediaDisplayFilename, getMediaFilenameParts } from "../filename";

export function MediaFilename({
  filename,
  format,
  className,
}: {
  filename: string;
  format: string;
  className?: string;
}) {
  const { base, extension } = getMediaFilenameParts(filename, format);
  return (
    <span
      data-media-filename
      className={cn("flex min-w-0 max-w-full", className)}
      title={getMediaDisplayFilename(filename, format)}
    >
      <span className="min-w-0 truncate">{base}</span>
      <span data-media-extension className="shrink-0">
        {extension}
      </span>
    </span>
  );
}

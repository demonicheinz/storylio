export type UploadResponse = {
  id: string;
  url: string;
  publicId: string;
  filename: string;
  size: number;
  format: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
};

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as UploadResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}

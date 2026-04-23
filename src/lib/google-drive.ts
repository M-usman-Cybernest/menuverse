export function getDrivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getDriveDownloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function extractDriveFileId(url: string) {
  const directMatch = url.match(/\/d\/([^/]+)/);

  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const queryMatch = url.match(/[?&]id=([^&]+)/);

  return queryMatch?.[1] ?? null;
}

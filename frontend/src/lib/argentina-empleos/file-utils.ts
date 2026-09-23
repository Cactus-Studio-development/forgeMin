/**
 * Utility functions for handling CV document viewing and downloading
 */

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const b64Data = parts[1];
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays as BlobPart[], { type: mime });
}

export function downloadDocument(fileUrl: string, fileName: string) {
  try {
    if (fileUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(fileUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'Curriculum_Vitae.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } else {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName || 'Curriculum_Vitae.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error('Error descargando archivo:', err);
    // Fallback
    window.open(fileUrl, '_blank');
  }
}

export function getDocumentBlobUrl(fileUrl: string): string {
  if (fileUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(fileUrl);
    return URL.createObjectURL(blob);
  }
  return fileUrl;
}

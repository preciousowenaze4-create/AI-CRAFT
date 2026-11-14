export interface ProcessedAttachment {
  name: string;
  mimeType: string;
  dataUrl: string | null;
  textContent: string | null;
}

export async function readAttachmentFile(file: File): Promise<ProcessedAttachment> {
  const name = file.name;
  const mimeType = file.type || 'application/octet-stream';

  if (mimeType.startsWith('image/')) {
    try {
      const dataUrl = await compressImageToDataUrl(file, 1080, 0.84);
      return {
        name,
        mimeType: 'image/jpeg',
        dataUrl,
        textContent: null,
      };
    } catch {
      const rawUrl = await readFileAsDataUrl(file);
      return {
        name,
        mimeType,
        dataUrl: rawUrl,
        textContent: null,
      };
    }
  }

  if (
    mimeType.startsWith('text/') ||
    /\.(txt|json|md|csv|html|css|js|ts|tsx|jsx)$/i.test(name)
  ) {
    try {
      const rawText = await file.text();
      return {
        name,
        mimeType: mimeType || 'text/plain',
        dataUrl: null,
        textContent: rawText.slice(0, 12000),
      };
    } catch {
      // fall through
    }
  }

  return {
    name,
    mimeType,
    dataUrl: null,
    textContent: null,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataUrl(
  file: File,
  maxDimension: number,
  quality: number
): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height, 1));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Invalid image attachment'));
    img.src = rawUrl;
  });
}

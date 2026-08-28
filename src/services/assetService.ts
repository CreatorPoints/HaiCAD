export interface AttachedAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  category: 'image' | 'document' | 'cad' | 'code';
  textContent?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAssetCategory(file: File): 'image' | 'document' | 'cad' | 'code' {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(name)) {
    return 'image';
  }
  if (
    type === 'application/pdf' ||
    /\.(pdf|doc|docx|csv|txt|md|rtf)$/i.test(name)
  ) {
    return 'document';
  }
  if (/\.(step|stp|stl|obj|gltf|glb|brep|iges|igs)$/i.test(name)) {
    return 'cad';
  }
  if (/\.(js|ts|jsx|tsx|json|py|cpp|c|h|yaml|yml)$/i.test(name)) {
    return 'code';
  }
  return 'document';
}

/**
 * Reads a browser File object into an AttachedAsset with Base64 and optional text content
 */
export async function processUploadedFile(file: File): Promise<AttachedAsset> {
  const category = getAssetCategory(file);
  const id = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // For images and PDFs, read as Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  let textContent: string | undefined;

  // If text/code/csv/json/md/cad, also extract text content for direct prompt injection
  if (
    category === 'code' ||
    category === 'document' ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.js') ||
    file.name.endsWith('.ts')
  ) {
    try {
      textContent = await new Promise<string>((resolve, reject) => {
        const textReader = new FileReader();
        textReader.onload = () => resolve(textReader.result as string);
        textReader.onerror = (e) => reject(e);
        textReader.readAsText(file);
      });
    } catch (e) {
      console.warn('Failed to read file as text:', e);
    }
  }

  return {
    id,
    name: file.name,
    type: file.type || (category === 'image' ? 'image/png' : 'text/plain'),
    size: file.size,
    dataUrl,
    category,
    textContent: textContent ? textContent.slice(0, 15000) : undefined, // safe slice
  };
}

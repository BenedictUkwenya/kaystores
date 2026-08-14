import JSZip from "jszip";
import { contentTypeForImageName } from "@/lib/storage/product-images";
import type { ImportImageFile } from "@/lib/admin/product-import";

function isZip(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.includes("zip") ||
    name.endsWith(".zip")
  );
}

async function fileToImage(file: File): Promise<ImportImageFile | null> {
  if (!contentTypeForImageName(file.name)) return null;
  const buf = new Uint8Array(await file.arrayBuffer());
  return { name: file.name, bytes: buf };
}

export async function collectImportImages(
  files: File[],
): Promise<ImportImageFile[]> {
  const images: ImportImageFile[] = [];

  for (const file of files) {
    if (isZip(file)) {
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const entries = Object.values(zip.files);
        for (const entry of entries) {
          if (entry.dir) continue;
          const name = entry.name.replace(/\\/g, "/").split("/").pop() ?? entry.name;
          if (name.startsWith(".")) continue;
          if (!contentTypeForImageName(name)) continue;
          const bytes = await entry.async("uint8array");
          images.push({ name, bytes });
        }
      } catch {
        throw new Error(`${file.name} is not a valid zip file.`);
      }
      continue;
    }

    const image = await fileToImage(file);
    if (image) images.push(image);
  }

  return images;
}

export function buildProductImageUrl({
  imageUrl,
  baseUrl,
  autoTransformation,
  directory,
}) {
  if (!imageUrl || !baseUrl || !autoTransformation || !directory) return "";

  const filename = String(imageUrl).split("/").pop();
  if (!filename) return "";

  return `${baseUrl}/${autoTransformation}/${directory}/${filename}`;
}

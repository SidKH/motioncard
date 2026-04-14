export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb >= 1 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
}

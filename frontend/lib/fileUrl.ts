// Construit l'URL du proxy de fichiers à partir d'un chemin backend ("/uploads/xxx.png").
// Les noms de fichiers uploadés peuvent contenir des espaces ou des accents : il faut
// les encoder, sinon l'URL est invalide et l'image/le PDF ne se charge pas.
export function fileUrl(url: string): string {
  const filename = url.replace(/^\/?uploads\//, "");
  return `/api/files/${encodeURIComponent(filename)}`;
}

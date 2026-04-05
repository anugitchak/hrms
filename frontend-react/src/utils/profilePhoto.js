const trimLeadingSlash = (value) => value.replace(/^\/+/, "");
const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const resolveProfilePhotoUrl = (profilePhoto, storageUrl) => {
  if (!profilePhoto) return null;

  const rawPath = String(profilePhoto).trim();
  if (!rawPath) return null;

  if (/^data:image\//i.test(rawPath)) {
    return rawPath;
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const normalizedPath = trimLeadingSlash(rawPath);
  const safeStorageUrl = trimTrailingSlash(storageUrl || "");

  if (!safeStorageUrl) {
    return normalizedPath;
  }

  const apiOrigin = safeStorageUrl.replace(/\/storage$/i, "");

  if (normalizedPath.startsWith("storage/")) {
    return `${apiOrigin}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("public/")) {
    return `${safeStorageUrl}/${normalizedPath.slice("public/".length)}`;
  }

  return `${safeStorageUrl}/${normalizedPath}`;
};

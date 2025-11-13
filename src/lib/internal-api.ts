const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim().length > 0) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl.startsWith("http")) {
      return vercelUrl;
    }
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
};

export const getInternalApiUrl = (path: string) => {
  if (!path.startsWith("/")) {
    throw new Error("Internal API path must start with a slash");
  }

  const base = resolveBaseUrl();
  return new URL(path, base).toString();
};

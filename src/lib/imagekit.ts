import ImageKit from "imagekit";

type ImageKitConfig = {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  uploadFolder?: string;
};

let instance: ImageKit | null = null;
let cachedConfig: ImageKitConfig | null = null;

const normalizeFolder = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("/") ? value : `/${value}`;
};

const buildConfig = (): ImageKitConfig | null => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const uploadFolder = normalizeFolder(process.env.IMAGEKIT_UPLOAD_FOLDER);

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    urlEndpoint,
    uploadFolder,
  } satisfies ImageKitConfig;
};

const ensureInstance = () => {
  if (instance) {
    return instance;
  }

  const config = buildConfig();

  if (!config) {
    throw new Error("ImageKit environment variables are not fully configured.");
  }

  cachedConfig = config;
  instance = new ImageKit({
    publicKey: config.publicKey,
    privateKey: config.privateKey,
    urlEndpoint: config.urlEndpoint,
  });

  return instance;
};

export const isImageKitConfigured = () => buildConfig() !== null;

export const getImageKitConfig = () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = buildConfig();

  if (!config) {
    throw new Error("ImageKit environment variables are not fully configured.");
  }

  cachedConfig = config;
  return config;
};

export const getImageKit = () => ensureInstance();

export const getUploadAuth = () => {
  const imagekit = ensureInstance();

  return imagekit.getAuthenticationParameters();
};

export const normalizeImageKitFolder = normalizeFolder;

export const deleteImageKitFile = async (fileId: string) => {
  if (!fileId) return;
  try {
    await ensureInstance().deleteFile(fileId);
  } catch (error) {
    console.error("[IMAGEKIT_DELETE_FILE]", error);
  }
};

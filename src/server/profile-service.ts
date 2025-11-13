import { prisma } from "@/lib/db";

export const profileAddressSelect = {
  id: true,
  label: true,
  fullName: true,
  phoneNumber: true,
  streetLine1: true,
  streetLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type RawProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  image: string | null;
  avatarFileId: string | null;
  defaultAddressId: string | null;
  addresses: Array<{
    id: string;
    label: string | null;
    fullName: string;
    phoneNumber: string | null;
    streetLine1: string;
    streetLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string | null;
    country: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type ProfileResponse = ReturnType<typeof formatProfile>;
export type FormattedProfileAddress = ReturnType<typeof formatProfileAddress>;

export const formatProfileAddress = (
  address: RawProfile["addresses"][number],
  defaultAddressId: string | null,
) => ({
  ...address,
  createdAt: address.createdAt.toISOString(),
  updatedAt: address.updatedAt.toISOString(),
  isDefault: address.id === defaultAddressId,
});

export const formatProfile = (profile: RawProfile) => {
  const { addresses, defaultAddressId, ...rest } = profile;

  return {
    ...rest,
    defaultAddressId,
    addresses: addresses.map((address) =>
      formatProfileAddress(address, defaultAddressId),
    ),
  } as const;
};

export const getProfileByUserId = async (userId: string) => {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      image: true,
      avatarFileId: true,
      defaultAddressId: true,
      addresses: {
        orderBy: { createdAt: "desc" },
        select: profileAddressSelect,
      },
    },
  });

  return profile ? formatProfile(profile) : null;
};

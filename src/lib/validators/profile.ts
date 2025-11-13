import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9+()\-\.\s]{6,20}$/u, {
    message: "Enter a valid phone number",
  });

export const uploadedImageSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1, "Missing file identifier"),
  name: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phoneNumber: phoneNumberSchema.nullable().optional(),
  avatar: uploadedImageSchema.nullable().optional(),
});

const addressBaseSchema = z.object({
  label: z.string().trim().max(60).optional().nullable(),
  fullName: z.string().trim().min(2, "Enter the recipient name").max(120),
  phoneNumber: phoneNumberSchema.nullable().optional(),
  streetLine1: z.string().trim().min(2, "Street address is required").max(160),
  streetLine2: z.string().trim().max(160).optional().nullable(),
  city: z.string().trim().min(2, "City is required").max(120),
  state: z.string().trim().max(120).optional().nullable(),
  postalCode: z.string().trim().max(24).optional().nullable(),
  country: z.string().trim().min(2, "Country is required").max(120),
});

export const createAddressSchema = addressBaseSchema.extend({
  setDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressBaseSchema.partial().extend({
  setDefault: z.boolean().optional(),
});

export type UploadedImageInput = z.infer<typeof uploadedImageSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Loader2,
	Plus,
	Trash2,
	Check,
	Sparkles,
	ShieldCheck,
	MapPin,
	Phone,
	ArrowUpRight,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ImageKitUpload, {
	type ImageKitUploadValue,
} from "@/components/ui/imagekit-upload";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import {
	accountUpdateSchema,
	createAddressSchema,
	type AccountUpdateInput,
	type CreateAddressInput,
} from "@/lib/validators/profile";
import type {
	FormattedProfileAddress,
	ProfileResponse,
} from "@/server/profile-service";

const accountFormSchema = accountUpdateSchema.omit({ avatar: true });
type AccountFormValues = z.infer<typeof accountFormSchema>;
type AddressFormValues = z.infer<typeof createAddressSchema>;

type Feedback = {
	status: "success" | "error";
	message: string;
};

type AddressEditorState =
	| { mode: "create" }
	| { mode: "edit"; address: FormattedProfileAddress };

const parseJson = async <T,>(response: Response): Promise<T> => {
	const text = await response.text();
	const data = text ? (JSON.parse(text) as unknown) : null;

	if (!response.ok) {
		const message =
			typeof data === "object" && data && "message" in data
				? (data as { message?: string }).message
				: undefined;
		throw new Error(message ?? "Request failed");
	}

	return data as T;
};

const toNullable = (value: string | null | undefined) => {
	if (typeof value !== "string") {
		return value ?? null;
	}
	const trimmed = value.trim();
	return trimmed.length === 0 ? null : trimmed;
};

const mapAvatarToUploads = (profile: ProfileResponse | undefined) => {
	if (!profile || !profile.avatarFileId || !profile.image) {
		return [] as ImageKitUploadValue[];
	}

	return [
		{
			fileId: profile.avatarFileId,
			url: profile.image,
			name: "Profile avatar",
		},
	];
};

const fetchProfile = async () => {
	const response = await fetch("/api/profile", {
		method: "GET",
		cache: "no-store",
	});

	return parseJson<ProfileResponse>(response);
};

const ProfilePage = () => {
	const queryClient = useQueryClient();
	const [accountFeedback, setAccountFeedback] = useState<Feedback | null>(null);
	const [addressFeedback, setAddressFeedback] = useState<Feedback | null>(null);
	const [avatarUploads, setAvatarUploads] = useState<ImageKitUploadValue[]>([]);
	const [addressEditor, setAddressEditor] = useState<AddressEditorState | null>(
		null,
	);
	const [addressAction, setAddressAction] = useState<
		| { type: "delete" | "default"; id: string }
		| null
	>(null);

	const profileQuery = useQuery({
		queryKey: ["profile"],
		queryFn: fetchProfile,
	});

	const { refetch: refetchSession } = useSession();

	const profile = profileQuery.data;

	const accountForm = useForm<AccountFormValues>({
		resolver: zodResolver(accountFormSchema),
		defaultValues: {
			name: "",
			phoneNumber: null,
		},
	});

	useEffect(() => {
		if (!profile) {
			return;
		}

		accountForm.reset({
			name: profile.name,
			phoneNumber: profile.phoneNumber ?? null,
		});
		setAvatarUploads(mapAvatarToUploads(profile));
	}, [profile, accountForm]);

	const updateProfileMutation = useMutation({
		mutationFn: async (
			payload: Pick<AccountUpdateInput, "name" | "phoneNumber" | "avatar">,
		) => {
			const response = await fetch("/api/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			return parseJson<ProfileResponse>(response);
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["profile"], data);
			setAvatarUploads(mapAvatarToUploads(data));
			refetchSession();
			setAccountFeedback({
				status: "success",
				message: "Profile updated successfully.",
			});
		},
		onError: (error: unknown) => {
			setAccountFeedback({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to update profile.",
			});
		},
	});

	const createAddressMutation = useMutation({
		mutationFn: async (payload: CreateAddressInput) => {
			const response = await fetch("/api/profile/addresses", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			return parseJson<FormattedProfileAddress>(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (error: unknown) => {
			setAddressFeedback({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to save address.",
			});
		},
	});

	const updateAddressMutation = useMutation({
		mutationFn: async (
			variables: { addressId: string; body: Record<string, unknown> },
		) => {
			const response = await fetch(
				`/api/profile/addresses/${variables.addressId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(variables.body),
				},
			);

			return parseJson<FormattedProfileAddress>(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (error: unknown) => {
			setAddressFeedback({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to update address.",
			});
		},
	});

	const deleteAddressMutation = useMutation({
		mutationFn: async (addressId: string) => {
			const response = await fetch(
				`/api/profile/addresses/${addressId}`,
				{ method: "DELETE" },
			);

			return parseJson<{ deleted: boolean; defaultAddressId: string | null }>(
				response,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (error: unknown) => {
			setAddressFeedback({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to remove address.",
			});
		},
	});

	const avatarChanged = useMemo(() => {
		if (!profile) {
			return avatarUploads.length > 0;
		}

		const currentAvatarId = profile.avatarFileId ?? null;
		const nextAvatar = avatarUploads[0] ?? null;

		if (!currentAvatarId && !nextAvatar) {
			return false;
		}

		if (!currentAvatarId && nextAvatar) {
			return true;
		}

		if (currentAvatarId && !nextAvatar) {
			return true;
		}

		return currentAvatarId !== nextAvatar?.fileId;
	}, [avatarUploads, profile]);

	const onAccountSubmit = accountForm.handleSubmit(async (values) => {
		if (!profile) {
			return;
		}

		setAccountFeedback(null);

		const trimmedName = values.name.trim();
		const phoneValue = toNullable(values.phoneNumber ?? null);
		const nextAvatar = avatarUploads[0] ?? null;

		const payload: Pick<
			AccountUpdateInput,
			"name" | "phoneNumber" | "avatar"
		> = {
			name: trimmedName,
			phoneNumber: phoneValue,
		};

		if (avatarChanged) {
			payload.avatar = nextAvatar
				? {
					url: nextAvatar.url,
					fileId: nextAvatar.fileId,
					name: nextAvatar.name,
				}
				: null;
		}

		await updateProfileMutation.mutateAsync(payload);
	});

	const handleAddressSubmit = async (payload: CreateAddressInput) => {
		setAddressFeedback(null);

		if (addressEditor?.mode === "create") {
			await createAddressMutation.mutateAsync(payload);
			setAddressFeedback({
				status: "success",
				message: "Address added successfully.",
			});
			setAddressEditor(null);
			return;
		}

		if (addressEditor?.mode === "edit") {
			await updateAddressMutation.mutateAsync({
				addressId: addressEditor.address.id,
				body: payload,
			});
			setAddressFeedback({
				status: "success",
				message: "Address updated successfully.",
			});
			setAddressEditor(null);
		}
	};

	const handleDeleteAddress = async (addressId: string) => {
		setAddressFeedback(null);
		setAddressAction({ type: "delete", id: addressId });
		try {
			await deleteAddressMutation.mutateAsync(addressId);
			setAddressFeedback({
				status: "success",
				message: "Address removed successfully.",
			});
			if (addressEditor?.mode === "edit" && addressEditor.address.id === addressId) {
				setAddressEditor(null);
			}
		} finally {
			setAddressAction(null);
		}
	};

	const handleSetDefault = async (addressId: string) => {
		setAddressFeedback(null);
		setAddressAction({ type: "default", id: addressId });
		try {
			await updateAddressMutation.mutateAsync({
				addressId,
				body: { setDefault: true },
			});
			setAddressFeedback({
				status: "success",
				message: "Default address updated.",
			});
		} finally {
			setAddressAction(null);
		}
	};

	const hasAddresses = (profile?.addresses?.length ?? 0) > 0;
	const addressCount = profile?.addresses?.length ?? 0;
	const hasPhoneNumber = Boolean(profile?.phoneNumber && profile.phoneNumber.trim().length > 0);

	const completionScore = useMemo(() => {
		const segments = [
			Boolean(profile?.name && profile?.name.trim().length > 0),
			Boolean(profile?.phoneNumber && profile?.phoneNumber.trim().length > 0),
			avatarUploads.length > 0 || Boolean(profile?.avatarFileId),
			hasAddresses,
		];
		const filled = segments.filter(Boolean).length;
		return Math.round((filled / segments.length) * 100);
	}, [avatarUploads, hasAddresses, profile?.avatarFileId, profile?.name, profile?.phoneNumber]);

	const completionRing = useMemo(
		() =>
			`conic-gradient(#0f172a ${completionScore}%, rgba(15,23,42,0.12) ${completionScore}% 100%)`,
		[completionScore],
	);

	if (profileQuery.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white">
				<Loader2 className="h-6 w-6 animate-spin text-slate-500" />
			</div>
		);
	}

	if (profileQuery.isError || !profile) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white px-6">
				<Card className="max-w-md border border-rose-200 bg-rose-50/60">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-rose-700">
							Unable to load profile
						</CardTitle>
						<CardDescription className="text-rose-600">
							Please refresh the page or try again in a moment.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col bg-white">
			<section className="mx-auto w-full max-w-6xl px-6 py-16">
				<div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.4em] text-slate-400">
							Your profile
						</p>
						<h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
							Crafted for {profile.name.split(" ")[0] ?? "you"}
						</h1>
						<p className="mt-2 max-w-2xl text-sm text-slate-600">
							Update your account details, manage saved addresses, and keep your default delivery spot ready for the next drop.
						</p>
					</div>
					<Button asChild variant="outline" className="rounded-full">
						<Link href="/orders">View order history</Link>
					</Button>
				</div>

				<div className="grid gap-8 lg:grid-cols-3">
					<Card className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md lg:col-span-2">
						<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-100" />
						<div className="pointer-events-none absolute -top-28 -right-12 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
						<CardHeader className="relative z-10">
							<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
								<div>
									<CardTitle className="text-xl font-semibold text-slate-900">
										Account command center
									</CardTitle>
									<CardDescription className="max-w-xl text-sm text-slate-500">
										Curate your identity, polish your contact preferences, and keep deliveries frictionless.
									</CardDescription>
								</div>
								<div className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
									<div className="flex flex-col gap-1">
										<span className="text-xs uppercase tracking-[0.35em] text-slate-400">Profile completeness</span>
										<div className="flex items-baseline gap-2">
											<span className="text-2xl font-semibold text-slate-900">{completionScore}%</span>
											<span className="text-xs text-slate-500">Complete</span>
										</div>
									</div>
									<div className="relative flex h-12 w-12 items-center justify-center">
										<span
											className="absolute inset-0 rounded-full"
											style={{ background: completionRing }}
										/>
										<span className="absolute inset-1 rounded-full bg-white shadow-inner" />
										<span className="relative text-xs font-semibold text-slate-700">{completionScore}</span>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="relative z-10">
							<div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
								<div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
									<div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-slate-50/90 px-5 py-4">
										<div>
											<p className="text-xs uppercase tracking-[0.35em] text-slate-400">Essentials</p>
											<h3 className="mt-1 text-base font-semibold text-slate-900">Keep your contact signals polished</h3>
											<p className="text-xs text-slate-500">Courier-ready details ensure every drop lands right where you are.</p>
										</div>
										<span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
											<Sparkles className="h-5 w-5" />
										</span>
									</div>
									<Form {...accountForm}>
										<form onSubmit={onAccountSubmit} className="grid gap-6 md:grid-cols-2">
											<div className="md:col-span-2">
												<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
													Avatar
												</FormLabel>
												<ImageKitUpload
													value={avatarUploads}
													onChange={(value) => setAvatarUploads(value.slice(0, 1))}
													folder="avatars"
													multiple={false}
													maxFiles={1}
													className="mt-3 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/80 p-4"
													emptyHint="PNG or JPG up to 2 MB"
													priorityFirst
												/>
											</div>
											<FormField
												control={accountForm.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
															Full name
														</FormLabel>
														<FormControl>
															<Input {...field} placeholder="Your name" className="bg-white/90" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={accountForm.control}
												name="phoneNumber"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
															Phone number
														</FormLabel>
														<FormControl>
															<Input
																value={field.value ?? ""}
																onChange={(event: ChangeEvent<HTMLInputElement>) => {
																	const nextValue = event.target.value;
																	field.onChange(nextValue === "" ? null : nextValue);
																}}
																placeholder="e.g. +91 98765 43210"
																className="bg-white/90"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<div>
												<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
													Email
												</FormLabel>
												<Input value={profile.email} disabled className="mt-2 bg-white/90 text-slate-500" />
											</div>
											<div className="md:col-span-2">
												<Button
													type="submit"
													className="w-full rounded-full bg-slate-900 text-white transition hover:bg-slate-800 md:w-auto"
													disabled={updateProfileMutation.isPending}
												>
													{updateProfileMutation.isPending ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Saving
														</>
													) : (
														<>
															Save changes
														</>
													)}
												</Button>
											</div>
										</form>
									</Form>

									{accountFeedback ? (
										<p
											className={cn(
												"mt-4 text-sm",
												accountFeedback.status === "success"
													? "text-emerald-600"
													: "text-rose-600",
											)}
										>
											{accountFeedback.message}
										</p>
									) : null}
								</div>
								<aside className="flex flex-col gap-4">
									<div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
										<div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-slate-200/10 blur-3xl" />
										<div className="pointer-events-none absolute -right-14 bottom-0 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
										<div className="relative flex flex-col gap-4">
											<div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-amber-200">
												<Sparkles className="h-4 w-4" />
												Loyalty preview
											</div>
											<p className="text-2xl font-semibold">Silver tier in reach</p>
											<p className="text-sm text-slate-200">
												Complete <span className="font-semibold text-white">two more orders</span> to unlock concierge styling and early access drops.
											</p>
											<Button
												variant="ghost"
												className="mt-2 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
											>
												Explore perks
												<ArrowUpRight className="ml-2 h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
											<div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
												<ShieldCheck className="h-4 w-4 text-emerald-500" />
												Secure email
											</div>
											<p className="mt-2 text-sm font-semibold text-slate-900">{profile.email}</p>
											<p className="text-xs text-slate-500">Verified with better-auth. Update password from the security hub.</p>
										</div>
										<div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
											<div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
												<MapPin className="h-4 w-4 text-slate-500" />
												Saved addresses
											</div>
											<p className="mt-2 text-sm font-semibold text-slate-900">{addressCount} saved</p>
											<p className="text-xs text-slate-500">
												{hasAddresses
													? "Manage defaults and delivery notes anytime."
													: "Add an address to skip checkout forms entirely."}
											</p>
										</div>
										<div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
											<div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
												<Phone className="h-4 w-4 text-slate-500" />
												Courier updates
											</div>
											<p className="mt-2 text-sm font-semibold text-slate-900">
												{hasPhoneNumber ? profile.phoneNumber : "Add a contact number"}
											</p>
											<p className="text-xs text-slate-500">
												{hasPhoneNumber
													? "Couriers can reach you instantly when your drop arrives."
													: "Add a number so couriers can coordinate deliveries with you."}
											</p>
										</div>
									</div>
								</aside>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-3xl border border-slate-200 bg-slate-50">
						<CardHeader>
							<CardTitle className="text-lg font-semibold text-slate-900">
								Account snapshot
							</CardTitle>
							<CardDescription className="text-slate-500">
								Stay tuned for loyalty tiers and concierge perks tailored to you.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-slate-600">
							<div className="rounded-2xl bg-white px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-500">
								Signed in as {profile.email}
							</div>
							<p className="text-sm text-slate-600">
								We’ll surface your exclusive invites, size preferences, and upcoming drops right here soon.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-10 grid gap-8 lg:grid-cols-2">
					<div className="space-y-6">
						<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
							<CardHeader>
								<CardTitle className="text-lg font-semibold text-slate-900">
									Saved addresses
								</CardTitle>
								<CardDescription className="text-slate-500">
									Pin your most used locations and choose the one we ship to by default.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{addressFeedback ? (
									<p
										className={cn(
											"text-sm",
											addressFeedback.status === "success"
												? "text-emerald-600"
												: "text-rose-600",
										)}
									>
										{addressFeedback.message}
									</p>
								) : null}

								{addressEditor ? (
									<AddressEditor
										key={addressEditor.mode === "edit" ? addressEditor.address.id : "create"}
										mode={addressEditor.mode}
										initialValues={addressEditor.mode === "edit" ? addressEditor.address : undefined}
										onSubmit={handleAddressSubmit}
										onCancel={() => setAddressEditor(null)}
										hasExistingAddresses={hasAddresses}
										isProcessing={
											createAddressMutation.isPending ||
											updateAddressMutation.isPending
										}
									/>
								) : null}

								{hasAddresses ? (
									<div className="space-y-4">
										{profile.addresses.map((address) => {
											const isDeleting =
												addressAction?.type === "delete" &&
												addressAction.id === address.id;
											const isSettingDefault =
												addressAction?.type === "default" &&
												addressAction.id === address.id;

											return (
												<div
													key={address.id}
													className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
												>
													<div className="flex flex-wrap items-center justify-between gap-3">
														<div>
															<p className="text-sm font-semibold text-slate-900">
																{address.label ?? "Untitled address"}
															</p>
															<p className="text-xs uppercase tracking-[0.3em] text-slate-400">
																{address.fullName}
															</p>
														</div>
														{address.isDefault ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
																<Check className="h-3.5 w-3.5" /> Default
															</span>
														) : null}
												</div>
												<div className="mt-3 space-y-1 text-sm text-slate-600">
													<p>{address.streetLine1}</p>
													{address.streetLine2 ? <p>{address.streetLine2}</p> : null}
													<p>
														{address.city}
														{address.state ? `, ${address.state}` : ""}
													</p>
													<p>{[address.country, address.postalCode].filter(Boolean).join(" - ")}</p>
													{address.phoneNumber ? (
														<p className="text-xs text-slate-500">
															Phone: {address.phoneNumber}
														</p>
													) : null}
												</div>
												<div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
													<Button
														variant="outline"
														size="sm"
														className="rounded-full"
														onClick={() => setAddressEditor({ mode: "edit", address })}
														type="button"
													>
														Edit
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="rounded-full"
														onClick={() => handleDeleteAddress(address.id)}
														disabled={isDeleting || deleteAddressMutation.isPending}
														type="button"
													>
														{isDeleting ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
														) : (
															<>
																<Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
															</>
														)}
													</Button>
													{address.isDefault ? null : (
														<Button
															variant="outline"
															size="sm"
															className="rounded-full"
															onClick={() => handleSetDefault(address.id)}
															disabled={isSettingDefault || updateAddressMutation.isPending}
															type="button"
														>
															{isSettingDefault ? (
																<Loader2 className="h-3.5 w-3.5 animate-spin" />
															) : (
																"Set default"
															)}
														</Button>
													)}
												</div>
											</div>
										);
									})}
									</div>
								) : (
									<p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600">
										You haven’t saved any addresses yet. Add one so we can tuck your deliveries right where you want them.
									</p>
								)}

								<Button
									variant="outline"
									className="w-full rounded-full"
									onClick={() => setAddressEditor({ mode: "create" })}
									disabled={createAddressMutation.isPending ||
										updateAddressMutation.isPending}
									type="button"
								>
									<Plus className="mr-2 h-4 w-4" /> Add new address
								</Button>
							</CardContent>
						</Card>
					</div>

					<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg font-semibold text-slate-900">
								Style notes
							</CardTitle>
							<CardDescription className="text-slate-500">
								We’re learning your aesthetic. Pin colour stories and fits soon.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-slate-600">
							<p>
								Right now we’re curating your looks automatically. In an upcoming release you’ll be able to lock in favourite palettes, silhouettes, and layering rules right here.
							</p>
							<p className="text-xs uppercase tracking-[0.35em] text-slate-400">
								Coming soon
							</p>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
};

type AddressEditorProps = {
	mode: "create" | "edit";
	initialValues?: FormattedProfileAddress;
	onSubmit: (payload: CreateAddressInput) => Promise<void>;
	onCancel: () => void;
	isProcessing: boolean;
	hasExistingAddresses: boolean;
};

const AddressEditor = ({
	mode,
	initialValues,
	onSubmit,
	onCancel,
	isProcessing,
	hasExistingAddresses,
}: AddressEditorProps) => {
	const form = useForm<AddressFormValues>({
		resolver: zodResolver(createAddressSchema),
		defaultValues: {
			label: initialValues?.label ?? "",
			fullName: initialValues?.fullName ?? "",
			phoneNumber: initialValues?.phoneNumber ?? null,
			streetLine1: initialValues?.streetLine1 ?? "",
			streetLine2: initialValues?.streetLine2 ?? "",
			city: initialValues?.city ?? "",
			state: initialValues?.state ?? "",
			postalCode: initialValues?.postalCode ?? "",
			country: initialValues?.country ?? "",
			setDefault:
				initialValues?.isDefault ?? (!hasExistingAddresses && mode === "create"),
		},
	});

	useEffect(() => {
		form.reset({
			label: initialValues?.label ?? "",
			fullName: initialValues?.fullName ?? "",
			phoneNumber: initialValues?.phoneNumber ?? null,
			streetLine1: initialValues?.streetLine1 ?? "",
			streetLine2: initialValues?.streetLine2 ?? "",
			city: initialValues?.city ?? "",
			state: initialValues?.state ?? "",
			postalCode: initialValues?.postalCode ?? "",
			country: initialValues?.country ?? "",
			setDefault:
				initialValues?.isDefault ?? (!hasExistingAddresses && mode === "create"),
		});
	}, [form, initialValues, hasExistingAddresses, mode]);

	const handleSubmit = form.handleSubmit(async (values) => {
		const payload: CreateAddressInput = {
			label: toNullable(values.label),
			fullName: values.fullName.trim(),
			phoneNumber: values.phoneNumber,
			streetLine1: values.streetLine1.trim(),
			streetLine2: toNullable(values.streetLine2),
			city: values.city.trim(),
			state: toNullable(values.state),
			postalCode: toNullable(values.postalCode),
			country: values.country.trim(),
			setDefault: values.setDefault,
		};

		await onSubmit(payload);
	});

	return (
		<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-base font-semibold text-slate-900">
					{mode === "create" ? "Add a new address" : "Edit address"}
				</CardTitle>
				<CardDescription className="text-slate-500">
					We’ll keep everything aligned with your delivery preferences.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="label"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Label (optional)
									</FormLabel>
									<FormControl>
										<Input
											value={field.value ?? ""}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												field.onChange(event.target.value)
											}
											placeholder="Home, studio, etc."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Recipient name
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Who receives deliveries" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Contact number
									</FormLabel>
									<FormControl>
										<Input
											value={field.value ?? ""}
											onChange={(event: ChangeEvent<HTMLInputElement>) => {
												const nextValue = event.target.value;
												field.onChange(nextValue === "" ? null : nextValue);
											}}
											placeholder="Optional phone"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="streetLine1"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Address line 1
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Street, flat, or apartment" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="streetLine2"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Address line 2 (optional)
									</FormLabel>
									<FormControl>
										<Input
											value={field.value ?? ""}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												field.onChange(event.target.value)
											}
											placeholder="Building, landmark, etc."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										City
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="state"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										State / region
									</FormLabel>
									<FormControl>
										<Input
											value={field.value ?? ""}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												field.onChange(event.target.value)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="postalCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Postal code
									</FormLabel>
									<FormControl>
										<Input
											value={field.value ?? ""}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												field.onChange(event.target.value)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs uppercase tracking-[0.3em] text-slate-400">
										Country
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="setDefault"
							render={({ field }) => (
								<FormItem className="col-span-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
									<div>
										<p className="text-sm font-medium text-slate-900">
											Use as default address
										</p>
										<p className="text-xs text-slate-500">
											We’ll send deliveries here unless you pick another spot at checkout.
										</p>
									</div>
									<FormControl>
										<Switch
											checked={field.value ?? false}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<div className="col-span-full flex items-center justify-end gap-3">
							<Button
								variant="ghost"
								type="button"
								onClick={onCancel}
								disabled={isProcessing}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isProcessing}>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving
									</>
								) : mode === "create" ? (
									"Save address"
								) : (
									"Update address"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default ProfilePage;

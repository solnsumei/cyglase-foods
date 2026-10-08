"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStatesWithCities, ensureCityExists } from "@/lib/locations";



// 1. Email OTP Sign In & Kitchen Registration
export async function sendVendorOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const mode = (formData.get("mode") as string) || "login";
  const business_name = (formData.get("business_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const state = (formData.get("state") as string)?.trim() || "Lagos";
  const city_area = (formData.get("city_area") as string)?.trim();

  if (!email) return { error: "Please enter your business email address." };

  const adminClient = createAdminClient();

  // 1. Check if user/vendor exists in our database
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .maybeSingle();

  if (mode === "login") {
    // If not in profiles or not a vendor/admin
    if (!profile) {
      return {
        error: "No vendor account found with this email. Please switch to the 'Register Kitchen' tab to create your account.",
      };
    }

    // Check if they have an active kitchen registered
    if (profile.role !== "admin") {
      const { data: vendor } = await adminClient
        .from("vendors")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!vendor && profile.role !== "vendor") {
        return {
          error: "This email is registered as a customer, but no food kitchen was found. Please switch to 'Register Kitchen' to set up your food outlet.",
        };
      }
    }
  } else if (mode === "register") {
    if (!business_name) {
      return { error: "Please enter your kitchen or restaurant business name." };
    }
    if (!phone) {
      return { error: "Please enter your business phone number." };
    }
    if (!city_area) {
      return { error: "Please enter your city area or neighborhood (e.g. Yaba, Ikeja, Ipaja)." };
    }

    // If registering, check if they already have an existing vendor
    if (profile) {
      const { data: vendor } = await adminClient
        .from("vendors")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (vendor) {
        return {
          error: "A kitchen is already registered under this email. Please switch to 'Vendor Log In' to access your dashboard.",
        };
      }
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "register",
      data: {
        business_name: business_name || undefined,
        full_name: business_name || undefined,
        phone: phone || undefined,
        state: state || undefined,
        city_area: city_area || undefined,
        role: "vendor",
      },
    },
  });

  if (error) {
    console.error("sendVendorOtp error:", error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes("signups not allowed") || msg.includes("user not found")) {
      return { error: "No vendor account found with this email. Please switch to 'Register Kitchen' to create your account." };
    }
    if (msg.includes("database error")) {
      return { error: "Unable to find or verify this vendor account. Please try again shortly." };
    }
    if (msg.includes("rate limit") || msg.includes("too many requests")) {
      return { error: "Too many attempts. Please wait a moment before requesting another code." };
    }
    return { error: error.message || "Failed to send verification code. Please try again." };
  }
  return { success: true, email };
}

export async function verifyVendorOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const token = (formData.get("token") as string)?.trim();
  const business_name = (formData.get("business_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const state = (formData.get("state") as string)?.trim() || "Lagos";
  const city_area = (formData.get("city_area") as string)?.trim();

  if (!email || !token) return { error: "Please enter the 6-digit OTP code." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.user) {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("database error")) {
      return { error: "Authentication service error. Please request a new code and try again." };
    }
    return { error: error?.message || "Invalid or expired OTP code." };
  }

  const adminClient = createAdminClient();

  // Check if vendor record exists
  const { data: existingVendor } = await adminClient
    .from("vendors")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!existingVendor) {
    // Extract metadata captured during registration
    const bName =
      business_name ||
      (data.user.user_metadata?.business_name as string) ||
      (data.user.user_metadata?.full_name as string);
    const bPhone =
      phone || (data.user.user_metadata?.phone as string);
    const bState =
      state || (data.user.user_metadata?.state as string) || "Lagos";
    const bArea =
      city_area || (data.user.user_metadata?.city_area as string);

    if (bName && bPhone && bArea) {
      // Create slug from business name
      const slug =
        bName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

      // Update profile
      await adminClient
        .from("profiles")
        .update({ role: "vendor", full_name: bName, phone: bPhone })
        .eq("id", data.user.id);

      // Auto-provision kitchen vendor row
      const { error: vendorInsertError } = await adminClient
        .from("vendors")
        .insert({
          user_id: data.user.id,
          business_name: bName,
          slug,
          phone: bPhone,
          state: bState,
          city: bState === "Lagos" ? "Lagos" : bState,
          city_area: bArea,
          address: `${bArea}, ${bState}`,
          is_open: true,
          is_active: true,
        });

      // Ensure custom area is saved to public.cities
      if (bState && bArea) {
        await ensureCityExists(bState, bArea);
      }

      redirect("/vendor");
    } else {
      redirect("/vendor/onboarding");
    }
  }

  redirect("/vendor");
}

// 2. Low-Friction Onboarding (Only 3 key fields to get live immediately)
export async function onboardVendor(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/vendor/login");

  const business_name = (formData.get("business_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const state = (formData.get("state") as string)?.trim() || "Lagos";
  const city = (formData.get("city") as string)?.trim() || "Lagos";
  const city_area = (formData.get("city_area") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || `${city_area}, ${city}`;

  if (!business_name || !phone || !city_area) {
    return { error: "Please provide your business name, phone number, and area." };
  }

  // Create slug from business name
  const slug =
    business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
    "-" +
    Math.floor(1000 + Math.random() * 9000);

  const adminClient = createAdminClient();

  // Update profile role to vendor
  await adminClient
    .from("profiles")
    .update({ role: "vendor", phone })
    .eq("id", user.id);

  // Insert vendor
  const { error } = await adminClient.from("vendors").insert({
    user_id: user.id,
    business_name,
    slug,
    phone,
    state,
    city,
    city_area,
    address,
    is_open: true,
    is_active: true,
  });

  if (error) return { error: error.message };

  // Ensure custom area is added to public.cities
  if (state && city_area) {
    await ensureCityExists(state, city_area);
  }

  redirect("/vendor");
}

// 3. Fast Kitchen Availability Toggle
export async function toggleKitchenStatus(vendorId: string, currentState: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("vendors")
    .update({ is_open: !currentState })
    .eq("id", vendorId);

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return { success: true };
}

// 4. Menu Items Actions
export async function toggleItemStock(itemId: string, currentState: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("menu_items")
    .update({ is_available: !currentState })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return { success: true };
}

export async function upsertMenuItem(formData: FormData) {
  const id = formData.get("id") as string | null;
  const vendor_id = formData.get("vendor_id") as string;
  const category_id = formData.get("category_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseFloat(formData.get("price") as string) || 0;
  const is_available = formData.get("is_available") === "true" || formData.get("is_available") === "on";

  const rawPrep = formData.get("preparation_time_minutes") as string | null;
  const preparation_time_minutes =
    rawPrep && !isNaN(parseInt(rawPrep, 10)) && parseInt(rawPrep, 10) > 0
      ? parseInt(rawPrep, 10)
      : null;

  let image_url = (formData.get("image_url") as string | null) || null;
  const imageFile = formData.get("image_file") as File | null;
  const removeImage = formData.get("remove_image") === "true";

  if (removeImage) {
    image_url = null;
  }

  if (!name || !category_id || price <= 0) {
    return { error: "Please enter item name, category, and a valid price in Naira." };
  }

  const adminClient = createAdminClient();

  // Handle image upload if a file was provided
  if (imageFile && typeof imageFile === "object" && "size" in imageFile && imageFile.size > 0) {
    if (imageFile.size > 10 * 1024 * 1024) {
      return { error: "Dish image must be less than 10MB in size." };
    }

    const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `dish_${vendor_id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from("food-images")
      .upload(fileName, buffer, {
        contentType: imageFile.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Dish image upload error:", uploadError.message);
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = adminClient.storage
      .from("food-images")
      .getPublicUrl(fileName);

    image_url = urlData.publicUrl;
  }

  if (id) {
    const { error } = await adminClient
      .from("menu_items")
      .update({
        name,
        category_id,
        description,
        price,
        is_available,
        image_url,
        preparation_time_minutes,
      })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await adminClient
      .from("menu_items")
      .insert({
        vendor_id,
        category_id,
        name,
        description,
        price,
        is_available,
        image_url,
        preparation_time_minutes,
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/vendor/menu");
  return { success: true };
}

export async function deleteMenuItem(itemId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("menu_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return { success: true };
}

// 5. Order Management Actions
export async function acceptOrder(orderId: string) {
  const adminClient = createAdminClient();

  // Get configured wait time from platform_settings
  const { data: waitSetting } = await adminClient
    .from("platform_settings")
    .select("value")
    .eq("key", "payment_wait_time_minutes")
    .single();

  const waitMinutes = parseInt(waitSetting?.value || "15", 10);
  const now = new Date();
  const deadline = new Date(now.getTime() + waitMinutes * 60 * 1000);

  const { error } = await adminClient
    .from("orders")
    .update({
      status: "awaiting_payment",
      accepted_at: now.toISOString(),
      payment_deadline_at: deadline.toISOString(),
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return { success: true };
}

export async function rejectOrder(orderId: string, reason: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("orders")
    .update({
      status: "rejected",
      rejection_reason: reason || "Vendor unable to prepare order",
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return { success: true };
}

export async function confirmOrderPayment(orderId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("orders")
    .update({
      status: "preparing",
      payment_confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return { success: true };
}

export async function updateOrderFulfillment(
  orderId: string,
  status: "out_for_delivery" | "delivered"
) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return { success: true };
}

// 6. Vendor Settings Update (Bank account, hours, location)
export async function updateVendorSettings(formData: FormData) {
  const vendor_id = formData.get("vendor_id") as string;
  const business_name = (formData.get("business_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const is_phone_public = formData.get("is_phone_public") === "true";
  const state = (formData.get("state") as string)?.trim() || "Lagos";
  const city = (formData.get("city") as string)?.trim() || "Lagos";
  const city_area = (formData.get("city_area") as string)?.trim();
  const landmark = (formData.get("landmark") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim();
  const opening_time = (formData.get("opening_time") as string)?.trim() || "08:00:00";
  const closing_time = (formData.get("closing_time") as string)?.trim() || "22:00:00";
  const bank_name = (formData.get("bank_name") as string)?.trim() || null;
  const account_number = (formData.get("account_number") as string)?.trim() || null;
  const account_name = (formData.get("account_name") as string)?.trim() || null;

  const rawSlug = (formData.get("slug") as string)?.trim().toLowerCase() || "";
  const slug = rawSlug.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  const adminClient = createAdminClient();

  if (slug) {
    if (slug.length < 3) {
      return { error: "Store slug must be at least 3 characters long." };
    }
    const { data: existingVendor } = await adminClient
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .neq("id", vendor_id)
      .maybeSingle();

    if (existingVendor) {
      return { error: "The store slug has already been taken, please choose a different one." };
    }
  }

  const { error } = await adminClient
    .from("vendors")
    .update({
      business_name,
      ...(slug ? { slug } : {}),
      phone,
      is_phone_public,
      state,
      city,
      city_area,
      landmark,
      address,
      opening_time,
      closing_time,
      bank_name,
      account_number,
      account_name,
    })
    .eq("id", vendor_id);

  if (error) return { error: error.message };

  // Ensure custom area is added to public.cities
  if (state && city_area) {
    await ensureCityExists(state, city_area);
  }

  if (slug) {
    revalidatePath(`/store/${slug}`);
  }
  revalidatePath("/vendor/settings");
  revalidatePath("/vendor");
  return { success: true };
}

// 7. Database Locations Helper (Replaces hardcoded states & cities)
export async function getDbLocations() {
  return await getStatesWithCities();
}


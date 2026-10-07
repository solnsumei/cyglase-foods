"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. Email OTP Sign In
export async function sendVendorOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Please enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) return { error: error.message };
  return { success: true, email };
}

export async function verifyVendorOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const token = (formData.get("token") as string)?.trim();

  if (!email || !token) return { error: "Please enter the 6-digit OTP code." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.user) {
    return { error: error?.message || "Invalid or expired OTP code." };
  }

  // Check if vendor record exists
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!vendor) {
    redirect("/vendor/onboarding");
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

  if (!name || !category_id || price <= 0) {
    return { error: "Please enter item name, category, and a valid price in Naira." };
  }

  const adminClient = createAdminClient();

  if (id) {
    const { error } = await adminClient
      .from("menu_items")
      .update({ name, category_id, description, price, is_available })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await adminClient
      .from("menu_items")
      .insert({ vendor_id, category_id, name, description, price, is_available });
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

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("vendors")
    .update({
      business_name,
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
  revalidatePath("/vendor/settings");
  revalidatePath("/vendor");
  return { success: true };
}

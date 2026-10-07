"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database, OrderStatus } from "@/types/database.types";

export async function loginAdmin(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || "Invalid credentials." };
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Access denied. You do not have admin permissions." };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// Category Actions
export async function upsertCategory(formData: FormData) {
  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const description = (formData.get("description") as string)?.trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;
  const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  if (!name) {
    return { error: "Category name is required." };
  }

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  const adminClient = createAdminClient();

  if (id) {
    const { error } = await adminClient
      .from("categories")
      .update({ name, slug, description, display_order, is_active })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    const { error } = await adminClient
      .from("categories")
      .insert({ name, slug, description, display_order, is_active });

    if (error) return { error: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function toggleCategoryActive(id: string, currentState: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("categories")
    .update({ is_active: !currentState })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

// Vendor Actions
export async function toggleVendorActive(id: string, currentState: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("vendors")
    .update({ is_active: !currentState })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/vendors");
  return { success: true };
}

// Menu Items Actions
export async function toggleMenuItemAvailability(id: string, currentState: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("menu_items")
    .update({ is_available: !currentState })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/menu-items");
  return { success: true };
}

// Orders Actions
export async function updateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
  const adminClient = createAdminClient();
  const updateData: Database["public"]["Tables"]["orders"]["Update"] = {
    status,
  };

  if (status === "preparing") {
    updateData.payment_confirmed_at = new Date().toISOString();
  } else if (status === "cancelled" && reason) {
    updateData.cancellation_reason = reason;
  } else if (status === "rejected" && reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await adminClient
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}

// Settings Actions
export async function updatePlatformSetting(key: string, value: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("platform_settings")
    .update({ value })
    .eq("key", key);

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

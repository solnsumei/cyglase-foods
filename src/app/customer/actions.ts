"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. Customer OTP Authentication
export async function sendCustomerOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const mode = (formData.get("mode") as string) || "login";
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!email) return { error: "Please enter your email address." };

  const adminClient = createAdminClient();

  // 1. Check if profile exists
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (mode === "login") {
    if (!profile) {
      return {
        error: "No account found with this email address. Please switch to the 'Create Account' tab to register.",
      };
    }
  } else if (mode === "register") {
    if (profile) {
      return {
        error: "An account with this email address already exists. Please switch to 'Sign In' to log in.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "register",
      data: {
        full_name: fullName || undefined,
        phone: phone || undefined,
      },
    },
  });

  if (error) {
    console.error("sendCustomerOtp error:", error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes("signups not allowed") || msg.includes("user not found")) {
      return { error: "No account found with this email address. Please switch to the 'Create Account' tab to register." };
    }
    if (msg.includes("database error")) {
      return { error: "Unable to find or verify this account. Please try again shortly." };
    }
    if (msg.includes("rate limit") || msg.includes("too many requests")) {
      return { error: "Too many attempts. Please wait a moment before requesting another code." };
    }
    return { error: error.message || "Failed to send verification code. Please try again." };
  }
  return { success: true, email, fullName, phone };
}

export async function verifyCustomerOtp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const token = (formData.get("token") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

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

  // Update profile with name and phone if provided
  if (fullName || phone) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        ...(fullName ? { full_name: fullName } : {}),
        ...(phone ? { phone } : {}),
      })
      .eq("id", data.user.id);
  }

  redirect("/");
}

// 2. Place Food Order
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export async function placeCustomerOrder({
  vendorId,
  customerName,
  customerPhone,
  customerEmail,
  fulfillmentType = "delivery",
  deliveryAddress,
  deliveryLandmark,
  deliveryNotes,
  items,
  subtotal,
  deliveryFee,
  totalAmount,
}: {
  vendorId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType?: "delivery" | "pickup";
  deliveryAddress?: string;
  deliveryLandmark?: string;
  deliveryNotes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}) {
  if (!items || items.length === 0) {
    return { error: "Your food cart is empty." };
  }
  if (!customerName || !customerPhone) {
    return { error: "Please enter your name and phone number." };
  }
  if (!customerEmail) {
    return { error: "Please enter your email address to track your order." };
  }
  if (fulfillmentType === "delivery" && !deliveryAddress) {
    return { error: "Please provide a delivery address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  // Automatic account creation / linking if not logged in
  let customerId = user?.id || null;
  if (!customerId && customerEmail) {
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingProfile) {
      customerId = existingProfile.id;
      // Update phone if missing
      await adminClient
        .from("profiles")
        .update({ phone: customerPhone, full_name: customerName })
        .eq("id", customerId);
    } else {
      const { data: newUser } = await adminClient.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          phone: customerPhone,
        },
      });
      if (newUser?.user) {
        customerId = newUser.user.id;
      }
    }
  }

  // Fetch vendor info to get pickup address if fulfillment is pickup
  const { data: vendor } = await adminClient
    .from("vendors")
    .select("user_id, address, city_area, business_name")
    .eq("id", vendorId)
    .single();

  const finalDeliveryAddress =
    fulfillmentType === "pickup"
      ? `[Self Pickup] ${vendor?.business_name || "Kitchen"} - ${vendor?.address || ""}, ${vendor?.city_area || ""}`
      : deliveryAddress || "Lagos";

  const finalDeliveryFee = fulfillmentType === "pickup" ? 0 : deliveryFee;
  const finalTotalAmount = subtotal + finalDeliveryFee;

  // Create order in DB with initial status: pending_acceptance
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      customer_id: customerId,
      vendor_id: vendorId,
      contact_phone: customerPhone,
      delivery_address: finalDeliveryAddress,
      delivery_city_area:
        fulfillmentType === "pickup"
          ? vendor?.city_area || "Kitchen Pickup"
          : deliveryLandmark || "Lagos",
      delivery_landmark: deliveryLandmark || null,
      notes:
        fulfillmentType === "pickup"
          ? `[SELF PICKUP AT KITCHEN] ${deliveryNotes || ""}`
          : deliveryNotes || null,
      subtotal,
      delivery_fee: finalDeliveryFee,
      total_amount: finalTotalAmount,
      status: "pending_acceptance",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || "Failed to create order." };
  }

  // Insert order items
  const orderItemsData = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    item_name: item.name,
    unit_price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await adminClient
    .from("order_items")
    .insert(orderItemsData);

  if (itemsError) {
    console.error("Error creating order items:", itemsError.message);
  }

  // Also notify the vendor user if found
  if (vendor?.user_id) {
    await adminClient.from("notifications").insert({
      user_id: vendor.user_id,
      order_id: order.id,
      title: "New Order Received! 🍲",
      message: `New food order for ₦${totalAmount.toLocaleString()} received. Tap to accept and prepare.`,
      type: "order_created",
    });
  }

  return { success: true, orderId: order.id };
}

// 3. Upload Payment Receipt for Order
export async function uploadOrderReceipt(formData: FormData) {
  const orderId = formData.get("order_id") as string;
  const file = formData.get("receipt") as File;

  if (!orderId || !file || file.size === 0) {
    return { error: "Please select your bank transfer receipt image or PDF." };
  }

  const adminClient = createAdminClient();
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `receipt_${orderId}_${Date.now()}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await adminClient.storage
    .from("receipts")
    .upload(fileName, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const receiptUrl = `${supabaseUrl}/storage/v1/object/public/receipts/${fileName}`;

  // Update order status to payment_uploaded
  const { error: updateError } = await adminClient
    .from("orders")
    .update({
      payment_receipt_url: receiptUrl,
      payment_uploaded_at: new Date().toISOString(),
      status: "payment_uploaded",
    })
    .eq("id", orderId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Fetch vendor to notify
  const { data: order } = await adminClient
    .from("orders")
    .select("vendor_id, total_amount, vendors(user_id)")
    .eq("id", orderId)
    .single();

  const vendorUserId = (order?.vendors as any)?.user_id;
  if (vendorUserId && order) {
    await adminClient.from("notifications").insert({
      user_id: vendorUserId,
      order_id: orderId,
      title: "Payment Receipt Uploaded! 💳",
      message: `Customer uploaded transfer receipt for ₦${Number(order.total_amount).toLocaleString()}. Please confirm credit.`,
      type: "receipt_uploaded",
    });
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/vendor");
  return { success: true, receiptUrl };
}

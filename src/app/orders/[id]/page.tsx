import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  const adminClient = createAdminClient();

  const { data: order } = await adminClient
    .from("orders")
    .select("*, vendors(*), order_items(*)")
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

  return <OrderDetailClient initialOrder={order as any} />;
}

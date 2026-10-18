import { redirect } from "next/navigation";

export default async function VendorVerifyOtpRedirect(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  params.set("type", "vendor");

  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (typeof val === "string") {
        params.set(key, val);
      }
    }
  }

  redirect(`/verify-otp?${params.toString()}`);
}

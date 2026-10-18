import { redirect } from "next/navigation";

export default async function VerifyRedirect(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (typeof val === "string") {
        params.set(key, val);
      }
    }
  }

  const query = params.toString();
  redirect(`/verify-otp${query ? `?${query}` : ""}`);
}

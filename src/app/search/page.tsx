import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (typeof val === "string") {
        params.set(key, val);
      } else if (Array.isArray(val) && val[0]) {
        params.set(key, val[0]);
      }
    }
  }

  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/#search");
}

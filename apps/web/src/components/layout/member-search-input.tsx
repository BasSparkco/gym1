"use client";

import { useRouter } from "next/navigation";
import { MemberAutocomplete } from "@/components/members/member-autocomplete";

type Props = {
  placeholder: string;
};

export function MemberSearchInput({ placeholder }: Props) {
  const router = useRouter();

  return (
    <MemberAutocomplete
      placeholder={placeholder}
      onSelect={(member) => router.push(`/app/members/${member.id}`)}
      onEnterWithoutSelection={(query) => {
        if (query.trim()) {
          router.push(`/app/members?q=${encodeURIComponent(query.trim())}`);
        }
      }}
      inputClassName="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium outline-none transition placeholder:text-foreground/40 focus:border-brand focus:ring-1 focus:ring-brand w-56"
    />
  );
}

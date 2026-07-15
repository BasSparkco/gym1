"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
      icon={<Search className="h-4 w-4" strokeWidth={2} />}
      containerClassName="relative w-56"
      inputClassName="w-56 rounded-full border border-line bg-white pl-9 pr-4 py-2 text-sm font-medium outline-none transition-all duration-200 placeholder:text-foreground/40 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:w-64"
    />
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/leads/customers");
  }, [router]);
  return null;
}

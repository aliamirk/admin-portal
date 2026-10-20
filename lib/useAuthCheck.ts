"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function useAuthCheck(allowedRoles: string[]) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    if (!role && !username) {
      router.replace("/login");
      return;
    }

    const isAllowed =
      (role && allowedRoles.includes(role)) ||
      (username && allowedRoles.includes(username));

    if (!isAllowed) {
      router.replace("/login");
    }
  }, [router, allowedRoles]);
}

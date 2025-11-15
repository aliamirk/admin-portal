"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function useAuthCheck(allowedRoles: string[]) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");

    // Not logged in
    if (!role) {
      router.replace("/login");
      return;
    }

    // Role not allowed
    if (!allowedRoles.includes(role)) {
      router.replace("/login");
    }
  }, [router, allowedRoles]);
}

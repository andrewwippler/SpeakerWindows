import React, { useState } from "react";
import Layout from "@/components/Layout";
import IllustrationForm from "@/components/IllustrationForm";
import { useAppDispatch } from "@/hooks";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PlusIcon } from "@heroicons/react/24/solid";

export default function Login() {
  const { data: session, status } = useSession();
    const router = useRouter();

  const dispatch = useAppDispatch();
  // Redirect unauthenticated users to homepage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/"); // sitewide redirect
    }
  }, [status, router]);
  if (!session?.accessToken) return;
  return (
    <Layout>
      <IllustrationForm />
    </Layout>
  );
}

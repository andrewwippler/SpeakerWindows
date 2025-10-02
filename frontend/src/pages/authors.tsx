// pages/authors.tsx
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import Author from "@/components/AuthorIndex";
import Layout from "@/components/Layout";

export default function Authors() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users to homepage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login"); // sitewide redirect
    }
  }, [status, router]);

  // Loading state while fetching session
  if (status === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 text-lg animate-pulse">Loading your authors...</p>
        </div>
      </Layout>
    );
  }

  // Render Author component if session and user ID exist
  return (
    <Layout>
        <Author token={session?.accessToken} />

    </Layout>
  );
}

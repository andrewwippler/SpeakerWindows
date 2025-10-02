import Layout from "@/components/Layout";
import Tags from "@/components/TagIndex";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";


export default function Home() {
  const { data: session, status } = useSession();
    const router = useRouter();
    useEffect(() => {
    }, [status, router]);
  return <Layout>{session?.user && <Tags token={session?.accessToken} />}</Layout>;
}

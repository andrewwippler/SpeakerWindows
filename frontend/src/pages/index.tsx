import Layout from "@/components/Layout";
import Tags from "@/components/TagIndex";
import useUser from "@/library/useUser";

export default function Home() {
  const { user } = useUser({
    redirectTo: "/login",
  });

  return <Layout>{user?.isLoggedIn && <Tags token={user?.token} />}</Layout>;
}

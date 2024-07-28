import Author from "@/components/AuthorIndex";
import Layout from "@/components/Layout";
import useUser from "@/library/useUser";
import { setRedirect } from "@/features/ui/reducer";
import { useAppDispatch } from "@/hooks";
import { useEffect } from "react";

export default function Authors() {
  const { user } = useUser({
    redirectTo: "/login",
  });

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!user?.token) dispatch(setRedirect(`/authors`));
  }, [user]);
  if (!user?.token) return;
  return <Layout>{user?.isLoggedIn && <Author token={user?.token} />}</Layout>;
}

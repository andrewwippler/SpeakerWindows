import React, { useState } from "react";
import useUser from "@/library/useUser";
import Layout from "@/components/Layout";
import IllustrationForm from "@/components/IllustrationForm";
import { setRedirect } from "@/features/ui/reducer";
import { useAppDispatch } from "@/hooks";
import { useEffect } from "react";

export default function Login() {
  const { user } = useUser({
    redirectTo: "/login",
  });

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!user?.token) dispatch(setRedirect(`/new-illustration`));
  }, [user, dispatch]);
  if (!user?.token) return;
  return (
    <Layout>
      <IllustrationForm />
    </Layout>
  );
}

import { signIn } from "next-auth/react";
import React, { useState } from "react";
import Layout from "@/components/Layout";
import Form from "@/components/Form";
import fetchJson, { FetchError } from "@/library/fetchJson";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { getRedirect, setRedirect } from "@/features/ui/reducer";

export default function Login() {
  const dispatch = useAppDispatch();

  // retrieve first accessed path as unauthenticated user
  const redirectPath = useAppSelector(getRedirect);

  const [errorMsg, setErrorMsg] = useState("");

  return (
    <Layout>
      <div className="login">
        <Form
          errorMessage={errorMsg}
          onSubmit={async function handleSubmit(event) {
            event.preventDefault();
            await signIn("credentials", {
              redirect: true,
              email: event.currentTarget.email.value,
              password: event.currentTarget.password.value,
            });
          }}
        />
      </div>
    </Layout>
  );
}
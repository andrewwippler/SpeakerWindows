import React, { FormEvent, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setFlashMessage } from "@/features/flash/reducer";
import api from "@/library/api";
import {
  getSettings,
  getThunkSettings,
  setSettings,
} from "@/features/user/reducer";
import router from "next/router";
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import { setRedirect } from "@/features/ui/reducer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const dispatch = useAppDispatch();
  dispatch(getThunkSettings(session?.accessToken));
  const settings = useAppSelector(getSettings);

  useEffect(() => {
        if (status === "unauthenticated") {
      router.replace("/login"); // sitewide redirect
    }
    if (!session?.accessToken) dispatch(setRedirect(`/settings`));
  }, [status, dispatch]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let form = grabAndReturnObject(event.currentTarget);

    api.post(`/settings`, form, session?.accessToken).then((data) => {
      if (data.message != "Settings saved!") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      dispatch(setFlashMessage({ severity: "info", message: data.message }));
      dispatch(setSettings(data.settings));
    });
  };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      place: form.place.value.trim(),
      location: form.location.value.trim(),
    };
  };
  if (!session?.accessToken) return;

  return (
    <Layout>
      {settings && (
        <>
          <div className="text-xl font-bold pb-4 text-sky-900">
            <span className="mr-4">Settings</span>
          </div>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-6 justify-center">
                <label
                  htmlFor="Api-Key"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Api Key
                </label>
                <div className="mt-2">
                  {session?.accessToken ? (
                    <>
                      <span className="inline-block align-middle max-w-[150px] md:max-w-none truncate md:truncate-none">
                        {session.accessToken}
                      </span>
                      <button
                        type="button"
                        data-toggle="tooltip"
                        data-placement="bottom"
                        title="Copy API token to clipboard"
                        className=" px-2 py-2 ml-2 bg-gray-300 hover:bg-gray-500 text-white rounded-md shadow-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(session?.accessToken || "");
                        }}
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-6 justify-center">
                <label
                  htmlFor="Api-Key"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Uncategorized Illustrations
                </label>
                <div className="mt-2 ">
                  {settings && (settings.count ?? 0) > 0 ? (
                    <span className="text-sm text-gray-500">
                      {settings.count}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      No uncategorized illustrations
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="place"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Place
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="place"
                    id="place"
                    defaultValue={
                      settings && settings.place ? settings.place : ""
                    }
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Location
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    defaultValue={
                      settings && settings.location ? settings.location : ""
                    }
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                className="px-4 py-2 mr-4 inline-flex items-center rounded-md font-semibold shadow-sm hover:text-white text-cyan-500 text-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save Settings
              </button>
            </div>
          </form>
        </>
      )}
    </Layout>
  );
}

import { useRouter } from "next/router";
import * as _ from "lodash";
import api from "@/library/api";
import { useState, useEffect, FormEvent, use } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import useUser from "@/library/useUser";
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { useAppSelector, useAppDispatch } from "@/hooks";
import {
  selectModal,
  setModal,
  setThingToDelete,
  thingToDelete,
} from "@/features/modal/reducer";
import { setFlashMessage } from "@/features/flash/reducer";
import IllustrationForm from "@/components/IllustrationForm";
import { illustrationType } from "@/library/illustrationType";
import {
  selectIllustrationEdit,
  setIllustrationEdit,
  selectUpdateUI,
  setUpdateUI,
  setRedirect,
} from "@/features/ui/reducer";
import format from "date-fns/format";
import { placeType } from "@/library/placeType";
import Head from "next/head";
import { getSettings, getThunkSettings } from "@/features/user/reducer";
import Image from "next/image";

export default function IllustrationWrapper() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user } = useUser({
    redirectTo: "/login",
  });

  const editIllustration = useAppSelector(selectIllustrationEdit);
  const refreshUI = useAppSelector(selectUpdateUI);
  const userSettings = useAppSelector(getSettings);

  const [illustration, setData] = useState<illustrationType>();
  const [deletePlace, setdeletePlace] = useState<placeType | null>();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (!user?.token) dispatch(setRedirect(`/illustration/${router.query.id}`));
    if (!router.query.id || !user?.token) {
      return;
    }
    dispatch(getThunkSettings(user.token));

    api.get(`/illustration/${router.query.id}`, "", user.token).then((data) => {
      // You do not have permission to access this resource
      if (
        data.message == "You do not have permission to access this resource" ||
        data.errors ||
        router.query.id == "undefined"
      ) {
        dispatch(
          setFlashMessage({
            severity: "info",
            message: "Illustration not found.",
          })
        );
        router.replace("/");
      } else {
        console.log(data);
        setData(data);
        setLoading(false);
        dispatch(setUpdateUI(false));
      }
    });
  }, [router.query.id, refreshUI, user, userSettings, dispatch, router]);

  if (isLoading) return <Layout>Loading...</Layout>;

  // https://stackoverflow.com/a/43467144
  function isValidHttpUrl(string: string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleCopy = (event: any, content: string) => {
    event.target.innerText = `Text Copied`;
    navigator.clipboard.writeText(content);

    let form = {
      place: userSettings.place ? userSettings.place : "",
      location: userSettings.location ? userSettings.location : "",
      used: format(new Date(), "yyyy-MM-dd")
    }

    api.post(`/places/${illustration?.id}`, form, user?.token).then((data) => {
      if (data.message != "Created successfully") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      dispatch(setUpdateUI(true));
      dispatch(
        setFlashMessage({
          severity: "success",
          message: `Added ${form.place}, ${form.location} to "${illustration?.title}"`,
        })
      );
    });
  };

  const handleDeletePlace = (place: placeType) => {
    dispatch(
      setThingToDelete({
        path: `/places/${place.id}`,
        message: `Place: "${place.place}" was deleted.`,
        title: place.place,
        delete_name: "Place",
        redirect: false,
      })
    );
    dispatch(setModal(true));
  };

  const handleDeleteIllustration = (illustration: illustrationType) => {
    dispatch(
      setThingToDelete({
        path: `/illustration/${illustration.id}`,
        message: `Illustration: "${illustration?.title}" was deleted.`,
        title: illustration?.title,
        delete_name: "Illustration",
        redirect: true,
      })
    );
    dispatch(setModal(true));
  };

  const handlePlaceAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let form = grabAndReturnObject(event.currentTarget);
    api.post(`/places/${illustration?.id}`, form, user?.token).then((data) => {
      if (data.message != "Created successfully") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      dispatch(setUpdateUI(true));
      dispatch(
        setFlashMessage({
          severity: "success",
          message: `Added ${form.place}, ${form.location} to "${illustration?.title}"`,
        })
      );
    });
  };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      place: form.Place.value.trim() || "Someplace",
      location: form.Location.value.trim() || "Somewhere",
      used: form.Used.value.trim(),
    };
  };
  if (!user?.token) return;
  if (!illustration || !userSettings) return <Layout>Loading...</Layout>;
  return (
    <Layout>
      <Head>
        <title>SW | {illustration?.title}</title>
      </Head>
      {editIllustration ? (
        <IllustrationForm illustration={illustration} />
      ) : (
        <>
          <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 ">
            <div className="truncate">
              <span className="font-bold pr-2">Title:</span>
              {/* Title is required */}
              {illustration?.title}
            </div>
            {illustration?.author && (
              <div className="truncate">
                <span className="font-bold pr-2">Author:</span>
                {illustration.author}
              </div>
            )}
            {illustration?.source && (
              <div className="truncate">
                <span className="font-bold pr-2 ">Source:</span>
                {isValidHttpUrl(illustration.source) ? (
                  <Link href={illustration.source}>{illustration.source}</Link>
                ) : (
                  illustration.source
                )}
              </div>
            )}
            {illustration?.tags && (
              <div>
                <span className="font-bold pr-2">Tags:</span>
                {illustration?.tags
                  ? illustration.tags.map((tag, index, arr) => (
                      <Link
                        key={index}
                        className="inline-block mr-2 text-sky-500"
                        href={`/tag/${tag.name}`}
                      >
                        {tag.name.replace(/-/g, " ")}
                        {index != arr.length - 1 ? ", " : ""}
                      </Link>
                    ))
                  : "no tags"}
              </div>
            )}
          </div>

          <div className="columns-1">
            {illustration?.content && (
              <button
                type="button"
                data-toggle="tooltip"
                data-placement="bottom"
                title="Copy to clipboard"
                className="flex w-full justify-center px-4 py-2 my-4 font-semibold text-medium bg-gray-300 hover:bg-gray-500 text-white rounded-md shadow-sm"
                onClick={(e) => {
                  handleCopy(e, illustration.content);
                }}
              >
                <ClipboardDocumentListIcon className="h-6 w-6 mr-2" />{" "}
                <span>Copy Illustration Content</span>
              </button>
            )}

            <div className="columns-1">
              {illustration?.uploads.length > 0 && (
                <div className="text-l font-bold pt-8 text-sky-900">
                  <span className="mr-4">Attachments</span>
                </div>
              )}
              {illustration?.uploads
                ? illustration.uploads.map((upload, index, arr) => (
                    <Link
                      key={index}
                      className="inline-block mr-2 text-sky-500"
                      href={`${process.env.NEXT_PUBLIC_HOST_URL}/uploads/${upload.name}`}
                    >
                      {upload.type == "image" ? (
                        <>
                          <Image
                            src={`${process.env.NEXT_PUBLIC_HOST_URL}/uploads/${upload.name}`}
                            width={100}
                            height={100}
                            alt="Attachment"
                          />
                        </>
                      ) : (
                        upload.name
                      )}
                    </Link>
                  ))
                : "No uploads"}
            </div>

            <div className="py-4 whitespace-pre-wrap">
              {illustration?.content ? illustration.content : "No Content"}
            </div>

            <div className="columns-1 pt-2">
              <button
                className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-cyan-300 hover:bg-cyan-500 text-white rounded-full inline-flex items-center shadow-sm"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <button
                onClick={() => dispatch(setIllustrationEdit(true))}
                className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center"
              >
                <PencilSquareIcon className="h-4 w-4 sm:mr-2 hidden sm:block" />
                Edit<span className="hidden md:block">&nbsp;Illustration</span>
              </button>

              <button
                onClick={() => handleDeleteIllustration(illustration)}
                className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center"
              >
                <TrashIcon className="h-4 w-4 sm:mr-2 hidden sm:block" />
                Delete
                <span className="hidden md:block">&nbsp;Illustration</span>
              </button>
            </div>
          </div>
        </>
      )}
      {!editIllustration && (
        <>
          <div className="text-xl font-bold pt-8 text-sky-900">
            <span className="mr-4">Illustration Use:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-sky-500">
            {illustration?.places && illustration?.places.length > 0 ? (
              illustration.places.map((p, index) => (
                <div key={index} className="w-full gap-2 pb-2">
                  <span className="mr-2">
                    {p.place}, {p.location} - {p.used}
                  </span>
                  <button
                    onClick={() => handleDeletePlace(p)}
                    className="rounded-md p-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white shadow-sm lg:inline-flex items-center"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="pb-2">No places found.</div>
            )}
          </div>
          <form className="mt-4" onSubmit={handlePlaceAdd}>
            <div className="grid grid-cols-6">
              <div className="mb-1 col-span-6 md:col-span-2">
                <label
                  htmlFor="Place"
                  className="sr-only block text-sm font-medium leading-6 text-gray-900"
                >
                  Place
                </label>
                <input
                  type="text"
                  name="Place"
                  id="Place"
                  placeholder="Place"
                  defaultValue={userSettings.place ? userSettings.place : ""}
                  className="block w-full lg:rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="mb-1 col-span-6 md:col-span-2">
                <label
                  htmlFor="Location"
                  className="sr-only block text-sm font-medium leading-6 text-gray-900"
                >
                  Location
                </label>
                <input
                  type="text"
                  name="Location"
                  id="Location"
                  placeholder="Location"
                  defaultValue={
                    userSettings.location ? userSettings.location : ""
                  }
                  className="block w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="mb-1 col-span-6 md:col-span-1">
                <label
                  htmlFor="Used"
                  className="sr-only block text-sm font-medium leading-6 text-gray-900"
                >
                  Used
                </label>
                <input
                  type="date"
                  name="Used"
                  id="Used"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  className="form-input block w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <button
                type="submit"
                className="mb-1 col-span-6 md:col-span-1 inline-flex justify-center lg:rounded-r-md bg-indigo-300 px-2 lg:px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Place
              </button>
            </div>
          </form>
        </>
      )}
    </Layout>
  );
}

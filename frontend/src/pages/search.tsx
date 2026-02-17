import React, { FormEvent, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useAppDispatch } from "@/hooks";
import { setFlashMessage } from "@/features/flash/reducer";
import api from "@/library/api";
import { tagType } from "@/library/tagtype";
import { illustrationType } from "@/library/illustrationType";
import { placeType } from "@/library/placeType";
import { MagnifyingGlassCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { setRedirect } from "@/features/ui/reducer";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

type dataReturn = {
  illustrations: any;
  tags: any;
  places: any;
  message: string;
};

export default function Search() {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<dataReturn | null>(null);
  const [searched, setSearched] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login"); // sitewide redirect
    }
    if (!session?.accessToken) dispatch(setRedirect(`/search`));
  }, [status, dispatch]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let form = {
      query: event.currentTarget.search.value.trim(),
    };

    api.post(`/search`, form, session?.accessToken).then((data) => {
      if (data.message != "success") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      setData(data.data);
      setSearched(form.query);
    });
  };
  if (!session?.accessToken) return;
  // The UI does not allow the saving of an illustration without tags.
  // If it does, then we need to have a listing of those illustrations here.
  return (
    <Layout>
      <div className="text-xl font-bold pb-4 text-sky-900 flex items-center">
        <MagnifyingGlassIcon className="h-6 w-6 mr-2" />
        <span className="mr-4">Search</span>
      </div>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex col-span-6">
          <label
            htmlFor="source"
            className="sr-only block font-medium leading-6 text-gray-900"
          >
            Search
          </label>
          <input
            required
            type="text"
            name="search"
            id="search"
            placeholder="Search query for Illustration Title or Content, Tag, or Place used"
            className="block w-full rounded-l-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          <button
            type="submit"
            className="inline-flex items-center min-w-fit justify-center rounded-r-md bg-indigo-300 px-4 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <MagnifyingGlassCircleIcon className="h-6 w-6 mr-2" />
            Search
          </button>
        </div>
      </form>
      <ul role="list">
        {data && data.places && (
          <div className="text-l font-bold pb-2 text-sky-900">Places</div>
        )}
        {data && data.places.length > 0
          ? data.places.map((d: placeType, i: number) => (
              <li key={i} className="group/item hover:bg-slate-200">
                <Link
                  className="block pb-1 group-hover/item:underline"
                  href={`/illustration/${d.illustration_id}`}
                >
                  {d.place}
                </Link>
              </li>
            ))
          : searched && <div>No places found</div>}
      </ul>
      <ul role="list">
        {data && data.tags && (
          <div className="text-l font-bold pb-2 text-sky-900">Tags</div>
        )}
        {data && data.tags.length > 0
          ? data.tags.map((d: tagType, i: number) => (
              <li key={i} className="group/item hover:bg-slate-200">
                <Link
                  className="block pb-1 group-hover/item:underline"
                  href={`/tag/${d.name}`}
                >
                  {d.name}
                </Link>
              </li>
            ))
          : searched && <div>No tags found</div>}
      </ul>
      <ul role="list">
        {data && data.illustrations && (
          <div className="text-l font-bold pb-2 text-sky-900">
            Illustrations
          </div>
        )}
        {data && data.illustrations.length > 0
          ? data.illustrations.map((d: illustrationType, i: number) => (
              <li key={i} className="group/item hover:bg-slate-200">
                <Link
                  className="block pb-1 group-hover/item:underline"
                  href={`/illustration/${d.id}`}
                  dangerouslySetInnerHTML={{
                    __html: d.title.replace(
                      new RegExp(`${searched}`, "gi"),
                      `<span class='font-bold'>${searched}</span>`
                    ),
                  }}
                ></Link>
                <div
                  className="invisible h-0 group-hover/item:h-auto group-hover/item:visible"
                  dangerouslySetInnerHTML={{
                    __html:
                      d.content
                        .slice(0, 256)
                        .replace(
                          new RegExp(`${searched}`, "gi"),
                          `<span class='font-bold'>${searched}</span>`
                        ) + "...",
                  }}
                ></div>
              </li>
            ))
          : searched && <div>No illustrations found</div>}
      </ul>
    </Layout>
  );
}

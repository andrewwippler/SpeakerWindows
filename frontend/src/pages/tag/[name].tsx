// @ts-nocheck
import { useRouter } from "next/router";
import * as _ from "lodash";
import api from "@/library/api";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  PencilSquareIcon,
  CheckCircleIcon,
  TrashIcon,
  MinusCircleIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { FormEvent } from "react";
import Head from "next/head";
import { setRedirect } from "@/features/ui/reducer";
import { useAppSelector, useAppDispatch } from "@/hooks";
import {
  selectModal,
  setModal,
  setThingToDelete,
} from "@/features/modal/reducer";
import { setFlashMessage } from "@/features/flash/reducer";
import { useSession } from "next-auth/react";
export default function Tag() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  // remove - for visual representation
  let name = _.get(router.query, "name", "").replace(/-/g, " ");

  const [data, setData] = useState([]);
  const [editTag, setEditTag] = useState(false);
  const [showBulkRemove, setShowBulkRemove] = useState(false);
  const [showBulkPrivacy, setShowBulkPrivacy] = useState(false);
  const [selectedIllustrations, setSelectedIllustrations] = useState<number[]>(
    [],
  );

  const refreshData = (token: string | undefined) => {
    const teamId = session?.team?.id;
    // console.log("refreshing tag data with teamId: ", teamId, session);
    const params = teamId ? { team_id: teamId } : {};
    api.get(`/tag/${router.query.name}`, params, token).then((data) => {
      setData(data);
    });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login"); // sitewide redirect
    }
    if (!session?.accessToken)
      dispatch(setRedirect(`/tag/${router.query.name}`));
    if (!router.query.name) {
      return;
    }
    refreshData(session?.accessToken);
  }, [
    name,
    dispatch,
    status,
    router.query.name,
    session?.team?.id,
    session?.accessToken,
  ]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newname = event.currentTarget.tag.value.trim();

    // update tag
    api
      .put(`/tags/${data.id}`, { name: newname }, session?.accessToken)
      .then((data) => {
        if (data.message != "Updated successfully") {
          dispatch(
            setFlashMessage({ severity: "danger", message: data.message }),
          );
          return;
        }
        dispatch(
          setFlashMessage({
            severity: "success",
            message: `Tag "${name}" was renamed to ${newname}.`,
          }),
        );
        setEditTag(false);
        router.replace(`/tag/${newname}`);
      });
  };

  const handleDelete = () => {
    dispatch(
      setThingToDelete({
        path: `/tags/${data.id}`,
        message: `Tag "${name}" was deleted.`,
        title: name,
        delete_name: "Tag",
        redirect: true,
      }),
    );
    dispatch(setModal(true));
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIllustrations((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkRemove = () => {
    if (selectedIllustrations.length === 0) return;

    api
      .put(
        `/illustrations/bulk`,
        { illustrations: selectedIllustrations, action: "remove_tag", data: name },
        session?.accessToken,
      )
      .then((response) => {
        dispatch(
          setFlashMessage({
            severity: "success",
            message: response.message,
          }),
        );
        setSelectedIllustrations([]);
        setShowBulkRemove(false);
        refreshData(session?.accessToken);
      })
      .catch((err) => {
        dispatch(
          setFlashMessage({
            severity: "danger",
            message: err.message || "Failed to remove illustrations",
          }),
        );
      });
  };

  const handleBulkPrivacy = (makePrivate: boolean) => {
    if (selectedIllustrations.length === 0) return;

    const ownedSelections = selectedIllustrations.filter((id) => {
      const ill = data.illustrations?.find((i: any) => i.id === id);
      return ill?.user_id === session?.userId;
    });

    if (ownedSelections.length === 0) {
      dispatch(
        setFlashMessage({
          severity: "danger",
          message: "You can only change privacy for illustrations you own",
        }),
      );
      return;
    }

    if (ownedSelections.length < selectedIllustrations.length) {
      dispatch(
        setFlashMessage({
          severity: "warning",
          message: `Only changing privacy for ${ownedSelections.length} illustrations you own. ${selectedIllustrations.length - ownedSelections.length} items were skipped.`,
        }),
      );
    }

    api
      .put(
        `/illustrations/bulk`,
        { illustrations: ownedSelections, action: "toggle_privacy", data: makePrivate },
        session?.accessToken,
      )
      .then((response) => {
        dispatch(
          setFlashMessage({
            severity: "success",
            message: response.message,
          }),
        );
        setSelectedIllustrations([]);
        setShowBulkPrivacy(false);
        refreshData(session?.accessToken);
      })
      .catch((err) => {
        dispatch(
          setFlashMessage({
            severity: "danger",
            message: err.message || "Failed to update privacy",
          }),
        );
      });
  };

  const toggleAll = () => {
    if (selectedIllustrations.length === data.illustrations?.length) {
      setSelectedIllustrations([]);
    } else {
      setSelectedIllustrations(
        data.illustrations?.map((ill: any) => ill.id) || [],
      );
    }
  };

  if (!session?.accessToken) return;
  return (
    <Layout>
      <Head>
        <title>SW | {name}</title>
      </Head>
      <div className="text-xl font-bold pb-4 text-sky-900">
        {editTag ? (
          <form className="mt-8 space-y-6" onSubmit={handleSave}>
            <label htmlFor="tag" className="sr-only">
              Rename Tag
            </label>
            <input
              id="tag"
              name="tag"
              type="tag"
              autoComplete="tag"
              required
              className="pl-1.5 py-1.5 ring-1 mr-4"
              placeholder="tag"
              defaultValue={name}
            />

            <button
              type="submit"
              className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Update Tag
            </button>
          </form>
        ) : (
          <>
            <span className="mr-4">{name}</span>
            <button
              onClick={() => setEditTag(true)}
              className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit Tag
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Tag
            </button>
            {!showBulkRemove && (
              <button
                onClick={() => setShowBulkRemove(true)}
                className="hidden md:inline-flex px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-orange-300 hover:bg-orange-500 text-white rounded-full shadow-sm items-center"
              >
                <MinusCircleIcon className="h-4 w-4 mr-2" />
                Remove Illustrations
              </button>
            )}
            {!showBulkPrivacy && !showBulkRemove && (
              <button
                onClick={() => setShowBulkPrivacy(true)}
                className="hidden md:inline-flex px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-blue-300 hover:bg-blue-500 text-white rounded-full shadow-sm items-center"
              >
                <EyeSlashIcon className="h-4 w-4 mr-2" />
                Toggle Privacy
              </button>
            )}
          </>
        )}
      </div>

      {showBulkRemove && (
        <div className="pb-4">
          <button
            onClick={toggleAll}
            className="mr-4 text-sm text-sky-600 hover:text-sky-800"
          >
            {selectedIllustrations.length === data.illustrations?.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <button
            onClick={handleBulkRemove}
            disabled={selectedIllustrations.length === 0}
            className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Remove Selected ({selectedIllustrations.length})
          </button>
          <button
            onClick={() => {
              setShowBulkRemove(false);
              setSelectedIllustrations([]);
            }}
            className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-gray-300 hover:bg-gray-500 text-white rounded-full shadow-sm inline-flex items-center"
          >
            Cancel
          </button>
        </div>
      )}

      {showBulkPrivacy && (
        <div className="pb-4">
          <button
            onClick={toggleAll}
            className="mr-4 text-sm text-sky-600 hover:text-sky-800"
          >
            {selectedIllustrations.length === data.illustrations?.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <button
            onClick={() => handleBulkPrivacy(true)}
            disabled={selectedIllustrations.length === 0}
            className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-yellow-300 hover:bg-yellow-500 text-white rounded-full shadow-sm inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <EyeSlashIcon className="h-4 w-4 mr-2" />
            Make Private ({selectedIllustrations.length})
          </button>
          <button
            onClick={() => handleBulkPrivacy(false)}
            disabled={selectedIllustrations.length === 0}
            className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Make Public ({selectedIllustrations.length})
          </button>
          <button
            onClick={() => {
              setShowBulkPrivacy(false);
              setSelectedIllustrations([]);
            }}
            className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-gray-300 hover:bg-gray-500 text-white rounded-full shadow-sm inline-flex items-center"
          >
            Cancel
          </button>
        </div>
      )}

      <ul role="list">
        {!data.illustrations ? (
          <div>Loading...</div>
        ) : data.illustrations.length > 0 ? (
          data.illustrations.map((d, i) => (
            <li key={i} className="group/item hover:bg-slate-200">
              <div className="flex items-start gap-3">
                {(showBulkRemove || showBulkPrivacy) && (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    checked={selectedIllustrations.includes(d.id)}
                    onChange={() => handleToggleSelect(d.id)}
                  />
                )}

                <div className="flex-1">
                  <Link
                    className="block pb-1 group-hover/item:underline"
                    href={`/illustration/${d.id}`}
                  >
                    {d.private && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Private
                      </span>
                    )}
                    {d.title}
                  </Link>

                  <div className="invisible h-0 group-hover/item:h-auto group-hover/item:visible">
                    {d.content ? d.content.slice(0, 256) + "..." : "No Content"}
                  </div>
                </div>
              </div>
            </li>
          ))
        ) : (
          <div>No illustrations found</div>
        )}
      </ul>
    </Layout>
  );
}

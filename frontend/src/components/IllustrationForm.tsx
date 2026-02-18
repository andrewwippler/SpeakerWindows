import { ChangeEvent, FormEvent, useState } from "react";
import { ArrowLeftIcon, TrashIcon, PhotoIcon, PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import api from "@/library/api";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { setFlashMessage } from "@/features/flash/reducer";
import { useRouter } from "next/router";
import { illustrationType, UploadType } from "@/library/illustrationType";
import { setIllustrationEdit, setUpdateUI } from "@/features/ui/reducer";
import TagSelect from "./TagSelect";
import { getFormattedTags } from "@/features/tags/reducer";
import Link from "next/link";
import { setModal, setThingToDelete } from "@/features/modal/reducer";
import ConfirmDialog from "./ConfirmDialog";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function IllustrationForm({
  illustration,
}: {
  illustration?: illustrationType;
  }) {
    const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formattedTags = useAppSelector(getFormattedTags);

  let edit = false;
  if (illustration) {
    edit = true;
  }

  const [file, setFile] = useState<Boolean>();
  const [deleteUpload, setDeleteUpload] = useState<UploadType>();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {

    const files = event.target.files
    if (!files) { return }
    const uploadedFile = files[0];

    if (
      uploadedFile.type !== "image/png" &&
      uploadedFile.type !== "application/pdf" &&
      uploadedFile.type !== "image/gif" &&
      uploadedFile.type !== "image/jpeg"
    ) {
      dispatch(
        setFlashMessage({
          severity: "danger",
          message: `Please choose a supported format: GIF, JPG, PDF, PNG`,
        })
      );
      return;
    }

    if (uploadedFile.size > 20 * 1024 * 1024) {
      dispatch(
        setFlashMessage({
          severity: "danger",
          message: `File size should not exceed 20MB.`,
        })
      );
      return;
    }
    setFile(true);
    // console.log({
    //   illustration_image: uploadedFile,
    //   illustration_id: illustration?.id,
    // });

    api
      .postMultipart(
        `/upload`,
        { illustration_image: uploadedFile, illustration_id: illustration?.id },
        session?.accessToken
      )
      .then((data) => {
        if (data.message != "File uploaded successfully") {
          dispatch(
            setFlashMessage({ severity: "danger", message: data.message })
          );
          setFile(false);
          return;
        }
        dispatch(
          setFlashMessage({ severity: "success", message: `Attachment added` })
        );
        dispatch(setUpdateUI(true));
      });
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (edit) {
      return handleEditSave(event);
    }
    return handleNewSave(event);
  };

  const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
    let form = grabAndReturnObject(event.currentTarget);
    // update illustration
    api
      .put(`/illustration/${illustration?.id}`, form, session?.accessToken)
      .then((data) => {
        if (data.message != "Updated successfully") {
          dispatch(
            setFlashMessage({ severity: "danger", message: data.message })
          );
          return;
        }
        dispatch(
          setFlashMessage({
            severity: "success",
            message: `Illustration "${illustration?.title}" was updated.`,
          })
        );
        dispatch(setIllustrationEdit(false));
        dispatch(setUpdateUI(true));
        router.replace(`/illustration/${data.illustration.id}`);
      });
  };

  const handleNewSave = (event: FormEvent<HTMLFormElement>) => {
    let form = grabAndReturnObject(event.currentTarget);

    api.post(`/illustration`, form, session?.accessToken).then((data) => {
      if (data.message != "Created successfully") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      dispatch(
        setFlashMessage({
          severity: "success",
          message: `Illustration "${form.title}" was created.`,
        })
      );
      dispatch(setUpdateUI(true));
      router.replace(`/illustration/${data.id}`);
    });
  };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      title: form.ititle.value.trim(),
      author: form.author.value.trim(),
      source: form.source.value.trim(),
      tags: formattedTags,
      content: form.content.value.trim(),
      private: form.private.checked,
    };
  };

  const handleDeleteUpload = (upload: UploadType) => {
    dispatch(
      setThingToDelete({
        path: `/upload/${upload.id}`,
        message: `Attachment "${upload?.name}" was deleted.`,
        title: upload?.name,
        delete_name: "Attachment",
        redirect: false,
      })
    );
    dispatch(setModal(true));
  };

  return (
    <>
      <div className="mr-4 text-xl font-bold pb-4 text-sky-900 flex items-center">
        {edit ? <PencilSquareIcon className="h-6 w-6 mr-2" /> : <PlusIcon className="h-6 w-6 mr-2" />}
        {edit ? "Edit" : "New"} Illustration
      </div>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="mt-5 md:col-span-2 md:mt-0">
          <div className="overflow-hidden shadow sm:rounded-md">
            <div className="bg-white px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">

                <div className="col-span-6 sm:col-span-6">
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      name="private"
                      id="private"
                      defaultChecked={
                        edit && illustration ? illustration.private : false
                      }
                      className="h-4 w-4 rounded border-sky-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-500">Private/Personal illustration</span>
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="ititle"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Title
                  </label>
                  <input
                    required
                    type="text"
                    name="ititle"
                    id="ititle"
                    placeholder="Title"
                    defaultValue={
                      edit && illustration ? illustration.title : ""
                    }
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="author"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    id="author"
                    placeholder="Author"
                    defaultValue={
                      edit && illustration ? illustration.author : ""
                    }
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>


                <div className="col-span-6">
                  <label
                    htmlFor="source"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Source
                  </label>
                  <input
                    type="text"
                    name="source"
                    id="source"
                    placeholder="Source"
                    defaultValue={
                      edit && illustration ? illustration.source : ""
                    }
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                {edit && (!file || illustration?.uploads) && (
                  <div className="col-span-6">
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                      <div className="text-center">
                        <PhotoIcon
                          aria-hidden="true"
                          className="mx-auto h-12 w-12 text-gray-300"
                        />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">
                          PNG, PDF, JPG, GIF up to 20MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {edit && (file || illustration?.uploads) && (
                  <div className="col-span-6">
                    {illustration?.uploads.map((upload, index, arr) => (
                      <>
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
                                alt="Picture of the author"
                              />
                            </>
                          ) : (
                            upload.name
                          )}
                        </Link>
                        <button
                          onClick={() => handleDeleteUpload(upload)}
                          className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 sm:mr-2 hidden sm:block" />
                          <span className="hidden md:block">Delete Upload</span>
                        </button>
                      </>
                    ))}
                  </div>
                )}

                <div className="col-span-6">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Tags
                  </label>
                  <TagSelect
                    token={session?.accessToken}
                    defaultValue={edit && illustration ? illustration.tags : ""}
                  />
                </div>
                <div className="col-span-6">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Content
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="content"
                      name="content"
                      rows={16}
                      className="mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                      placeholder="Content"
                      defaultValue={
                        edit && illustration ? illustration.content : ""
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <button
                className="px-4 py-2 mr-4 inline-flex justify-center rounded-md bg-cyan-300 font-semibold shadow-sm text-white text-sm bg-cyan-300 hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-indigo-300 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {edit ? "Update" : "Create"} Illustration
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

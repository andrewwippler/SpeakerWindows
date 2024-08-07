import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "@/hooks";
import {
  selectModal,
  setModal,
  setThingToDelete,
  thingToDelete,
} from "@/features/modal/reducer";
import useUser from "@/library/useUser";
import api from "@/library/api";
import { setUpdateUI } from "@/features/ui/reducer";
import { setFlashMessage } from "@/features/flash/reducer";
import router from "next/router";

export default function ConfirmDialog() {
  const { user } = useUser({
    redirectTo: "/login",
  });

  const dispatch = useAppDispatch();
  const open = useAppSelector(selectModal);
  const toDelete = useAppSelector(thingToDelete);

  const cancelButtonRef = useRef(null);

  const handleClose = () => {
    dispatch(setModal(false));
    dispatch(
      setThingToDelete({
        path: "",
        message: "",
        title: "",
        delete_name: "",
        redirect: false,
      })
    );
  };

  const handleAgree = () => {
    api.delete(toDelete.path, "", user?.token).then(() => {
      dispatch(setModal(false));
      dispatch(setUpdateUI(true));
      dispatch(
        setThingToDelete({
          path: "",
          message: "",
          title: "",
          delete_name: "",
          redirect: false,
        })
      );
      dispatch(
        setFlashMessage({ severity: "danger", message: toDelete.message })
      );
      if (toDelete.redirect) {
        router.replace("/");
      }
    });
  };

  return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={handleClose}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon
                          className="h-6 w-6 text-red-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Delete {toDelete.delete_name}?
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 pb-4">
                            Are you sure you want to delete:
                          </p>
                          <p className="text-sm italic text-gray-500 pb-4">
                            {toDelete.title}
                          </p>
                          <p className="text-sm font-bold text-gray-500">
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={() => handleAgree()}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => handleClose()}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
  );
}

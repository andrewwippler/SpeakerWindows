import { Transition } from "@headlessui/react";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { useTimeoutFn } from "react-use";
import {
  selectFlash,
  setFlash,
  selectFlashMessage,
} from "@/features/flash/reducer";
import { useEffect, useState } from "react";
export default function Flash() {
  const flashOpen = useAppSelector(selectFlash);
  const flash = useAppSelector(selectFlashMessage);
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(setFlash(false));
  };

  // tailwindcss bug
  const textColor = {
    success: "text-green-800",
    danger: "text-red-800",
    info: "text-blue-800",
  };

  const bgColor = {
    success: "bg-green-100",
    danger: "bg-red-100",
    info: "bg-blue-100",
  };

  const borderColor = {
    success: "border-green-500",
    danger: "border-red-500",
    info: "border-blue-500",
  };

  useEffect(() => {
    const timeId = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => {
      clearTimeout(timeId);
    };
  }, [flashOpen, handleClose]);

  if (!flashOpen) return <></>;

  return (
    <div className="flex mt-4 items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-screen-lg">
        <Transition
          show={flashOpen}
          appear={true}
          as="div"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={`${bgColor[flash.severity as keyof Object]} ${
              borderColor[flash.severity as keyof Object]
            } border ${
              textColor[flash.severity as keyof Object]
            } px-4 py-3 rounded relative`}
            role="alert"
          >
            <span className="block sm:inline">{flash.message}</span>
            <button
              onClick={() => handleClose()}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg
                className={`fill-current h-6 w-6 ${
                  textColor[flash.severity as keyof Object]
                }`}
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  );
}

import { useSession, signIn, signOut } from "next-auth/react";
import { useAppDispatch } from "@/hooks";
import { clear } from "@/features/recentlyViewed";

export default function Component() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  const handleSignOut = () => {
    dispatch(clear());
    signOut();
  };

  if (session) {
    return (
      <>
        <div className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-blue-100 hover:bg-blue-900">
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-blue-100 hover:bg-blue-900">
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    </>
  );
}

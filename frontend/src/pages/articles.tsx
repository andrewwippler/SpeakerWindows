// @ts-nocheck
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { selectRecentlyViewed, clear } from "@/features/recentlyViewed";
import { TrashIcon, BookOpenIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Head from "next/head";

interface GroupedIllustrations {
  [key: string]: typeof illustrations;
}

export default function Articles() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const illustrations = useAppSelector(selectRecentlyViewed);

  if (status === "unauthenticated") {
    router.replace("/login");
  }

  if (!session?.accessToken) return;

  const getDateKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    if (date >= todayStart) {
      return "Today";
    } else if (date >= yesterdayStart) {
      return "Yesterday";
    } else if (date >= weekStart) {
      return "Earlier this Week";
    } else {
      return "Older";
    }
  };

  const grouped: GroupedIllustrations = illustrations.reduce((acc, ill) => {
    const key = getDateKey(ill.accessedAt);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(ill);
    return acc;
  }, {});

  const groupOrder = ["Today", "Yesterday", "Earlier this Week", "Older"];

  return (
    <Layout>
      <Head>
        <title>SW | Articles</title>
      </Head>
      <div className="flex items-center justify-between pb-4">
        <div className="text-xl font-bold text-sky-900 flex items-center">
          <BookOpenIcon className="h-6 w-6 mr-2" />
          Articles
        </div>
        {illustrations.length > 0 && (
          <button
            onClick={() => dispatch(clear())}
            className="px-4 py-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear History
          </button>
        )}
      </div>

      {illustrations.length === 0 ? (
        <div className="text-gray-500">No illustrations viewed this session</div>
      ) : (
        groupOrder.map((groupName) => {
          const groupItems = grouped[groupName];
          if (!groupItems || groupItems.length === 0) return null;

          return (
            <div key={groupName} className="pb-6">
              <div className="text-lg font-semibold text-sky-700 pb-2">
                {groupName}
              </div>
              <ul role="list">
                {groupItems.map((ill, i) => (
                  <li key={ill.id} className="group/item hover:bg-slate-200">
                    <Link
                      className="block pb-1 group-hover/item:underline"
                      href={`/illustration/${ill.id}`}
                    >
                      {ill.title}
                    </Link>
                    <div className="invisible h-0 group-hover/item:h-auto group-hover/item:visible">
                      {ill.content ? ill.content.slice(0, 256) + "..." : "No Content"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </Layout>
  );
}

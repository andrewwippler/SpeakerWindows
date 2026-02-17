import * as _ from "lodash";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import api from "@/library/api";
import { TagIcon } from "@heroicons/react/24/solid";

interface Tag {
  id: string | number;
  name: string;
}

interface TagsProps {
  token?: string;
}

export default function Tags({ token }: TagsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users and fetch tags
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && token) {
      setLoading(true);
      api
        .get("/tags", "", token)
        .then((tags: Tag[]) => setData(tags))
        .catch((err) => {
          console.error("Failed to fetch tags:", err);
          setData([]);
        })
        .finally(() => setLoading(false));
    }
  }, [status, router, token]);

  console.log("TagIndex session:", session);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg animate-pulse">Loading tags...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p>No Tags Found</p>;
  }

  // Split tags into 3 columns
  const rowsPerColumn = Math.ceil(data.length / 3);
  const columnOneData = _.take(data, rowsPerColumn);
  const columnTwoData = _.takeRight(
    _.take(data, rowsPerColumn * 2),
    rowsPerColumn
  );
  const columnThreeData = _.takeRight(data, data.length - rowsPerColumn * 2);

  return (
    <div>
      <div className="text-xl font-bold text-sky-900 pb-4 flex items-center">
        <TagIcon className="h-6 w-6 mr-2" />
        Tags
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[columnOneData, columnTwoData, columnThreeData].map(
          (column, colIndex) => (
            <div key={colIndex}>
              {column.map((tag, i) => (
                <Link
                  key={`${colIndex}-${i}`}
                  href={`/tag/${tag.name}`}
                  className="block pb-2 hover:text-sky-700 transition"
                >
                  {tag.name.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

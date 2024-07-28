// @ts-nocheck
import * as _ from "lodash";
import Link from "next/link";
import api from "@/library/api";
import { useState, useEffect } from "react";

import { useAppDispatch } from "@/hooks";

function Author({ token }: { token: string | undefined }) {
  const dispatch = useAppDispatch();
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const userToken = token;

  useEffect(() => {
    setLoading(true);
    api.get("/illustration/authors", "", userToken).then((authors) => {
      setData(authors);
      setLoading(false);
    });
  }, [userToken]);

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No Authors Found</p>;

  let rows_per_column = Math.ceil(data.length / 3);
  let columnOneData = _.take(data, rows_per_column);
  let columnTwoData = _.takeRight(
    _.take(data, rows_per_column * 2),
    rows_per_column
  );
  let columnThreeData = _.takeRight(data, data.length - rows_per_column * 2);
  return (
    <>
      <div className="text-xl font-bold text-sky-900 pb-4">Authors</div>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div>
          {columnOneData.map((author, i) => (
            <Link
              key={`one-${i}`}
              className="block pb-2"
              href={`/author/${author.author}`}
            >
              {author.author.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
        <div>
          {columnTwoData.map((author, i) => (
            <Link
              key={`two-${i}`}
              className="block pb-2"
              href={`/author/${author.author}`}
            >
              {author.author.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
        <div>
          {columnThreeData.map((author, i) => (
            <Link
              key={`three-${i}`}
              className="block pb-2"
              href={`/author/${author.author}`}
            >
              {author.author.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default Author;

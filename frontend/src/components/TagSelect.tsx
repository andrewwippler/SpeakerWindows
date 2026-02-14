import { useAppSelector, useAppDispatch } from "@/hooks";
import api from "@/library/api";
import { useState, useEffect, ChangeEvent, useRef, KeyboardEvent } from "react";
import { tagType } from "@/library/tagtype";
import { getTags, setTags, addTag, removeTag } from "@/features/tags/reducer";
import { XMarkIcon } from "@heroicons/react/24/solid";
import _ from "lodash";

export default function TagSelect({
  defaultValue,
  token,
}: {
  defaultValue: string | tagType[];
  token: string | undefined;
}) {
  const dispatch = useAppDispatch();

  const [tags, setLocalTags] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [showAutoComplete, show] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const illustrationTags = useAppSelector(getTags);
  const inputRef = useRef<HTMLInputElement>(null);
  const inheritedTags = defaultValue;
  const userToken = token;

  useEffect(() => {
    setLoading(true);
    api.get("/tags", "", userToken).then((tags) => {
      setLocalTags(tags);
      dispatch(setTags(inheritedTags));
      setLoading(false);
    });
  }, [dispatch, inheritedTags, userToken]);

  const search = (event: ChangeEvent<HTMLInputElement>) => {
    let _filteredTags;

    //show if 2 or more characters
    if (event.target.value.trim().length > 2) {
      show(true);
    }

    if (!event.target.value.trim().length) {
      _filteredTags = [...tags];
    } else {
      _filteredTags = tags.filter((tag: tagType) => {
        return tag.name
          .toLowerCase()
          .startsWith(event.target.value.toLowerCase());
      });
    }
    setFilteredTags(_filteredTags);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ",") {
      event.preventDefault();
      if (inputRef.current && inputRef.current.value != "") {
        handleTagAdd(inputRef.current.value);
      }
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (inputRef.current) {
        handleTagAdd(inputRef.current.value);
      }
    }
    if (event.key === "Tab") {
      // so then no tabbing to content? :(
      event.preventDefault();
      if (inputRef.current && filteredTags && filteredTags.length > 0) {
        // @ts-ignore
        handleTagAdd(filteredTags[0].name);
      }
    }
  };

  const handleTagAutoCompleteClicked = (event: any): void => {
    handleTagAdd(event.target.innerText);
  };

  const handleTagRemove = (name: string) => {
    dispatch(removeTag(name.trim()));
  };

  const handleTagAdd = (name: string) => {
    show(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    dispatch(addTag({ name: _.startCase(name) }));
  };

  if (isLoading) return <p>Loading Tags...</p>;

  return (
    <>
      <div className="content-center text-sm flex flex-wrap mt-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6">
        {illustrationTags &&
          illustrationTags.map((tag, index) => {
            return (
              <div key={index} className="group">
                <div className="group-hover:text-white group-hover:bg-sky-900 inline-flex items-center px-2 py-1 ml-2 my-1 text-sm font-medium text-sky-800 bg-sky-200 rounded">
                  {tag.name}
                  <XMarkIcon
                    onClick={(e) => handleTagRemove(tag.name)}
                    className="group-hover:text-white group-hover:bg-sky-900 ml-1 w-3.5 h-3.5 bg-sky-200"
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        <input
          name="tags"
          placeholder="Add New Tag..."
          className="ml-1 px-2 text-sky-900 border-0 focus:ring-2 ring-inset focus:ring-inset focus:ring-indigo-600"
          autoComplete="off"
          onChange={(e) => search(e)}
          onKeyDown={(e) => handleKeyPress(e)}
          ref={inputRef}
        />
      </div>
      {showAutoComplete &&
        filteredTags.map((tag: tagType, index) => {
          return (
            <div
              key={tag.name + index}
              className="bg-sky-300 p-2 m-1 text-white rounded-md z-10"
              onClick={(e) => handleTagAutoCompleteClicked(e)}
            >
              {tag.name}
            </div>
          );
        })}
    </>
  );
}

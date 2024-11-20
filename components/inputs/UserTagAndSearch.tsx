"use client";

import React, { useState, FocusEvent, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/AuthProvider";
import { TPeopleTagSearch } from "@/types/utils.types";
import UserProfileImg from "../others/UserProfileImg";
import { CiSearch } from "react-icons/ci";
import { searchPeopleTag } from "@/actions/search.action";

function UserTagAndSearch({
  isTag,
  isCreditTag,
}: {
  isTag: boolean;
  isCreditTag?: boolean;
}) {
  const { user } = useUserContext();
  const [typingVal, setTypingVal] = useState("");
  const [resultsList, setResultsList] = useState<TPeopleTagSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  async function handleSearch(filter: string) {
    setTypingVal(filter);
    if (!user) return null;
    const response = await searchPeopleTag(user.currentUserId, filter, 1, 5);
    if (response.status === "7400") {
      setResultsList(response.response);
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (typingVal) {
        handleSearch(typingVal);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingVal]);

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    // Delay hiding results to allow clicking on the results
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }

  function handleClick() {}

  return (
    <div
      className={`${isTag ? "w-full" : "w-[22rem]"} relative flex flex-col gap-1`}
    >
      {!isTag && (
        <CiSearch className="absolute left-2 top-2 text-2xl text-light-500/80" />
      )}
      <Input
        value={typingVal}
        onChange={(e) => setTypingVal(e.target.value)}
        placeholder={`${isTag ? (isCreditTag ? "Tag people for credit" : "Tag people here") : "Search for users"}`}
        className={`${isTag ? "shad-form-input w-full" : "shad-nav-search-input"}`}
        onFocus={(e) => handleFocus(e)}
        onBlur={(e) => handleBlur(e)}
      />

      {isFocused && typingVal && resultsList?.length > 0 && (
        <div className="absolute left-0 top-10 flex max-h-96 w-full flex-col gap-0 overflow-y-scroll rounded-[10px] bg-dark-250/90 py-1 shadow-md backdrop-blur-md">
          {resultsList.map((item, index) => {
            return (
              <React.Fragment key={index}>
                {isTag ? (
                  <div
                    className="flex w-full items-center gap-3 p-2 px-3 text-light-500 hover:bg-dark-300 hover:text-light-800"
                    onClick={handleClick}
                  >
                    <UserProfileImg
                      userName={item.personalInfo.firstName}
                      src={item.personalInfo.profileImage}
                      className="size-9 min-h-9 min-w-9 rounded-full"
                    />
                    <p className="flex gap-1 text-sm">
                      {item.personalInfo.firstName} {item.personalInfo.lastName}
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/profile/${item.personalInfo.firstName}/${item._id}`}
                    className="flex items-center gap-3 p-2 px-3 text-light-500 hover:bg-dark-300 hover:text-light-800"
                  >
                    <UserProfileImg
                      userName={item.personalInfo.firstName}
                      src={item.personalInfo.profileImage}
                      className="size-9 min-h-9 min-w-9 rounded-full"
                    />
                    <p className="flex gap-1 text-sm">
                      {item.personalInfo.firstName} {item.personalInfo.lastName}
                    </p>
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserTagAndSearch;

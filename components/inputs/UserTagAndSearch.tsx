"use client";

import React, { useState, FocusEvent, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/AuthProvider";
import { TPeopleTagSearch } from "@/types/utils.types";
import UserProfileImg from "../others/UserProfileImg";
import { CiSearch } from "react-icons/ci";
import { searchPeopleTag } from "@/actions/search.action";
import { MdClose } from "react-icons/md";

function UserTagAndSearch({
  isTag,
  isCreditTag,
  fieldChange,
  values,
}: {
  isTag: boolean;
  isCreditTag?: boolean;
  fieldChange?: any;
  values?: any;
}) {
  const { user } = useUserContext();
  const [typingVal, setTypingVal] = useState("");
  const [resultsList, setResultsList] = useState<TPeopleTagSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState(values || []);

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

  function handleClick(item: TPeopleTagSearch) {
    console.log(item, taggedUsers);
    const newTagUser = {
      _id: item._id,
      firstName: item.personalInfo.firstName,
      lastName: item.personalInfo.lastName,
      profileImage: item.personalInfo.profileImage,
    };
    if (isCreditTag) {
      fieldChange?.(newTagUser);
    } else {
      fieldChange?.([...taggedUsers, newTagUser]);
      setTaggedUsers([...taggedUsers, newTagUser]);
    }
    setTypingVal("");
    setResultsList([]);
  }

  function handleCreditsDelete(index: number) {
    const newTaggedUsers = [...taggedUsers];
    newTaggedUsers.splice(index, 1);
    fieldChange?.({ peopleTag: newTaggedUsers });
    setTaggedUsers(newTaggedUsers);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full gap-2">
        {isTag && (
          <div className="flex w-full flex-wrap gap-1">
            {taggedUsers.length > 0 &&
              taggedUsers?.map((user: any, index: number) => (
                <div
                  key={index}
                  className="flex w-max items-center justify-between gap-4 rounded-full bg-dark-400 p-2 text-sm text-light-500"
                >
                  <div className="flex items-center gap-2">
                    <UserProfileImg
                      userName={user.firstName}
                      src={user.profileImage}
                      className="size-6 min-h-6 min-w-6 rounded-full"
                    />
                    <p>
                      {user.firstName}&nbsp;{user.lastName}
                    </p>
                  </div>
                  <span className="cursor-pointer text-light-500 hover:text-light-900">
                    <MdClose onClick={() => handleCreditsDelete(index)} />
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

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
                      className="flex w-full cursor-pointer items-center gap-3 p-2 px-3 text-light-500 hover:bg-dark-300 hover:text-light-800"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleClick(item)}
                    >
                      <UserProfileImg
                        userName={item.personalInfo.firstName}
                        src={item.personalInfo.profileImage}
                        className="size-9 min-h-9 min-w-9 rounded-full"
                      />
                      <p className="flex gap-1 text-sm">
                        {item.personalInfo.firstName}{" "}
                        {item.personalInfo.lastName}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={`/profile/${item.personalInfo.firstName}/${item._id}`}
                      className="flex items-center gap-3 p-2 px-3 text-light-500 hover:bg-dark-300 hover:text-light-800"
                      onClick={() => setTypingVal("")}
                    >
                      <UserProfileImg
                        userName={item.personalInfo.firstName}
                        src={item.personalInfo.profileImage}
                        className="size-9 min-h-9 min-w-9 rounded-full"
                      />
                      <p className="flex gap-1 text-sm">
                        {item.personalInfo.firstName}{" "}
                        {item.personalInfo.lastName}
                      </p>
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTagAndSearch;

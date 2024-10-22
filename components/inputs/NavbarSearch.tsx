"use client";

import { ChangeEvent, useState, FocusEvent } from "react";
import Link from "next/link";
import { searchPeopleTag } from "@/actions/utils.action";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/AuthProvider";
import { TPeopleTagSearch } from "@/types/utils.types";
import UserProfileImg from "../others/UserProfileImg";
import { CiSearch } from "react-icons/ci";

function NavbarSearch() {
  const { user } = useUserContext();
  const [typingVal, setTypingVal] = useState("");
  const [resultsList, setResultsList] = useState<TPeopleTagSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  async function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    const filter = e.target.value;
    setTypingVal(filter);
    if (!user) return null;
    const response = await searchPeopleTag(user.currentUserId, filter, 1, 5);
    if (response.status === "7400") {
      setResultsList(response.response);
    }
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    // Delay hiding results to allow clicking on the results
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }

  return (
    <div className="relative flex w-[22rem] flex-col gap-1">
      <CiSearch className="absolute left-2 top-2 text-2xl text-light-500/80" />
      <Input
        value={typingVal}
        onChange={(e) => handleSearch(e)}
        placeholder="Search for people"
        className="shad-nav-search-input"
        onFocus={(e) => handleFocus(e)}
        onBlur={(e) => handleBlur(e)}
      />

      {isFocused && typingVal && resultsList?.length > 0 && (
        <div className="absolute left-0 top-10 flex max-h-96 w-full flex-col gap-0 overflow-y-scroll rounded-[10px] bg-dark-250/90 py-1 shadow-md backdrop-blur-md">
          {resultsList.map((item, index) => (
            <Link
              key={index}
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
          ))}
        </div>
      )}
    </div>
  );
}

export default NavbarSearch;

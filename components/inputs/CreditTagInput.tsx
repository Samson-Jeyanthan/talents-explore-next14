"use client";

import { useState } from "react";
import { ToolTip } from "../others";
import { Input } from "../ui/input";
import UserTagAndSearch from "./UserTagAndSearch";
import { MdClose } from "react-icons/md";
import UserProfileImg from "../others/UserProfileImg";

type ITaggedUser = {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage: string;
};

const CreditTagInput = ({
  fieldChange,
  values,
}: {
  fieldChange: any;
  values: any;
}) => {
  const [creditTag, setCreditTag] = useState({
    creditTitle: "",
    peopleTag: [],
  });
  const [taggedUsers, setTaggedUsers] = useState<ITaggedUser[]>([]);
  const [addedCredits, setAddedCredits] = useState(values || []);

  const handleSelectUserClick = ({
    _id,
    firstName,
    lastName,
    profileImage,
  }: any) => {
    const newTaggedUser = {
      _id,
      firstName,
      lastName,
      profileImage,
    };
    setTaggedUsers([...taggedUsers, newTaggedUser]);
  };

  const handleOkClick = () => {
    const newAddedCredit = {
      creditTitle: creditTag.creditTitle,
      peopleTag: taggedUsers,
    };
    fieldChange([...addedCredits, newAddedCredit]);
    setAddedCredits([...addedCredits, newAddedCredit]);
    setCreditTag({ creditTitle: "", peopleTag: [] });
    setTaggedUsers([]);
  };

  const handleCreditsDelete = (index: number) => {
    const updatedCredits = addedCredits.filter(
      (_credit: any, i: number) => i !== index
    );
    fieldChange(updatedCredits);
    setAddedCredits(updatedCredits);
  };

  return (
    <div className="flex flex-col gap-2">
      <ToolTip
        title="Credit Info"
        description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
      />
      {/* Display added credits with title and tagged users  */}

      <div className="flex w-full gap-2">
        {addedCredits.length > 0 &&
          addedCredits?.map((credit: any, index: number) => (
            <div
              key={index}
              className="flex w-1/2 flex-col items-center justify-between gap-4 rounded-md bg-dark-400 p-4 text-sm text-light-500"
            >
              <div className="flex w-full justify-between font-medium text-light-900">
                {credit.creditTitle}

                <MdClose
                  onClick={() => handleCreditsDelete(index)}
                  className="size-4 cursor-pointer text-light-500 hover:text-light-900"
                />
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                {credit.peopleTag.length > 0 &&
                  credit.peopleTag?.map((user: any, index: number) => (
                    <div className="flex items-center gap-2" key={index}>
                      <UserProfileImg
                        userName={user.firstName}
                        src={user.profileImage}
                        className="size-6 min-h-6 min-w-6 rounded-full"
                      />
                      <p>
                        {user.firstName}&nbsp;{user.lastName}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
      <Input
        value={creditTag.creditTitle}
        onChange={(e) => {
          setCreditTag({
            ...creditTag,
            creditTitle: e.target.value,
          });
        }}
        placeholder="Credit Title (eg. Singer, DOP, Editor)"
        className="shad-auth_form_input"
      />

      {/* Display tagged users for the current typed credit */}
      {taggedUsers?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {taggedUsers?.map((user: any, index: number) => (
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
      <UserTagAndSearch
        isTag={true}
        isCreditTag={true}
        fieldChange={handleSelectUserClick}
      />
      <footer className="flex w-full justify-end ">
        <div className="teritory-button" onClick={handleOkClick}>
          OK
        </div>
      </footer>
    </div>
  );
};

export default CreditTagInput;

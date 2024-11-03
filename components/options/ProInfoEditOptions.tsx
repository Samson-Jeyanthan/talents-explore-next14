"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  IAwardsOrCertificate,
  IEducation,
  ILanguage,
} from "@/types/profile.types";
import { useState } from "react";
import { HiOutlinePencil } from "react-icons/hi2";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ProInfoDeleteAlert } from "../alerts";
import { useUserContext } from "@/context/AuthProvider";
import { useParams } from "next/navigation";

type Props = {
  id: string;
  cardName: "award" | "education" | "language";
  data?: IEducation[] | ILanguage[] | IAwardsOrCertificate[];
};

const ProInfoEditOptions = ({ id, cardName, data }: Props) => {
  const { user } = useUserContext();
  const params = useParams<{ username: string; userId: string }>();
  const isOwnProfile = user.currentUserId === params.userId;
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  return (
    <>
      {isOwnProfile && (
        <Menubar className="relative m-0 size-min border-none p-0">
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer bg-transparent bg-none text-sm text-light-500 hover:text-light-900">
              <HiOutlinePencil />
            </MenubarTrigger>
            <MenubarContent className="absolute -right-5 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
              <MenubarItem
                className="menubar-options-item"
                onClick={() => setIsEdit(true)}
              >
                <MdModeEdit />
                <p className="text-xs">Edit</p>
              </MenubarItem>
              <MenubarItem
                className="menubar-options-item !text-custom-200"
                onClick={() => setIsDelete(true)}
              >
                <MdDelete />
                <p className="text-xs">Delete</p>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )}

      {isDelete && (
        <ProInfoDeleteAlert
          isOpen={isDelete}
          modalFor={cardName}
          onCancel={() => setIsDelete(false)}
        />
      )}

      {isEdit && <p>Edit details</p>}
    </>
  );
};

export default ProInfoEditOptions;

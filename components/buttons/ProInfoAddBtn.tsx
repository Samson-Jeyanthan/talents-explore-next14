"use client";

import { useState } from "react";
import { ProDetailsModal } from "../modals";
import { Dialog } from "../ui/dialog";
import { TProfessionalDetailName } from "@/types/utils.types";
import { IEducation } from "@/types/profile.types";
import { useUserContext } from "@/context/AuthProvider";
import { useParams } from "next/navigation";

type Prop = {
  detailName: TProfessionalDetailName;
  dataArray: IEducation[] | any[];
};

const ProInfoAddBtn = ({ detailName, dataArray }: Prop) => {
  const [open, setOpen] = useState(false);
  const { user } = useUserContext();
  const params = useParams<{ username: string; userId: string }>();
  const isOwnProfile = user.currentUserId === params.userId;

  return (
    <>
      {isOwnProfile && (
        <p
          className="cursor-pointer text-xs text-custom-100"
          onClick={() => setOpen(!open)}
        >
          + ADD
        </p>
      )}

      <Dialog open={open}>
        <ProDetailsModal
          isEdit={false}
          detailModalFor={detailName}
          onClick={() => setOpen(!open)}
          dataArray={dataArray}
          selectedIndex={dataArray.length}
        />
      </Dialog>
    </>
  );
};

export default ProInfoAddBtn;

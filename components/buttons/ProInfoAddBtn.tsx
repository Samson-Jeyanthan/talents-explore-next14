"use client";

import { useState } from "react";
import { ProDetailsModal } from "../modals";
import { Dialog } from "../ui/dialog";
import { TProfessionalDetailName } from "@/types/utils.types";
import { IEducation } from "@/types/profile.types";

type Prop = {
  detailName: TProfessionalDetailName;
  dataArray: IEducation[] | any[];
};

const ProInfoAddBtn = ({ detailName, dataArray }: Prop) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p
        className="cursor-pointer text-xs text-custom-100"
        onClick={() => setOpen(!open)}
      >
        + ADD
      </p>

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

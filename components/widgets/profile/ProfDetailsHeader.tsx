"use client";

import { useState } from "react";
import { ProDetailsModal } from "../../modals";
import { Dialog } from "../../ui/dialog";
import { TProfessionalDetailName } from "@/types/utils.types";
import { IEducation } from "@/types/profile.types";

type Prop = {
  detailName: TProfessionalDetailName;
  dataArray: IEducation[] | any[];
};

const ProfDetailsHeader = ({ detailName, dataArray }: Prop) => {
  const [open, setOpen] = useState(false);

  const getTitle = () => {
    switch (detailName) {
      case "education":
        return "Education";
      case "award":
        return "Awards and Certificates";
      case "language":
        return "Known Languages";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="flex w-full items-center justify-between rounded-full border border-solid border-dark-300 bg-dark-250 px-2 py-[6px]">
        <h1 className="flex items-center gap-2 text-sm text-light-900">
          <span className="rounded-full bg-dark-400 p-[10px]" />
          {getTitle()}
        </h1>
        <p
          className="cursor-pointer pr-2 text-xs text-custom-100"
          onClick={() => setOpen(!open)}
        >
          + ADD
        </p>
      </div>

      <Dialog open={open}>
        <ProDetailsModal
          isEdit={false}
          detailModalFor={detailName}
          onClick={() => setOpen(!open)}
          dataArray={dataArray}
          selectedIndex={0}
        />
      </Dialog>
    </>
  );
};

export default ProfDetailsHeader;

"use client";

import { HiOutlinePencil } from "react-icons/hi2";

const ProfessionInfoBtn = () => {
  return (
    <div className="absolute right-3 top-3 cursor-pointer text-sm text-light-500 hover:text-light-900">
      <HiOutlinePencil />
    </div>
  );
};

export default ProfessionInfoBtn;

// import { fetchUserDataAction } from "@/actions/user.action";
import React from "react";
import { ProfileURLProps } from "../layout";

async function Overview({ params }: ProfileURLProps) {
  // const res = await fetchUserDataAction(params.userId, params.username);
  return (
    <section className="mt-5 w-full text-center text-light-900">
      {/* {res?.response?.personalInfo?.firstName} */}
      overview
    </section>
  );
}

export default Overview;

import React from "react";
import { ProfileURLProps } from "../layout";
import { userSkillsInfoAction } from "@/actions/user.action";
import AlertNote from "@/components/others/AlertNote";

async function Skills({ params }: ProfileURLProps) {
  const data = await userSkillsInfoAction(params.userId);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return (
    <section className="my-8 grid w-full grid-cols-1 justify-end gap-8 md:grid-cols-2">
      {data.length > 0 ? data : <p className="text-light-900">NO DATA FOUND</p>}
    </section>
  );
}

export default Skills;

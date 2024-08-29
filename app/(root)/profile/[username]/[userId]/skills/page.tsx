import React from "react";
import { ProfileURLProps } from "../layout";
import { userSkillsInfoAction } from "@/actions/user.action";

async function Skills({ params }: ProfileURLProps) {
  const data = await userSkillsInfoAction(params.userId);
  return (
    <section className="my-8 grid w-full grid-cols-1 justify-end gap-8 md:grid-cols-2">
      {data}
    </section>
  );
}

export default Skills;

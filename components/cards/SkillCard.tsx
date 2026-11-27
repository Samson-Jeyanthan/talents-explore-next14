import LinkedText from "@/components/others/LinkedText";
import type { ReactNode } from "react";
import type { ProfileSkill } from "@/lib/utils/profile-skills";
import { MotionDiv } from "../others/MotionDiv";
import { MdSportsVolleyball } from "react-icons/md";

interface Prop {
  userSkillCard: ProfileSkill;
  index: number;
  actions?: ReactNode;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function SkillCard({ userSkillCard, index, actions }: Prop) {
  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="flex w-full flex-col gap-2 rounded-[28px] border-2 border-dark-300 bg-dark-250 p-2 pb-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dark-300 pb-2">
        <h1 className="flex min-w-0 items-center gap-3 text-base text-light-900 [overflow-wrap:anywhere]">
          <span className="shrink-0 rounded-full border-2 border-dark-300 bg-dark-200 p-2 ">
            <MdSportsVolleyball className="text-lg" />
          </span>
          {userSkillCard.mainCategoryName}
        </h1>
        {actions}
      </div>
      <p className="text-sm text-light-900">{userSkillCard.subCategoryName}</p>
      <div className="flex flex-col gap-1">
        {userSkillCard.skillsHave.map((skill) => (
          <p key={skill.skillId} className="text-xs text-light-500">
            {skill.skillName} - {skill.level}
          </p>
        ))}
      </div>
      <p className="-mb-1 mt-1 text-xs text-light-900">Description</p>
      <p className="whitespace-pre-wrap text-justify text-xs text-light-500 [overflow-wrap:anywhere]">
        <LinkedText text={userSkillCard.description} />
      </p>
      {userSkillCard.hashTags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {userSkillCard.hashTags.map((tag, index) => (
            <span
              key={`${tag}:${index}`}
              className="rounded-full bg-dark-300 px-2 py-1 text-xs text-light-700 [overflow-wrap:anywhere]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </MotionDiv>
  );
}

export default SkillCard;

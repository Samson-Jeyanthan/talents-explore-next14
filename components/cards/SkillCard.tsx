import { IProfileSkills } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import { MdSportsVolleyball } from "react-icons/md";

interface Prop {
  userSkillCard: IProfileSkills;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function SkillCard({ userSkillCard, index }: Prop) {
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
      <div className="border-b-2 border-dark-300 pb-2">
        <h1 className="flex items-center gap-3 text-base text-light-900">
          <span className="rounded-full border-2 border-dark-300 bg-dark-200 p-2 ">
            <MdSportsVolleyball className="text-lg" />
          </span>
          {userSkillCard.mainCategoryName}
        </h1>
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
      <p className="text-justify text-xs text-light-500">
        {userSkillCard.description}
      </p>
    </MotionDiv>
  );
}

export default SkillCard;

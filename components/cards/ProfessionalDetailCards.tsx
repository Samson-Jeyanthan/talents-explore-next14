import {
  IEducation,
  ILanguage,
  IAwardsOrCertificate,
} from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import { ProfessionInfoEditBtn } from "../buttons";

interface EProp {
  userEducationCard: IEducation;
  index: number;
  length: number;
}

interface LProp {
  userLangCard: ILanguage;
  index: number;
  length: number;
}

interface AProp {
  userAwardCard: IAwardsOrCertificate;
  index: number;
  length: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const EducationCard = ({ userEducationCard, index, length }: EProp) => {
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
      className={`${index < length - 1 ? "border-b-2 border-dark-400" : ""} professional-info-card`}
    >
      <h1 className="max-w-[85%] text-sm text-light-900">
        {userEducationCard.course}
      </h1>
      <h2 className="text-sm text-light-500">
        {userEducationCard.institution}
      </h2>
      <div className="flex items-center gap-2 text-xs text-light-500">
        <p>{userEducationCard.from}</p>
        <p>-</p>
        <p>{userEducationCard.to}</p>
      </div>
      <ProfessionInfoEditBtn />
    </MotionDiv>
  );
};

export const LanguageCard = ({ userLangCard, index, length }: LProp) => {
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
      className={`${index < length - 1 ? "border-b-2 border-dark-400" : ""}  professional-info-card`}
    >
      <h1 className="max-w-[85%] text-sm text-light-900">
        {userLangCard.languageName}
      </h1>
      <p className="text-xs text-light-500">{userLangCard.level}</p>
      <ProfessionInfoEditBtn />
    </MotionDiv>
  );
};

export const AwardCard = ({ userAwardCard, index, length }: AProp) => {
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
      className={`${index < length - 1 ? "border-b-2 border-dark-400" : ""} 
      professional-info-card`}
    >
      <h1 className="max-w-[85%] text-sm text-light-900">
        {userAwardCard.name}
      </h1>
      <p className="text-xs text-light-500">{userAwardCard.givenBy}</p>
      <p className="text-xs text-light-500">{userAwardCard.year}</p>
      <ProfessionInfoEditBtn />
    </MotionDiv>
  );
};

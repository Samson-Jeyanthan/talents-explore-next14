import { ILanguage } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";

interface Prop {
  userLangCard: ILanguage;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const LanguageCard = ({ userLangCard, index }: Prop) => {
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
      <h1>{userLangCard.languageName}</h1>
      <p>{userLangCard.level}</p>
    </MotionDiv>
  );
};

export default LanguageCard;

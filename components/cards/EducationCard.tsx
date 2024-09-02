import { IEducation } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";

interface Prop {
  userEducationCard: IEducation;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
function EducationCard({ userEducationCard, index }: Prop) {
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
      <h1>{userEducationCard.course}</h1>
      <p>{userEducationCard.institution}</p>
      <p>{userEducationCard.from}</p>
      <p>{userEducationCard.to}</p>
    </MotionDiv>
  );
}

export default EducationCard;

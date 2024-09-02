import { IAwardsOrCertificate } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";

interface Prop {
  userAwardCard: IAwardsOrCertificate;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function AwardCard({ userAwardCard, index }: Prop) {
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
      <h1>{userAwardCard.name}</h1>
      <p>{userAwardCard.givenBy}</p>
      <p>{userAwardCard.year}</p>
    </MotionDiv>
  );
}

export default AwardCard;

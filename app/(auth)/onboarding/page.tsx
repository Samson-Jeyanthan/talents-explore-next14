"use client";

import { Button } from "@/components/ui/button";
import { FaArrowRightLong, FaArrowLeftLong } from "react-icons/fa6";
import { motion as m } from "framer-motion";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import {
  AccountSelection,
  Community,
  Profile,
  Promotion,
  UnlockFeature,
  Welcome,
} from "@/components/widgets";

const Onboarding = () => {
  const { step, isFirstStep, isLastStep, back, next, skipToLastStep } =
    useOnboarding([
      <Welcome key="0" />,
      <Community key="1" />,
      <Profile key="2" />,
      <Promotion key="3" />,
      <UnlockFeature key="4" />,
      <AccountSelection key="5" />,
    ]);

  return (
    <div className="flex-center relative max-h-screen min-h-screen w-full overflow-hidden">
      {!isLastStep && (
        <p
          className="absolute right-10 top-10 z-10 cursor-pointer text-sm text-light-600 hover:text-light-900"
          onClick={() => skipToLastStep()}
        >
          Skip
        </p>
      )}
      {step}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
        className="flex-center absolute bottom-20 z-20 gap-4"
      >
        {!isFirstStep && (
          <Button className="shad-button_back_round" onClick={back}>
            <FaArrowLeftLong />
          </Button>
        )}

        {!isLastStep && (
          <Button className="shad-button_primary_round" onClick={next}>
            <FaArrowRightLong />
          </Button>
        )}
      </m.div>
    </div>
  );
};

export default Onboarding;

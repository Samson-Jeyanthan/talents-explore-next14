import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { AtomicIcon, AwardsIcon, GraduationIcon } from "@/public/assets/svgs";
import { CheckIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const CompleteForm = ({ form }: any) => {
  const TalentForms = [
    {
      title: "More Info",
      icon: <UserIcon />,
    },
    {
      title: "Skills",
      icon: <AtomicIcon />,
    },
    {
      title: "Education",
      icon: <GraduationIcon />,
    },
    {
      title: "Awards",
      icon: <AwardsIcon />,
    },
  ];

  return (
    <form className="mt-6 flex min-h-[90%] w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center gap-4">
        <Image
          src="/assets/images/complete-te-form-img.png"
          width={320}
          height={320}
          alt="complete-form-img"
        />
        <h1 className="text-2xl font-semibold text-white">
          You&apos;re Almost Done!
        </h1>
        <p className="text-white">
          Confirm your details and create your talent profile to join the
          Talents Explore Community.
        </p>
      </div>

      <div className="flex gap-4">
        {TalentForms.map((item, index) => (
          <div
            key={index}
            className="flex min-w-52 items-center justify-between gap-2 rounded-lg border border-dark-400 bg-dark-300 px-3 py-2"
          >
            <div className="flex-center gap-2">
              <span className="flex-center !size-10 min-w-10 rounded-full border border-light-500 fill-light-500 p-1 text-light-500">
                {item.icon}
              </span>
              <p className="w-max text-center text-base text-light-850">
                {item.title}
              </p>
            </div>
            <span className="flex-center size-8 min-w-8 rounded-full border border-red-600">
              <CheckIcon className="size-4 text-sm text-white" />
            </span>
          </div>
        ))}
      </div>

      <FormField
        control={form.control}
        name="completeForm"
        render={({ field }) => {
          return (
            <FormItem className="flex-center gap-2 rounded-lg border border-dark-400 bg-dark-300 px-4 py-3">
              <FormControl>
                <Checkbox
                  className="size-10 rounded border-none bg-blue-950 fill-light-900 text-light-900"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked && true);
                  }}
                />
              </FormControl>
              <FormLabel className="shad-auth_form_label pb-1">
                I confirm that the information provided is accurate, and I agree
                to the{" "}
                <Link href="/terms-and-conditions" className="underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="underline">
                  Privacy Policy
                </Link>{" "}
                to create my talent profile.
              </FormLabel>
            </FormItem>
          );
        }}
      />
      <label htmlFor="agree" className="text-sm text-light-850"></label>
    </form>
  );
};

export default CompleteForm;

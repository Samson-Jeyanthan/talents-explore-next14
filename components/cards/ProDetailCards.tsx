"use client";

import {
  certificateName,
  certificateUrl,
  type ProfileAward,
} from "@/lib/utils/profile-awards";

import { type ProfileEducation } from "@/lib/utils/profile-education";
import { ILanguage } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import { ProInfoEditOptions } from "../options";
interface EProp {
  data: ProfileEducation;
  index: number;
  length: number;
  dataArray?: ProfileEducation[];
}

interface LProp {
  data: ILanguage;
  index: number;
  length: number;
  dataArray?: ILanguage[];
}

interface AProp {
  data: ProfileAward;
  index: number;
  length: number;
  dataArray?: ProfileAward[];
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const EducationCard = ({ data, index, length, dataArray }: EProp) => {
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
      <h1 className="max-w-[85%] text-[13px] text-light-900">{data.course}</h1>
      <h2 className="text-[13px] text-light-500">{data.institution}</h2>
      <div className="flex items-center gap-2 text-xs text-light-500">
        <p>{data.from}</p>
        <p>-</p>
        <p>
          {String(data.to).toLowerCase() === "present" ? "Present" : data.to}
        </p>
      </div>
      <div className="pro-info-options-wrap">
        <ProInfoEditOptions
          cardName="education"
          selectedIndex={index}
          data={data}
          dataArray={dataArray}
        />
      </div>
    </MotionDiv>
  );
};

export const LanguageCard = ({ index, length, data, dataArray }: LProp) => {
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
      <h1 className="max-w-[85%] text-[13px] text-light-900">
        {data.languageName}
      </h1>
      <p className="text-xs text-light-500">{data.level}</p>
      <div className="pro-info-options-wrap">
        <ProInfoEditOptions
          cardName="language"
          selectedIndex={index}
          data={data}
          dataArray={dataArray}
        />
      </div>
    </MotionDiv>
  );
};

export const AwardCard = ({ data, index, length, dataArray }: AProp) => {
  const url = certificateUrl(data);
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
      <h1 className="max-w-[85%] text-[13px] text-light-900">{data.name}</h1>
      <p className="text-xs text-light-500">{data.givenBy}</p>
      <p className="text-xs text-light-500">{data.year}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-words text-sm text-primary-500 underline"
          aria-label={`Open certificate for ${data.name}`}
        >
          Open certificate{" "}
          <span className="text-xs">({certificateName(data)})</span>
        </a>
      ) : (
        <p className="text-xs text-light-600">No certificate attached.</p>
      )}
      <div className="pro-info-options-wrap">
        <ProInfoEditOptions
          cardName="award"
          selectedIndex={index}
          data={data}
          dataArray={dataArray}
        />
      </div>
    </MotionDiv>
  );
};

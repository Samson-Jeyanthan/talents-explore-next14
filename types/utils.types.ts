import React, { ChangeEvent } from "react";

export type TConvertedSvgJsxProps = {
  height?: string;
  width?: string;
  fill?: string;
};

export type Media = {
  data: File | null;
  preview: string;
  fileType: string | null;
  fileName: string | null;
  mediaType?: string | null;
};

export type TCropImgModalProps = {
  modalFor: "cover" | "profile" | "post";
  media: Media;
  handleCropComplete: (media: any) => void;
};

export type TCoverProfilePhotoProps = {
  fieldChange: (FILES: File[]) => void;
  mediaUrl?: string;
};

export type TPhotoActionProps = {
  photoActionFor: "cover" | "profile";
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
};

export type TFetchDataArray = {
  _id: string;
  [key: string]: any;
};

export type TProfileURLProps = {
  params: { userId: string; username: string };
};

export type TProfessionalDetailName =
  | "education"
  | "award"
  | "language"
  | "educationEdit"
  | "awardEdit"
  | "languageEdit";

export type TErrorData = {
  status: number;
  message: string;
};

// types for search and explore

export type TPeopleTagSearch = {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    languageKnown: string;
    professional: string;
    profileImage: string | null;
    coverImage: string | null;
    shortBio: string;
  };
};
export interface ISearchParams {
  searchType: "ALL" | "FEED" | "SHARE" | "TALENT" | "CREDITS";
  userId: string;
  viewUserId?: string;
  pageNo: number;
  pageSize: number;
  searchText?: string;
  mainCategoryId?: string;
  subCategoryId?: string;
  skillId?: string;
  level?: string;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  publicRating?: string;
  privateRating?: string;
  keywords?: string[]; // Array of strings for keywords
  description?: string;
  country?: string;
  state?: string;
  creditTitle?: string;
  creditPeopleTag?: string;
  resultTime?: string;
  userRating?: number;
  userGender?: string;
  ethnic?: string;
  userLanguage?: string;
}
// userProfession?: string;

export interface ITab {
  title: string;
  value: string;
  content?: string | React.ReactNode | any;
  href: string;
}

export interface IMainCategoryProps {
  _id: string;
  name: string;
}

export interface IExploreTalentsProps {
  _id: string;
  userName: string;
  profileImage: string | null;
  avgRating: number;
  numberOfRating?: number;
  professional?: string;
}

export interface ISearchAllTalentsProps {
  userId: string;
  viewUserId?: string;
  pageNo: number;
  pageSize: number;
  searchText?: string;
  userRating?: number;
  userGender?: string;
  ethnic?: string;
  userLanguage?: string;
}

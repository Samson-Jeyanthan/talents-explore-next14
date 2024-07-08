import { ChangeEvent } from "react";

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
  mediaType: string | null;
};

export type TCropImgModalProps = {
  modalFor: "cover" | "profile" | "post";
  media: Media;
  handleCropComplete: (media: any) => void;
};

export type TCoverProfilePhotoProps = {
  fieldChange?: (FILES: File[]) => void;
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

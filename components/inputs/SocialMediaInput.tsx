"use client";

import React, { useEffect, useRef } from "react";
import { SOCIAL_MEDIA_OPTIONS } from "@/constants";
import { Input } from "../ui/input";
import { LinkIcon } from "@/public/assets/svgs";

type SocialLink = { type: string; url: string; show?: boolean };
interface Props {
  values?: SocialLink[];
  fieldChange: (links: SocialLink[]) => void;
  onDraftChange?: (pending: boolean) => void;
}
const OPTION_BY_TYPE = new Map(
  SOCIAL_MEDIA_OPTIONS.map((option) => [option.type, option]),
);
const LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

const LinkRow = ({
  type,
  url,
  onChange,
}: {
  type: string;
  url: string;
  onChange: (url: string) => void;
}) => {
  const Icon = OPTION_BY_TYPE.get(type)?.icon ?? LinkIcon;
  return (
    <div className="flex w-full items-center justify-start gap-4">
      <span className="social-link-icon" aria-hidden="true">
        <Icon height="20px" width="20px" />
      </span>
      <Input
        value={url}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${LABELS[type] || type} profile URL`}
        className="shad-auth_form_input"
        placeholder={`Add ${type} URL`}
      />
    </div>
  );
};

const SocialMediaInput = ({
  values = [],
  fieldChange,
  onDraftChange,
}: Props) => {
  const links = useRef(values);
  links.current = values;
  useEffect(() => {
    onDraftChange?.(false);
  }, [onDraftChange]);
  const setUrl = (type: string, url: string) => {
    const previous = links.current;
    // Preserve saved visibility and existing links when editing another field.
    const next = previous.some((link) => link.type === type)
      ? previous.map((link) => (link.type === type ? { ...link, url } : link))
      : [...previous, { type, url }];
    links.current = next;
    fieldChange(next);
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="shad-auth_form_label">Social Links</p>
      <div className="flex w-[70%] flex-col gap-3">
        {SOCIAL_MEDIA_OPTIONS.map((option) => (
          <LinkRow
            key={option.type}
            type={option.type}
            url={values.find((link) => link.type === option.type)?.url || ""}
            onChange={(url) => setUrl(option.type, url)}
          />
        ))}
        <p className="text-[13px] text-light-600">
          Add your Facebook, Instagram, and LinkedIn profile links.
        </p>
      </div>
    </div>
  );
};
export default SocialMediaInput;

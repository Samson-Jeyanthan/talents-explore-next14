"use client";

import { SOCIAL_MEDIA_OPTIONS } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { TConvertedSvgJsxProps } from "@/types/utils.types";
import { IconType } from "react-icons/lib";
import { LinkIcon } from "@/public/assets/svgs";

type TLink = {
  type: string;
  url: string;
  icon?: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  default?: boolean;
};

type SocialMediaLink = {
  type: string;
  url: string;
};

// function to add default links when its seen first
export const processLinks = (links: SocialMediaLink[]): TLink[] => {
  const alreadyEntered: Set<string> = new Set();
  return links.map((link) => {
    const isDefault =
      (link.type === "facebook" ||
        link.type === "instagram" ||
        link.type === "linkedin" ||
        link.type === "youtube") &&
      !alreadyEntered.has(link.type);

    if (isDefault) {
      alreadyEntered.add(link.type); // already entered
    }

    return { ...link, default: isDefault };
  });
};

const SocialMediaInput = ({ values, fieldChange }: any) => {
  console.log(values, "social-links");
  const processedLinks = processLinks(values);

  const [addedLinks, setAddedLinks] = useState<TLink[]>(
    processedLinks || [
      {
        url: "",
        type: "",
        icon: undefined,
        default: false,
      },
    ]
  );
  const [additionalLink, setAdditionalLink] = useState<TLink>({
    type: "",
    url: "",
    icon: undefined,
    default: false,
  });
  const [error, setError] = useState("");

  // handler for updating default link URLs
  const handleDefaultLinkChange = (type: string, url: string) => {
    const updated = addedLinks.map((link) =>
      link.type === type && link.default ? { ...link, url } : link
    );
    setAddedLinks(updated);
    fieldChange(updated);
  };

  const handleOkClick = () => {
    if (additionalLink.type === "" || additionalLink.url === "") {
      setError("Please fill all the fields");
    } else {
      setAddedLinks([...addedLinks, additionalLink]);
      setAdditionalLink({ icon: LinkIcon, type: "", url: "" });
      fieldChange([...addedLinks, additionalLink]);
    }
  };

  return (
    <div className="flex w-[70%] flex-col gap-3">
      {/* display default links */}
      {SOCIAL_MEDIA_OPTIONS.map((option, index) => {
        const matched = addedLinks.find(
          (link) => link.type === option.type && link.default
        );
        return (
          <React.Fragment key={index}>
            {option.default && (
              <div className="flex w-full items-center justify-start gap-4">
                <span className="social-link-icon">
                  <option.icon height="20px" width="20px" />
                </span>
                <Input
                  value={matched ? matched.url : ""}
                  onChange={(e) =>
                    handleDefaultLinkChange(option.type, e.target.value)
                  }
                  className="shad-auth_form_input"
                  placeholder={`Add ${option.type.toLowerCase()} URL`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
      {/* display added links
      {addedLinks.map((link, index) => {
        const Icon =
          SOCIAL_MEDIA_OPTIONS.find((option) => option.type === link.type)
            ?.icon || LinkIcon;
        return (
          <React.Fragment key={index}>
            {!link.default && (
              <div className="flex w-full items-center justify-start gap-4">
                <span className="social-link-icon">
                  <Icon height={"20px"} width={"20px"} />
                </span>
                <Input
                  value={link.url}
                  onChange={(e) => {
                    fieldChange(e.target.value, index);
                  }}
                  placeholder={`Add ${link.type.toLowerCase()} URL`}
                  className="shad-auth_form_input"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* additional links - which are not default */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Select
            onValueChange={(id: string) => {
              setAdditionalLink({
                ...additionalLink,
                type: id,
                icon:
                  SOCIAL_MEDIA_OPTIONS.find((option) => option.type === id)
                    ?.icon || LinkIcon,
              });
            }}
          >
            <SelectTrigger className="flex-between shad-auth_form_input !w-[45%]">
              {!additionalLink.type ? (
                <p className="flex w-full items-start text-light-500">
                  Choose link type
                </p>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent className="shad-auth_form_select_option">
              {SOCIAL_MEDIA_OPTIONS.map((option, index) => (
                <SelectItem
                  key={index}
                  value={String(option.type)}
                  className="shad-auth_form_select_item"
                >
                  <p className="first-letter:capitalize">{option.type}</p>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={additionalLink.url}
            onChange={(e) => {
              setAdditionalLink({
                ...additionalLink,
                url: e.target.value,
              });
            }}
            placeholder="Add related URL"
            className="shad-auth_form_input"
          />
        </div>

        {error && <p className="shad-auth_form_message">{error}</p>}

        {/* button to confirm additional links to add by user */}
        <footer className="flex justify-end">
          <div
            className="flex-center size-12 cursor-pointer gap-2 rounded-full border-none bg-dark-400 fill-light-900 text-[13px] text-light-900"
            onClick={handleOkClick}
          >
            OK
          </div>
        </footer>
      </div>{" "}
      */
    </div>
  );
};

export default SocialMediaInput;

"use client";

import React, { useState, useEffect, useRef } from "react";
import { SOCIAL_MEDIA_OPTIONS } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { LinkIcon } from "@/public/assets/svgs";

type SocialLink = { type: string; url: string };

interface Props {
  values?: SocialLink[];
  fieldChange: (links: SocialLink[]) => void;
  onDraftChange?: (pending: boolean) => void;
}

// computed once at module level, not on every render
const DEFAULT_OPTIONS = SOCIAL_MEDIA_OPTIONS.filter((o) => o.default);
const EXTRA_OPTIONS = SOCIAL_MEDIA_OPTIONS.filter((o) => !o.default);
const OPTION_BY_TYPE = new Map(SOCIAL_MEDIA_OPTIONS.map((o) => [o.type, o]));

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
      <span className="social-link-icon">
        <Icon height="20px" width="20px" />
      </span>
      <Input
        value={url}
        onChange={(e) => onChange(e.target.value)}
        className="shad-auth_form_input"
        placeholder={`Add ${type.toLowerCase()} URL`}
      />
    </div>
  );
};

const SocialMediaInput = ({
  values = [],
  fieldChange,
  onDraftChange,
}: Props) => {
  const [pending, setPending] = useState<SocialLink>({ type: "", url: "" });
  const pendingRef = useRef(pending);
  const [error, setError] = useState("");
  useEffect(() => {
    onDraftChange?.(!!(pendingRef.current.type || pendingRef.current.url));
  }, [pending.type, pending.url, onDraftChange]);

  const updatePending = (patch: Partial<SocialLink>) => {
    const next = { ...pendingRef.current, ...patch };
    pendingRef.current = next;
    setPending(next);
    // Notify during the input event so Enter/submit cannot race the next effect.
    onDraftChange?.(!!(next.type || next.url));
  };

  const urlFor = (type: string) =>
    values.find((l) => l.type === type)?.url ?? "";

  // update if it exists, otherwise add it
  const setUrl = (type: string, url: string) => {
    const exists = values.some((l) => l.type === type);
    fieldChange(
      exists
        ? values.map((l) => (l.type === type ? { ...l, url } : l))
        : [...values, { type, url }],
    );
  };

  const addedExtras = values.filter(
    (l) => !OPTION_BY_TYPE.get(l.type)?.default,
  );
  const availableExtras = EXTRA_OPTIONS.filter(
    (o) => !values.some((l) => l.type === o.type),
  );

  const handleOkClick = () => {
    const draft = pendingRef.current;
    if (!draft.type || !draft.url.trim()) {
      setError("Please fill all the fields");
      return;
    }
    fieldChange([...values, { type: draft.type, url: draft.url.trim() }]);
    updatePending({ type: "", url: "" });
    setError("");
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="shad-auth_form_label">Social Links</label>

      <div className="flex w-[70%] flex-col gap-3">
        {DEFAULT_OPTIONS.map((option) => (
          <LinkRow
            key={option.type}
            type={option.type}
            url={urlFor(option.type)}
            onChange={(url) => setUrl(option.type, url)}
          />
        ))}

        <p className="text-[13px] text-light-600">
          Add links to your social media profiles to help others find you.
        </p>

        {addedExtras.map((link) => (
          <LinkRow
            key={link.type}
            type={link.type}
            url={link.url}
            onChange={(url) => setUrl(link.type, url)}
          />
        ))}

        {availableExtras.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <Select
                value={pending.type}
                onValueChange={(type) => {
                  updatePending({ type });
                  setError("");
                }}
              >
                <SelectTrigger className="flex-between shad-auth_form_input !w-[45%] !text-light-500">
                  <SelectValue placeholder="Choose link type" />
                </SelectTrigger>
                <SelectContent className="shad-auth_form_select_option">
                  {availableExtras.map((option) => (
                    <SelectItem
                      key={option.type}
                      value={option.type}
                      className="shad-auth_form_select_item"
                    >
                      <p className="first-letter:capitalize">{option.type}</p>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={pending.url}
                onChange={(e) => {
                  updatePending({ url: e.target.value });
                  setError("");
                }}
                placeholder="Add related URL"
                className="shad-auth_form_input"
              />
            </div>

            {error && <p className="shad-auth_form_message">{error}</p>}

            <footer className="flex justify-end">
              {pending.type || pending.url ? (
                <button
                  type="button"
                  className="teritory-button mr-3"
                  onClick={() => {
                    updatePending({ type: "", url: "" });
                    setError("");
                  }}
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                className="teritory-button"
                onClick={handleOkClick}
              >
                OK
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaInput;

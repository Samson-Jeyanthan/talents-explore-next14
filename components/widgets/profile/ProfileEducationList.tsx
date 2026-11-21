"use client";
import { useEffect, useRef, useState } from "react";
import { getProfileEducationsAction } from "@/actions/profile-education.action";
import { educationKey } from "@/lib/utils/profile-education";
import { ProInfoAddBtn } from "@/components/buttons";
import { EducationCard } from "@/components/cards/ProDetailCards";
import { Button } from "@/components/ui/button";
import GraduationIcon from "@/public/assets/svgs/GraduationIcon";
import EmptyDetails from "@/components/others/EmptyDetails";

export default function ProfileEducationList({
  profileId,
  isOwnProfile,
  initialResult,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialResult: Awaited<ReturnType<typeof getProfileEducationsAction>>;
}) {
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const request = useRef({ version: 0, busy: false });
  useEffect(() => {
    const current = request.current;
    current.version++;
    current.busy = false;
    setLoading(false);
    setResult(initialResult);
    return () => {
      current.version++;
    };
  }, [profileId, initialResult]);
  const retry = async () => {
    const current = request.current;
    if (current.busy) return;
    current.busy = true;
    const version = current.version;
    setLoading(true);
    try {
      const next = await getProfileEducationsAction(profileId);
      if (version === current.version) setResult(next);
    } catch {
      if (version === current.version)
        setResult({
          status: "400",
          response: [],
          message: "Unable to load education details. Please try again.",
        });
    } finally {
      if (version === current.version) {
        current.busy = false;
        setLoading(false);
      }
    }
  };
  if (result.status === "7400" && !isOwnProfile && !result.response.length)
    return null;
  return (
    <article className="flex w-full min-w-0 max-w-[22rem] flex-col gap-4">
      <h4 className="flex-between w-full text-sm">
        Education
        {isOwnProfile && result.status === "7400" ? (
          <ProInfoAddBtn detailName="education" dataArray={result.response} />
        ) : null}
      </h4>
      {result.status !== "7400" ? (
        <div
          role="alert"
          className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
        >
          <p>{result.message}</p>
          <Button type="button" disabled={loading} onClick={retry}>
            {loading ? "Loading..." : "Try again"}
          </Button>
        </div>
      ) : result.response.length ? (
        <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
          {result.response.map((row, index) => (
            <EducationCard
              key={educationKey(row)}
              data={row}
              index={index}
              length={result.response.length}
              dataArray={result.response}
            />
          ))}
        </div>
      ) : (
        <div className="pt-6">
          <EmptyDetails
            Icon={GraduationIcon}
            text="You have not added any education yet"
            size="56px"
          />
        </div>
      )}
    </article>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { getProfileAwardsAction } from "@/actions/profile-awards.action";
import { awardKey } from "@/lib/utils/profile-awards";
import { ProInfoAddBtn } from "@/components/buttons";
import { AwardCard } from "@/components/cards/ProDetailCards";
import { Button } from "@/components/ui/button";
import AwardsIcon from "@/public/assets/svgs/AwardsIcon";
import EmptyDetails from "@/components/others/EmptyDetails";

export default function ProfileAwardsList({
  profileId,
  isOwnProfile,
  initialResult,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialResult: Awaited<ReturnType<typeof getProfileAwardsAction>>;
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
      const next = await getProfileAwardsAction(profileId);
      if (version === current.version) setResult(next);
    } catch {
      if (version === current.version)
        setResult({
          status: "400",
          response: [],
          message: "Unable to load awards and certificates. Please try again.",
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
    <section className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex-between profile-detail-heading w-full sm:w-1/2">
        <div className="flex items-center gap-4">
          <AwardsIcon /> Awards &amp; Certificates
        </div>
        {isOwnProfile && result.status === "7400" ? (
          <div className="mr-14 flex items-center">
            <ProInfoAddBtn detailName="award" dataArray={result.response} />
          </div>
        ) : null}
      </div>
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
        <article className="flex w-full max-w-[22rem] flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
          {result.response.map((award, index) => (
            <AwardCard
              key={awardKey(award)}
              data={award}
              index={index}
              length={result.response.length}
              dataArray={result.response}
            />
          ))}
        </article>
      ) : (
        <div className="max-w-[22rem] pt-6">
          <EmptyDetails
            Icon={AwardsIcon}
            text="Not added any awards / certificates yet"
            size="56px"
          />
        </div>
      )}
    </section>
  );
}

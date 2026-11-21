"use client";
import { useEffect, useRef, useState } from "react";
import { getProfileSkillsAction } from "@/actions/profile-skills.action";
import { skillSetKey } from "@/lib/utils/profile-skills";
import SkillCard from "@/components/cards/SkillCard";
import ProfileSkillEditor from "./ProfileSkillEditor";
import ProfileSkillDeleteDialog from "./ProfileSkillDeleteDialog";
import type { ProfileSkill } from "@/lib/utils/profile-skills";
import { Button } from "@/components/ui/button";

export default function ProfileSkillsList({
  profileId,
  isOwnProfile,
  initialResult,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialResult: Awaited<ReturnType<typeof getProfileSkillsAction>>;
}) {
  const [result, setResult] = useState(initialResult);
  const [editing, setEditing] = useState<ProfileSkill | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<ProfileSkill | null>(null);
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
      const next = await getProfileSkillsAction(profileId);
      if (version === current.version) setResult(next);
    } catch {
      if (version === current.version)
        setResult({
          status: "400",
          response: [],
          message: "Unable to load skills. Please try again.",
        });
    } finally {
      if (version === current.version) {
        current.busy = false;
        setLoading(false);
      }
    }
  };
  return (
    <section className="my-8 flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base text-light-900">Skills</h2>
        {isOwnProfile && result.status === "7400" ? (
          <Button
            type="button"
            className="shad-button_primary"
            onClick={() => setEditing(null)}
          >
            Add skills
          </Button>
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
        <div className="grid min-h-80 w-full grid-cols-1 items-start justify-end gap-8 md:grid-cols-2">
          {result.response.map((row, index) => (
            <SkillCard
              key={skillSetKey(row)}
              userSkillCard={row}
              index={index}
              actions={
                isOwnProfile ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 text-xs"
                      aria-label={`Edit ${row.subCategoryName || "skill set"}`}
                      onClick={() => setEditing(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 text-xs"
                      aria-label={`Delete ${row.subCategoryName || "skill set"}`}
                      onClick={() => setDeleting(row)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-light-900">No skills added yet.</p>
      )}
      {isOwnProfile && editing !== undefined ? (
        <ProfileSkillEditor
          isOpen={true}
          data={editing || undefined}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      {isOwnProfile && deleting ? (
        <ProfileSkillDeleteDialog
          isOpen={true}
          data={deleting}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </section>
  );
}

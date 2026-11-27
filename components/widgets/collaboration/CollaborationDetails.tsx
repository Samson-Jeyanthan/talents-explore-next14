"use client";
import LinkedText from "@/components/others/LinkedText";

import {
  deleteCollaborationAction,
  getCollaborationDetailsAction,
  respondCollaborationInviteAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  Calendar,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCollaborationWrite } from "@/lib/hooks/useCollaborationWorkflow";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { applicantStatusLabel } from "@/lib/utils/collaboration-workflow";
import CollaborationApplicationDialog from "./CollaborationApplicationDialog";
import CollaborationRoleRequirements from "./CollaborationRoleRequirements";
import CollaborationTimeline from "./CollaborationTimeline";
import {
  canUseCollaborationChat,
  timelineItems,
  detailText,
  lookupLabel,
} from "@/lib/utils/collaboration-schedule";
import { toast } from "sonner";
import Image from "next/image";
import ReportDialog from "@/components/modals/ReportDialog";

type Props = {
  collaborationId: string;
  currentUser: any;
  initialDetails: any;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "-";
  }
}

function getDuration(details: any) {
  const collaboration = details?.collaboration || {};

  if (collaboration?.expectedDays) {
    return collaboration.expectedDays;
  }

  if (collaboration?.expectedStartDate && collaboration?.expectedEndDate) {
    return `${formatDate(collaboration.expectedStartDate)} - ${formatDate(
      collaboration.expectedEndDate,
    )}`;
  }

  return "-";
}

function CollaborationDetails({
  collaborationId,
  currentUser,
  initialDetails,
}: Props) {
  const [details, setDetails] = useState(initialDetails);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const write = useCollaborationWrite(collaborationId);
  const isPending = write.pending;
  const [refreshError, setRefreshError] = useState("");
  const collaboration = details?.collaboration || {};
  const owner = details?.owner || {};
  const roles = Array.isArray(details?.roles) ? details.roles : [];
  const isOwner =
    !!collaborationSelection(currentUser) &&
    collaborationSelection(currentUser) === collaborationSelection(owner);
  const canChat = canUseCollaborationChat(currentUser, details);
  const roomId = collaborationSelection(collaboration.roomId);

  const reloadDetails = async () => {
    try {
      const next = await getCollaborationDetailsAction(collaborationId);
      if (!next?.collaboration) throw new Error();
      setDetails(next);
      setRefreshError("");
    } catch {
      setRefreshError(
        "Unable to refresh collaboration details. Your saved action was retained. Please retry loading.",
      );
    }
  };
  const updateRole = (id: string, patch: any) =>
    setDetails((previous: any) => ({
      ...previous,
      roles: (previous?.roles || []).map((role: any) =>
        collaborationSelection(role) === id
          ? { ...role, myApplicant: { ...role.myApplicant, ...patch } }
          : role,
      ),
    }));
  const handleDelete = () =>
    write.run(
      () => deleteCollaborationAction(collaborationId),
      () => {
        window.location.assign("/collaboration");
      },
    );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/collaboration/${collaborationId}`,
      );
      toast.success("Collaboration link copied");
    } catch {
      toast.error("Could not copy collaboration link");
    }
  };

  const handleInviteResponse = (role: any, action: "ACCEPT" | "DECLINE") =>
    write.run(
      () =>
        respondCollaborationInviteAction(collaborationId, {
          collaborationRoleId: collaborationSelection(role),
          action,
        }),
      async () => {
        updateRole(collaborationSelection(role), {
          applicantType: "INVITED",
          applicantStatus: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        });
        toast.success("Invitation response saved");
        await reloadDetails();
      },
    );

  if (!details) {
    return (
      <section className="flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-[32px] border border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
          Unable to load collaboration details. Please try again.
          <Button type="button" onClick={reloadDetails}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        {write.error ? <p role="alert">{write.error}</p> : null}
        {refreshError ? (
          <div role="alert">
            {refreshError}
            <Button type="button" onClick={reloadDetails}>
              Retry loading
            </Button>
          </div>
        ) : null}
        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <UserProfileImg
                src={
                  owner?.profileImage ||
                  owner?.personalInfo?.profileImage ||
                  null
                }
                userName={owner?.userName || "User"}
                className="size-14 min-h-14 min-w-14"
              />
              <div>
                <p className="text-base font-semibold text-primary-500">
                  {owner?.userName || "Unknown user"}
                </p>
                <p className="text-sm text-light-500">
                  {lookupLabel(
                    owner?.professional || owner?.personalInfo?.professional,
                    ["professional"],
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                onClick={handleCopyLink}
              >
                <Copy className="mr-2 size-4" />
                Copy Link
              </Button>
              {!isOwner && currentUser?._id && (
                <Button
                  type="button"
                  className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                  onClick={() => setReportOpen(true)}
                >
                  Report collaboration
                </Button>
              )}
              {isOwner ? (
                <>
                  <Link href={`/collaboration/edit/${collaborationId}`}>
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    >
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/collaboration/${collaborationId}/invite`}>
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    >
                      Invite More
                    </Button>
                  </Link>
                  <Link href={`/collaboration/${collaborationId}/applicants`}>
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    >
                      <ClipboardList className="mr-2 size-4" />
                      View All Applicants
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    className="rounded-full bg-primary-500 text-light-900"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <h1 className="pt-5 text-3xl font-semibold text-light-900">
            {collaboration?.title || "Untitled collaboration"}
          </h1>
          <p className="pt-3 text-sm text-light-500">
            <LinkedText
              text={
                collaboration?.description ||
                "No collaboration description provided yet."
              }
            />
          </p>

          {collaboration?.poster?.url ? (
            <div className="mt-5 overflow-hidden rounded-[28px] bg-black">
              <Image
                src={collaboration.poster.url}
                alt={collaboration?.title || "Collaboration poster"}
                className="max-h-[520px] w-full object-contain"
                width={1920}
                height={1080}
              />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 rounded-[28px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <Calendar className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">
                  Duration
                </span>
              </div>
              <p className="pt-2 text-sm text-light-900">
                {getDuration(details)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <MapPin className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">
                  Location
                </span>
              </div>
              <p className="pt-2 text-sm text-light-900">
                {collaboration?.location || "-"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <FileText className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">
                  Production
                </span>
              </div>
              <p className="pt-2 text-sm text-light-900">
                {collaboration?.productionInfo?.title || "-"}
              </p>
              <p className="pt-1 text-xs text-light-500">
                {collaboration?.productionInfo?.type || ""}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <MessageSquare className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">
                  Contact
                </span>
              </div>
              <p className="pt-2 text-sm text-light-900">
                {collaboration?.contactInfo?.email || "-"}
              </p>
              <p className="pt-1 text-xs text-light-500">
                {collaboration?.contactInfo?.phone || ""}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-light-900">Roles</h2>
              <p className="pt-1 text-sm text-light-500">
                {roles.length} {roles.length === 1 ? "role" : "roles"} currently
                open.
              </p>
            </div>
            {canChat && roomId ? (
              <Link href={`/chat/${roomId}?type=group`}>
                <Button
                  type="button"
                  className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                >
                  Open Group Chat
                </Button>
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            {roles.map((role: any) => {
              const myApplicant = role?.myApplicant;
              const canApply = !!currentUser?._id && !myApplicant && !isOwner;
              const isInvitePending =
                myApplicant?.applicantType === "INVITED" &&
                myApplicant?.applicantStatus === "APPLIED";
              const hasChatAccess =
                myApplicant?.applicantStatus === "SHORTLISTED" ||
                myApplicant?.applicantStatus === "ACCEPTED" ||
                myApplicant?.applicantStatus === "FINALIZED";
              const isAppliedPending =
                myApplicant?.applicantType === "APPLIED" &&
                myApplicant?.applicantStatus === "APPLIED";

              return (
                <div
                  key={role?._id || role?.roleId || role?.name}
                  className="rounded-[28px] border border-dark-300 bg-dark-200 p-4"
                >
                  <h3 className="text-lg font-semibold text-primary-500">
                    {detailText(role?.name, "Role")}
                  </h3>
                  <p className="mt-1 text-sm text-light-600">
                    {detailText(role?.subtitle, "")}
                  </p>
                  <div className="mt-4">
                    <CollaborationRoleRequirements role={role} />
                  </div>
                  <details className="mt-4 rounded-2xl border border-dark-300 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-light-900">
                      Dates, mode, and locations ({timelineItems(role).length})
                    </summary>
                    <div className="mt-4">
                      <CollaborationTimeline role={role} />
                    </div>
                  </details>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-5">
                    {myApplicant && !isAppliedPending ? (
                      <span
                        role="status"
                        className="rounded-full border border-dark-300 px-3 py-1 text-sm text-light-700"
                      >
                        {applicantStatusLabel(myApplicant)}
                      </span>
                    ) : null}
                    {isOwner ? (
                      <>
                        <Link
                          href={`/collaboration/${collaborationId}/roles/${collaborationSelection(role)}/applicants`}
                        >
                          <Button
                            type="button"
                            className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
                          >
                            Applicants
                          </Button>
                        </Link>
                      </>
                    ) : null}

                    {collaborationSelection(role) ? (
                      <Link
                        href={`/collaboration/${collaborationId}/roles/${collaborationSelection(role)}/schedule`}
                        className="rounded-full border border-dark-300 px-4 py-2 text-sm text-light-900"
                      >
                        View schedule
                      </Link>
                    ) : null}
                    {isInvitePending ? (
                      <>
                        <Button
                          type="button"
                          disabled={isPending}
                          className="rounded-full bg-primary-500 text-light-900"
                          onClick={() => handleInviteResponse(role, "ACCEPT")}
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          disabled={isPending}
                          className="rounded-full bg-custom-100 text-light-900"
                          onClick={() => handleInviteResponse(role, "DECLINE")}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}

                    {canApply ? (
                      <Button
                        type="button"
                        className="rounded-full bg-primary-500 text-light-900"
                        disabled={isPending}
                        onClick={() => setSelectedRole(role)}
                      >
                        Apply
                      </Button>
                    ) : null}

                    {isAppliedPending ? (
                      <span className="rounded-full border border-custom-100 px-4 py-2 text-xs font-medium text-custom-100">
                        Pending Response
                      </span>
                    ) : null}

                    {canChat && hasChatAccess && roomId ? (
                      <Link href={`/chat/${collaboration.roomId}?type=group`}>
                        <Button
                          type="button"
                          className="rounded-full bg-dark-250 text-custom-100 hover:bg-dark-300"
                        >
                          Chat
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {roles.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-dark-300 bg-dark-200 px-4 py-10 text-center text-sm text-light-500">
                No roles found for this collaboration.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <CollaborationApplicationDialog
        collaborationId={collaborationId}
        role={selectedRole}
        currentUser={currentUser}
        onClose={() => setSelectedRole(null)}
        onApplied={async (id) => {
          updateRole(id, {
            applicantType: "APPLIED",
            applicantStatus: "APPLIED",
          });
          toast.success("Application sent");
          await reloadDetails();
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collaboration?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This collaboration and its current state will be removed for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="collaboration"
        targetId={collaborationId}
        title="Report collaboration"
      />
    </>
  );
}

export default CollaborationDetails;

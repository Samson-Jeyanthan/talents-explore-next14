"use client";

import {
  applyToCollaborationRoleAction,
  deleteCollaborationAction,
  getCollaborationDetailsAction,
  respondCollaborationInviteAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, ClipboardList, Copy, FileText, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
      collaboration.expectedEndDate
    )}`;
  }

  return "-";
}

function getTimelineLabel(role: any) {
  if (role?.timeLineType === "BY_DAYS") {
    return role?.timeLine?.[0]?.expectedDays || "-";
  }

  if (role?.timeLineType === "BY_DATE") {
    return `${formatDate(role?.timeLine?.[0]?.startDate)} - ${formatDate(
      role?.timeLine?.[0]?.endDate
    )}`;
  }

  if (role?.timeLineType === "DATE_SETS") {
    return "Multiple scheduled dates";
  }

  return "-";
}

function CollaborationDetails({ collaborationId, currentUser, initialDetails }: Props) {
  const [details, setDetails] = useState(initialDetails);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [applyForm, setApplyForm] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    message: "",
  });

  const collaboration = details?.collaboration || {};
  const owner = details?.owner || {};
  const roles = Array.isArray(details?.roles) ? details.roles : [];
  const isOwner = Boolean(currentUser?._id && currentUser?._id === owner?._id);

  const reloadDetails = async () => {
    const nextDetails = await getCollaborationDetailsAction(collaborationId);
    setDetails(nextDetails);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const response = await deleteCollaborationAction(collaborationId);

      if (response?.status === "7400") {
        toast.success("Successfully deleted the collaboration");
        window.location.assign("/collaboration");
        return;
      }

      toast.error(response?.message || "Failed to delete collaboration");
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/collaboration/${collaborationId}`);
      toast.success("Collaboration link copied");
    } catch {
      toast.error("Could not copy collaboration link");
    }
  };

  const handleInviteResponse = (role: any, action: "ACCEPT" | "DECLINE") => {
    startTransition(async () => {
      const response = await respondCollaborationInviteAction(collaborationId, {
        collaborationRoleId: role?._id,
        action,
      });

      if (response?.status === "7400") {
        toast.success(response?.message || "Invite response updated");
        await reloadDetails();
        return;
      }

      toast.error(response?.message || "Failed to update invite response");
    });
  };

  const handleApply = () => {
    if (!selectedRole?._id) {
      return;
    }

    startTransition(async () => {
      const response = await applyToCollaborationRoleAction(collaborationId, {
        collaborationRoleId: selectedRole._id,
        applicantName: applyForm.applicantName,
        applicantEmail: applyForm.applicantEmail,
        applicantPhone: applyForm.applicantPhone,
        message: applyForm.message,
      });

      if (response?.status === "7400") {
        toast.success(response?.message || "Interest sent successfully");
        setSelectedRole(null);
        setApplyForm({
          applicantName: "",
          applicantEmail: "",
          applicantPhone: "",
          message: "",
        });
        await reloadDetails();
        return;
      }

      toast.error(response?.message || "Failed to send interest");
    });
  };

  if (!details) {
    return (
      <section className="flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-[32px] border border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
          No details found for this collaboration.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <UserProfileImg
                src={owner?.profileImage || owner?.personalInfo?.profileImage || null}
                userName={owner?.userName || "User"}
                className="size-14 min-h-14 min-w-14"
              />
              <div>
                <p className="text-base font-semibold text-primary-500">
                  {owner?.userName || "Unknown user"}
                </p>
                <p className="text-sm text-light-500">
                  {owner?.professional || owner?.personalInfo?.professional || "Collaboration owner"}
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
            {collaboration?.description || "No collaboration description provided yet."}
          </p>

          {collaboration?.poster?.url ? (
            <div className="mt-5 overflow-hidden rounded-[28px] bg-black">
              <img
                src={collaboration.poster.url}
                alt={collaboration?.title || "Collaboration poster"}
                className="max-h-[520px] w-full object-contain"
              />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 rounded-[28px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <Calendar className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">Duration</span>
              </div>
              <p className="pt-2 text-sm text-light-900">{getDuration(details)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <MapPin className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">Location</span>
              </div>
              <p className="pt-2 text-sm text-light-900">{collaboration?.location || "-"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-light-500">
                <FileText className="size-4" />
                <span className="text-xs uppercase tracking-[0.16em]">Production</span>
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
                <span className="text-xs uppercase tracking-[0.16em]">Contact</span>
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
                {roles.length} {roles.length === 1 ? "role" : "roles"} currently open.
              </p>
            </div>
            {collaboration?.roomId ? (
              <Link href={`/chat/${collaboration.roomId}?type=group`}>
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
              const canApply = !myApplicant && !isOwner;
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
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-500">{role?.name || "Role"}</h3>
                      <p className="pt-1 text-sm text-light-500">{role?.subtitle || ""}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {role?.paymentDetails?.amount ? (
                        <span className="rounded-full border border-dark-300 bg-dark-250 px-3 py-1 text-xs text-light-900">
                          {role.paymentDetails.amount} {role.paymentDetails.currency || ""}
                        </span>
                      ) : null}
                      {role?.paymentDetails?.type ? (
                        <span className="rounded-full border border-dark-300 bg-dark-250 px-3 py-1 text-xs text-light-500">
                          {role.paymentDetails.type}
                        </span>
                      ) : null}
                      {role?.paymentDetails?.payment ? (
                        <span className="rounded-full border border-dark-300 bg-dark-250 px-3 py-1 text-xs text-light-500">
                          {role.paymentDetails.payment}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-light-500">Gender</p>
                      <p className="pt-1 text-sm text-light-900">{role?.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-light-500">Language</p>
                      <p className="pt-1 text-sm text-light-900">{role?.languageSeekingName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-light-500">Ethnicity</p>
                      <p className="pt-1 text-sm text-light-900">{role?.ethnicName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-light-500">Timeline</p>
                      <p className="pt-1 text-sm text-light-900">{getTimelineLabel(role)}</p>
                    </div>
                  </div>

                  <p className="pt-4 text-sm text-light-500">
                    {role?.description || "No role description provided yet."}
                  </p>

                  {Array.isArray(role?.skills) && role.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-4">
                      {role.skills.map((skill: any, index: number) => (
                        <span
                          key={`${role?._id}-skill-${index}`}
                          className="rounded-2xl border border-dark-300 bg-dark-250 px-3 py-2 text-xs text-light-500"
                        >
                          <span className="font-semibold text-light-900">
                            {skill?.mainCategoryName || "Skill"}
                          </span>
                          <span className="text-light-500">
                            {" "}
                            {skill?.subCategoryName || ""} {skill?.skillName ? `- ${skill.skillName}` : ""}{" "}
                            {skill?.level ? `- ${skill.level}` : ""}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-5">
                    {isOwner ? (
                      <>
                        <Link href={`/collaboration/${collaborationId}/roles/${role?._id}/applicants`}>
                          <Button
                            type="button"
                            className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
                          >
                            Applicants
                          </Button>
                        </Link>
                        <Link href={`/collaboration/${collaborationId}/roles/${role?._id}/schedule`}>
                          <Button
                            type="button"
                            className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
                          >
                            Schedule
                          </Button>
                        </Link>
                      </>
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
                        onClick={() => {
                          setSelectedRole(role);
                          setApplyForm({
                            applicantName: currentUser?.personalInfo?.firstName
                              ? `${currentUser.personalInfo.firstName} ${
                                  currentUser?.personalInfo?.lastName || ""
                                }`.trim()
                              : "",
                            applicantEmail: currentUser?.email || "",
                            applicantPhone: currentUser?.phone || "",
                            message: "",
                          });
                        }}
                      >
                        Apply
                      </Button>
                    ) : null}

                    {isAppliedPending ? (
                      <span className="rounded-full border border-custom-100 px-4 py-2 text-xs font-medium text-custom-100">
                        Pending Response
                      </span>
                    ) : null}

                    {hasChatAccess && collaboration?.roomId ? (
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

      <Dialog open={Boolean(selectedRole)} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl rounded-[28px] border-dark-300 bg-dark-200 text-light-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-light-900">
              Send interest
            </DialogTitle>
            <DialogDescription className="text-light-500">
              {selectedRole?.name
                ? `You are showing interest for ${selectedRole.name}.`
                : "Share why you are a strong fit for this role."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              value={applyForm.applicantName}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantName: event.target.value }))
              }
              placeholder="Full name"
              className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500"
            />
            <Input
              value={applyForm.applicantEmail}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantEmail: event.target.value }))
              }
              placeholder="Contact email"
              className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500"
            />
            <Input
              value={applyForm.applicantPhone}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
              }
              placeholder="Contact number"
              className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500"
            />
            <Textarea
              value={applyForm.message}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, message: event.target.value }))
              }
              placeholder="Why should they collaborate with you?"
              className="min-h-[180px] rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
              onClick={() => setSelectedRole(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="rounded-full bg-primary-500 text-light-900"
              onClick={handleApply}
            >
              {isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
}

export default CollaborationDetails;

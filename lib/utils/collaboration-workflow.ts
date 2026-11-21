import { collaborationId } from "./collaboration";
import { collaborationSelection } from "./collaboration-editor";

export const reviewStatuses: Record<string, string> = {
  ACCEPT: "ACCEPTED",
  SHORTLIST: "SHORTLISTED",
  FINALIZED: "FINALIZED",
  REJECT: "REJECTED",
};
export function reviewOptions(application: any) {
  const status = application?.applicantStatus;
  if (status === "APPLIED")
    return application?.applicantType === "APPLIED"
      ? [{ action: "ACCEPT", label: "Accept request" }]
      : [];
  const options = [];
  if (status === "ACCEPTED")
    options.push({ action: "SHORTLIST", label: "Add to shortlist" });
  if (status === "SHORTLISTED")
    options.push(
      { action: "FINALIZED", label: "Add to finalists" },
      { action: "ACCEPT", label: "Remove from shortlist" },
    );
  if (status === "FINALIZED")
    options.push({ action: "ACCEPT", label: "Remove from finalists" });
  if (status === "REJECTED")
    options.push({ action: "ACCEPT", label: "Restore applicant" });
  if (["ACCEPTED", "SHORTLISTED", "FINALIZED"].includes(status))
    options.push({ action: "REJECT", label: "Reject applicant" });
  return options;
}
export function applicantStatusLabel(application: any) {
  if (
    application?.applicantType === "INVITED" &&
    application?.applicantStatus === "APPLIED"
  )
    return "Invitation pending";
  return (
    (
      {
        APPLIED: "Application pending",
        ACCEPTED: "Accepted",
        SHORTLISTED: "Shortlisted",
        FINALIZED: "Finalized",
        REJECTED: "Rejected",
        DECLINED: "Invitation declined",
      } as Record<string, string>
    )[application?.applicantStatus] || "Status unavailable"
  );
}
export function applicationKey(item: any) {
  return collaborationSelection(item?.applicationId ?? item?._id ?? item?.id);
}
export function applicantIdentity(item: any) {
  return (
    collaborationSelection(item?.applicantId) ||
    collaborationSelection(item?.applicant)
  );
}
export function workflowRows(
  data: any,
  kind: "applicants" | "people",
): any[] | null {
  const rows = [data?.response, data?.response?.list, data?.data].find(
    Array.isArray,
  );
  if (
    !rows ||
    !rows.every(
      (row: any) =>
        collaborationId.safeParse(
          kind === "people" ? collaborationSelection(row) : applicationKey(row),
        ).success,
    )
  )
    return null;
  return rows;
}
export function resumeFileError(file: Pick<File, "type" | "size" | "name">) {
  const accepted = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!file.size) return "Choose a non-empty résumé file.";
  if (!accepted.includes(file.type))
    return "Choose a PDF, DOCX, JPG, PNG, WebP, or GIF résumé.";
  if (file.size > 20 * 1024 * 1024) return "Choose a résumé up to 20 MB.";
  return "";
}
export function validRoleIds(values: string[]) {
  return Array.from(
    new Set(values.filter((value) => collaborationId.safeParse(value).success)),
  );
}

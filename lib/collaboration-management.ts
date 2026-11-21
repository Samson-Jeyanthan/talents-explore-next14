import "server-only";
import { notFound, redirect } from "next/navigation";
import {
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";

export async function loadOwnedCollaboration(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  const [currentUser, details] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationDetailsAction(id),
  ]);
  if (!details?.collaboration)
    throw new Error("Unable to load collaboration. Please try again.");
  if (
    collaborationSelection(details.owner) !==
    collaborationSelection(currentUser)
  )
    redirect(`/collaboration/${id}`);
  return { currentUser, details };
}

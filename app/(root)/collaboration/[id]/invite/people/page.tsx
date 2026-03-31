import {
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import {
  getCountriesAction,
  getEthnicAction,
  getLanguagesAction,
  getMainCategoriesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import CollaborationInvitePeople from "@/components/widgets/collaboration/CollaborationInvitePeople";

export const dynamic = "force-dynamic";

export default async function CollaborationInvitePeoplePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { roles?: string };
}) {
  const [currentUser, mainCategories, languages, countries, ethnicities, professions] =
    await Promise.all([
      getCurrentCollaborationUserAction(),
      getMainCategoriesAction(),
      getLanguagesAction(),
      getCountriesAction(),
      getEthnicAction(),
      getProfessionsAction(),
    ]);

  return (
    <CollaborationInvitePeople
      collaborationId={params.id}
      currentUser={currentUser}
      selectedRoleIds={(searchParams.roles || "").split(",").filter(Boolean)}
      lookupData={{
        mainCategories: mainCategories?.response || [],
        languages: languages?.response || [],
        countries: countries?.response || [],
        ethnicities: ethnicities?.response || [],
        professions: professions?.response || [],
      }}
    />
  );
}


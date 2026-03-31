import {
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import {
  getCountriesAction,
  getEthnicAction,
  getLanguagesAction,
  getMainCategoriesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import CollaborationEditor from "@/components/widgets/collaboration/CollaborationEditor";

export const dynamic = "force-dynamic";

export default async function EditCollaborationPage({
  params,
}: {
  params: { id: string };
}) {
  const [
    currentUser,
    collaborationDetails,
    mainCategories,
    languages,
    countries,
    ethnicities,
    professions,
  ] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationDetailsAction(params.id),
    getMainCategoriesAction(),
    getLanguagesAction(),
    getCountriesAction(),
    getEthnicAction(),
    getProfessionsAction(),
  ]);

  return (
    <CollaborationEditor
      mode="edit"
      collaborationId={params.id}
      currentUser={currentUser}
      initialDetails={collaborationDetails}
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


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
import CollaborationEditor from "@/components/widgets/collaboration/CollaborationEditor";

export const dynamic = "force-dynamic";

export default async function CreateCollaborationPage() {
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
    <CollaborationEditor
      mode="create"
      currentUser={currentUser}
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


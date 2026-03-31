import {
  getCollaborationListAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import {
  getCountriesAction,
  getEthnicAction,
  getLanguagesAction,
  getMainCategoriesAction,
} from "@/actions/utils.action";
import CollaborationDashboard from "@/components/widgets/collaboration/CollaborationDashboard";

export const dynamic = "force-dynamic";

export default async function CollaborationPage() {
  const [
    currentUser,
    allData,
    committedData,
    receivedData,
    myData,
    appliedData,
    mainCategories,
    languages,
    countries,
    ethnicities,
  ] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationListAction({ type: "ALL" }),
    getCollaborationListAction({ type: "COMMITTED" }),
    getCollaborationListAction({ type: "RECEIVED" }),
    getCollaborationListAction({ type: "MY" }),
    getCollaborationListAction({ type: "APPLIED" }),
    getMainCategoriesAction(),
    getLanguagesAction(),
    getCountriesAction(),
    getEthnicAction(),
  ]);

  return (
    <CollaborationDashboard
      currentUser={currentUser}
      initialLists={{
        ALL: allData.response || [],
        COMMITTED: committedData.response || [],
        RECEIVED: receivedData.response || [],
        MY: myData.response || [],
        APPLIED: appliedData.response || [],
      }}
      lookupData={{
        mainCategories: mainCategories?.response || [],
        languages: languages?.response || [],
        countries: countries?.response || [],
        ethnicities: ethnicities?.response || [],
      }}
    />
  );
}


import { getSavedItemsByFolderIdAction } from "@/actions/save.action";
import { getSession } from "@/lib/session";
import { getSaveCollectionFolderName } from "@/lib/utils/ReactElementUtils";
import Link from "next/link";
import { IoIosArrowBack } from "react-icons/io";

const SavedFolder = async ({ params }: { params: { id: string } }) => {
  const session = await getSession();
  const itemData = await getSavedItemsByFolderIdAction(
    params.id,
    session,
    1,
    20,
    true
  );
  const folderName = await getSaveCollectionFolderName(params.id, session);

  return (
    <section className="relative mt-4 flex w-full flex-col gap-8 p-8 px-10 2xl:max-w-[1600px]">
      <h1 className="text-center text-3xl font-semibold capitalize text-light-900">
        {folderName}
      </h1>
      <Link
        href="/saved-collection"
        className="flex-center absolute left-8 top-8 z-10 rounded-full bg-dark-100 p-2 pr-3 text-sm text-light-500 shadow-sm hover:text-light-900 max-md:p-3 md:pr-4"
      >
        <IoIosArrowBack className="text-lg" />
        <p className="max-md:hidden">back</p>
      </Link>
      <div className="w-full max-w-screen-xl columns-1 gap-x-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 xl:gap-x-6 2xl:columns-6">
        {itemData}
      </div>
    </section>
  );
};

export default SavedFolder;

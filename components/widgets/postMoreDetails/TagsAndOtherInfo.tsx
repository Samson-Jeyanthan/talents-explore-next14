import { TPostProps } from "@/types/post.types";
import { getFormattedDate } from "@/lib/utils";
import { GiFilmStrip } from "react-icons/gi";
import { IoCalendar } from "react-icons/io5";
import Link from "next/link";

type Props = {
  postData: TPostProps;
};

const TagsAndOtherInfo = ({ postData }: Props) => {
  return (
    <section className="flex min-w-[320px] max-w-[320px] flex-col gap-6 text-sm text-light-500">
      {postData.about.productionName || postData.about.productionDate ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-light-900">Production Details</h2>
          {postData.about.productionName && (
            <p className="flex gap-3 first-letter:capitalize">
              <GiFilmStrip className="text-xl" />
              {postData.about.productionName}
            </p>
          )}{" "}
          {postData.about.productionDate && (
            <p className="flex gap-3">
              <IoCalendar className="text-xl" />
              Production Date {getFormattedDate(postData.about.productionDate)}
            </p>
          )}
        </div>
      ) : null}

      {postData.about.peopleTag.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-light-900">Tagged People</h2>
          <div className="flex flex-wrap gap-2 lowercase">
            {postData.about.peopleTag.map((tag) => (
              <Link
                key={tag._id}
                href={`/profile/${tag.userName}/${tag._id}`}
                className="hover:text-light-900"
              >
                @{tag.userName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {postData.credit.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-light-900">Credits</h2>
          <div className="flex flex-col gap-0 rounded-2xl border border-solid border-dark-300 bg-dark-250 p-3">
            {postData.credit.map((credit, index) => {
              const isLast = index === postData.credit.length - 1;
              return (
                <div
                  key={index}
                  className={`flex flex-col gap-1 ${isLast ? "pt-3" : "border-b border-solid border-dark-300 py-3"} ${index === 0 && "pt-0"}`}
                >
                  <p className="text-light-700 first-letter:capitalize">
                    {credit.creditTitle}
                  </p>
                  <div className="flex flex-wrap gap-2 lowercase">
                    {credit.peopleTag.map((tag) => (
                      <Link
                        key={tag._id}
                        href={`/profile/${tag.userName}/${tag._id}`}
                        className="hover:text-light-900"
                      >
                        @{tag.userName}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {postData.toolsUsed.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-light-900">Used Tools</h2>
          <div className="flex flex-col gap-0 rounded-2xl border border-solid border-dark-300 bg-dark-250 p-3">
            {postData.toolsUsed.map((tool, index) => {
              const isLast = index === postData.toolsUsed.length - 1;
              return (
                <p
                  key={index}
                  className={`capitalize text-light-500 ${isLast ? "pt-3" : "border-b border-solid border-dark-300 py-3"} ${index === 0 && "pt-0"}`}
                >
                  {tool.toolName} - {tool.level}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default TagsAndOtherInfo;

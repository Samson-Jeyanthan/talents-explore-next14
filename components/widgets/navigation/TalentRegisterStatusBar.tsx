import type { ReactNode } from "react";

type Step = { title: string; subTitle: string; icon: ReactNode };

const TalentRegisterStatusBar = ({
  data,
  page,
}: {
  data: Step[];
  page: number;
}) => (
  <aside
    aria-label="Talent registration progress"
    className="sticky hidden h-[80vh] w-[22rem] shrink-0 border-r border-dark-300 lg:block"
  >
    <ol className="flex w-full flex-col gap-3 pr-6 pt-5">
      {data.map((item, index) => {
        const active = index === page;
        return (
          <li
            key={item.title}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              active
                ? "border-primary-500 bg-primary-500/10 shadow-sm"
                : "border-dark-400 bg-dark-250"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-base font-semibold ${active ? "text-light-900" : "text-light-700"}`}
                >
                  {item.title}
                </h3>
                {active && (
                  <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Current step
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-sm ${active ? "text-light-700" : "text-light-600"}`}
              >
                {item.subTitle}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`flex-center size-10 shrink-0 rounded-full border [&_g]:fill-current [&_svg]:size-5 [&_svg]:fill-current ${
                active
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-dark-400 bg-dark-300 text-light-600"
              }`}
            >
              {item.icon}
            </span>
          </li>
        );
      })}
    </ol>
  </aside>
);

export default TalentRegisterStatusBar;

import {
  detailText,
  enumLabel,
  lookupLabel,
  paymentLabels,
} from "@/lib/utils/collaboration-schedule";

export default function CollaborationRoleRequirements({ role }: { role: any }) {
  const skills = Array.isArray(role?.skills) ? role.skills : [];
  const payments = paymentLabels(role?.paymentDetails);
  return (
    <div className="grid min-w-0 gap-4">
      <div>
        <h3 className="text-sm font-medium text-light-600">Payment</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {payments.length ? (
            payments.map((label, index) => (
              <span
                key={index}
                className="rounded-full border border-dark-300 bg-dark-250 px-3 py-1 text-sm text-light-900"
              >
                {label}
              </span>
            ))
          ) : (
            <p className="text-sm text-light-700">Not specified</p>
          )}
        </div>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-light-600">Gender</dt>
          <dd className="mt-1 text-light-900">{enumLabel(role?.gender)}</dd>
        </div>
        <div>
          <dt className="text-light-600">Language</dt>
          <dd className="mt-1 text-light-900">
            {detailText(
              role?.languageSeekingName,
              lookupLabel(role?.languageSeeking, ["language"]),
            )}
          </dd>
        </div>
        <div>
          <dt className="text-light-600">Ethnicity</dt>
          <dd className="mt-1 text-light-900">
            {detailText(
              role?.ethnicName,
              lookupLabel(role?.ethnic, ["ethnic", "ethnicity"]),
            )}
          </dd>
        </div>
      </dl>
      <p className="whitespace-pre-wrap break-words text-sm text-light-700">
        {detailText(role?.description, "No role description provided.")}
      </p>
      <div>
        <h3 className="text-sm font-medium text-light-600">Skills required</h3>
        <ul className="mt-2 grid gap-2">
          {skills.map((skill: any, index: number) => (
            <li
              key={index}
              className="rounded-xl border border-dark-300 bg-dark-250 p-3 text-sm text-light-700"
            >
              <p className="font-medium text-light-900">
                {detailText(
                  skill?.mainCategoryName,
                  lookupLabel(skill?.mainCategoryId, ["mainCategory"]),
                )}
              </p>
              <p className="mt-1">
                {detailText(
                  skill?.subCategoryName,
                  lookupLabel(skill?.subCategoryId, ["subCategory"]),
                )}
              </p>
              {skill?.skillId || skill?.skillName ? (
                <p className="mt-1">
                  {detailText(
                    skill?.skillName,
                    lookupLabel(skill?.skillId, ["skill"]),
                  )}
                </p>
              ) : null}
              {skill?.level ? (
                <p className="mt-1">Level: {enumLabel(skill.level)}</p>
              ) : null}
            </li>
          ))}
        </ul>
        {!skills.length ? (
          <p className="mt-2 text-sm text-light-700">No skills specified.</p>
        ) : null}
      </div>
    </div>
  );
}

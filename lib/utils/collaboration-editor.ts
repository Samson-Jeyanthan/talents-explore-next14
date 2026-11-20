/** Values may be populated lookup documents or mobile dropdown selections. */
export function collaborationSelection(value: any): string {
  if (value == null) return "";
  if (typeof value === "object")
    return String(value._id ?? value.id ?? value.value ?? "");
  return String(value);
}

const present = (value: any) => typeof value === "string" && !!value.trim();
const date = (value: any) =>
  present(value) && Number.isFinite(Date.parse(value));
const coordinates = (value: any) =>
  value.longitude !== "" &&
  value.latitude !== "" &&
  Number.isFinite(Number(value.longitude)) &&
  Math.abs(Number(value.longitude)) <= 180 &&
  Number.isFinite(Number(value.latitude)) &&
  Math.abs(Number(value.latitude)) <= 90;

export function collaborationRoleError(role: any): string {
  if (!present(role.name) || !present(role.description))
    return "Enter the role name and description.";
  if (
    !role.skills?.length ||
    role.skills.some(
      (skill: any) =>
        !present(skill.mainCategoryId) || !present(skill.subCategoryId),
    )
  )
    return "Select a main category and subcategory for every skill.";
  if (!present(role.paymentDetails?.payment))
    return "Select the role payment option.";
  const amount = role.paymentDetails?.amount;
  if (
    amount !== "" &&
    amount != null &&
    (!Number.isFinite(Number(amount)) || Number(amount) < 0)
  )
    return "Enter a valid payment amount.";
  if (
    !["DATE_SETS", "BY_DATE", "BY_DAYS"].includes(role.timeLineType) ||
    !role.timeLine?.length
  )
    return "Add at least one role timeline.";
  for (const timeline of role.timeLine) {
    if (
      !["ONLINE", "MEETUP", "HYBRID"].includes(timeline.mode) ||
      !present(timeline.location) ||
      !coordinates(timeline)
    )
      return "Select a mode and location for every timeline.";
    if (
      role.timeLineType === "BY_DATE" &&
      (!date(timeline.startDate) ||
        !date(timeline.endDate) ||
        Date.parse(timeline.endDate) <= Date.parse(timeline.startDate))
    )
      return "Choose a timeline end date after its start date.";
    if (
      role.timeLineType === "BY_DAYS" &&
      !present(String(timeline.expectedDays ?? ""))
    )
      return "Enter the expected duration for every timeline.";
    if (
      role.timeLineType === "DATE_SETS" &&
      (!date(timeline.date) ||
        !/^\d{2}:\d{2}$/.test(timeline.startTime) ||
        !/^\d{2}:\d{2}$/.test(timeline.endTime) ||
        timeline.endTime <= timeline.startTime ||
        !present(timeline.title))
    )
      return "Add a schedule title, date, and end time after its start time.";
  }
  return "";
}

/** Validate steps individually as well as before the final network request. */
export function collaborationStepError(form: any, step: number): string {
  if (step === 0) {
    if (
      !present(form.title) ||
      !present(form.description) ||
      !present(form.location) ||
      !coordinates(form)
    )
      return "Enter a title, description, and project location.";
    if (!date(form.deadlineToApply))
      return "Choose a valid application deadline.";
    if (
      !present(String(form.expectedDays ?? "")) &&
      (!date(form.expectedStartDate) || !date(form.expectedEndDate))
    )
      return "Add an expected duration or both start and end dates.";
    if (
      (form.expectedStartDate || form.expectedEndDate) &&
      (!date(form.expectedStartDate) ||
        !date(form.expectedEndDate) ||
        Date.parse(form.expectedEndDate) <= Date.parse(form.expectedStartDate))
    )
      return "Choose an expected end date after the start date, or clear both dates.";
  }
  if (step === 1) {
    if (!form.roles?.length) return "Add at least one role.";
    for (let index = 0; index < form.roles.length; index++) {
      const error = collaborationRoleError(form.roles[index]);
      if (error) return `Role ${index + 1}: ${error}`;
    }
  }
  if (step === 2) {
    if (
      !present(form.productionInfo?.title) ||
      !present(form.productionInfo?.type)
    )
      return "Enter the production or company name and production type.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo?.email ?? ""))
      return "Enter a valid contact email address.";
    const audience = form.targetedAudience;
    if (
      !Number.isFinite(Number(audience.ageMin)) ||
      !Number.isFinite(Number(audience.ageMax)) ||
      Number(audience.ageMin) < 13 ||
      Number(audience.ageMax) > 100 ||
      Number(audience.ageMin) > Number(audience.ageMax)
    )
      return "Choose an audience age range between 13 and 100, with minimum before maximum.";
    if (
      !Number.isFinite(Number(audience.publicRating)) ||
      Number(audience.publicRating) < 0 ||
      Number(audience.publicRating) > 5
    )
      return "Choose a minimum public rating between 0 and 5.";
    if (audience.location && !coordinates(audience))
      return "Select a valid audience location.";
    if (
      form.links
        .split(",")
        .map((link: string) => link.trim())
        .filter(Boolean)
        .some((link: string) => {
          try {
            return !["http:", "https:"].includes(new URL(link).protocol);
          } catch {
            return true;
          }
        })
    )
      return "Enter complete http or https links, separated by commas.";
  }
  return "";
}

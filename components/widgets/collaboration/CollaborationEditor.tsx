"use client";

import { createCollaborationAction, updateCollaborationAction } from "@/actions/collaboration.action";
import { getSkillsAction, getSubCategoriesAction } from "@/actions/utils.action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPickerDialog, NativePickerField } from "@/components/widgets/collaboration/CollaborationFieldPickers";
import axiosInstance from "@/lib/config/axiosInstance";
import { GENDER_VALUES, LEVEL_VALUES } from "@/constants";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  mode: "create" | "edit";
  collaborationId?: string;
  currentUser: any;
  initialDetails?: any;
  lookupData: { mainCategories: any[]; languages: any[]; countries: any[]; ethnicities: any[]; professions: any[] };
};

const payments = ["PAID", "NON_PAID", "NEGOTIABLE", "EXPENSE_ONLY", "VOLUNTEER"];
const paymentTypes = ["PER_HOUR", "PER_DAY", "PER_WEEK", "PER_MONTH"];
const timelineTypes = ["DATE_SETS", "BY_DATE", "BY_DAYS"];
const modes = ["ONLINE", "MEETUP", "HYBRID"];

function toLocal(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toLocalDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toLocalTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
}

function toIso(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toIsoFromDateAndTime(date?: string, time?: string) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function readFirst(item: any, keys: string[]) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return "";
}

function mapLookup(items: any[], valueKeys: string[], labelKeys: string[]) {
  return (items || [])
    .map((item: any) => {
      const value = readFirst(item, valueKeys);
      const label = readFirst(item, labelKeys);

      if (!value || !label) {
        return null;
      }

      return { value, label };
    })
    .filter(Boolean) as { value: string; label: string }[];
}

function uploadFile(file: File, prefix: string, userName: string) {
  const ext = file.name.split(".").pop();
  const fileName = `${prefix}-${userName || "user"}-${Date.now()}.${ext}`;
  return axiosInstance.post("/s3/signedUrl", { fileName, contentType: file.type }).then(async (res) => {
    const signedUrl = res?.data?.url;
    const key = res?.data?.key;
    await fetch(signedUrl, { method: "PUT", body: file });
    return { url: String(signedUrl).split("?")[0], key };
  });
}

function emptyRole() {
  return {
    roleId: "",
    name: "",
    subtitle: "",
    description: "",
    ethnic: "",
    gender: "",
    languageSeeking: "",
    paymentDetails: { payment: "", currency: "", amount: "", type: "" },
    skills: [{ mainCategoryId: "", subCategoryId: "", skillId: null, level: null }],
    timeLineType: "BY_DATE",
    timeLine: [{ date: "", startTime: "", endTime: "", startDate: "", endDate: "", expectedDays: "", title: "", description: "", mode: "", location: "", longitude: 0, latitude: 0 }],
  };
}

function normalize(details?: any) {
  if (!details) {
    return {
      title: "", description: "", location: "", longitude: 0, latitude: 0, deadlineToApply: "", expectedStartDate: "", expectedEndDate: "", expectedDays: "",
      poster: { mediaType: "image", url: "", urlKey: "", thumbnailUrl: "", thumbnailUrlKey: "" },
      productionInfo: { title: "", type: "" }, contactInfo: { email: "", phone: "" }, links: "",
      targetedAudience: { professional: "", ethnic: "", language: "", ageMin: 13, ageMax: 60, gender: "", publicRating: 0, location: "", longitude: 0, latitude: 0 },
      roles: [] as any[], deleteRoleIds: [] as string[],
    };
  }
  const c = details?.collaboration || {};
  const a = c?.targetedAudience || {};
  const ages = String(a?.ageRange || "13-60").split("-");
  return {
    title: c?.title || "", description: c?.description || "", location: c?.location || "", longitude: c?.gpsLocation?.coordinates?.[0] || c?.longitude || 0, latitude: c?.gpsLocation?.coordinates?.[1] || c?.latitude || 0,
    deadlineToApply: toLocal(c?.deadlineToApply), expectedStartDate: toLocal(c?.expectedStartDate), expectedEndDate: toLocal(c?.expectedEndDate), expectedDays: c?.expectedDays || "",
    poster: { mediaType: c?.poster?.mediaType || "image", url: c?.poster?.url || "", urlKey: c?.poster?.urlKey || "", thumbnailUrl: c?.poster?.thumbnailUrl || "", thumbnailUrlKey: c?.poster?.thumbnailUrlKey || "" },
    productionInfo: { title: c?.productionInfo?.title || "", type: c?.productionInfo?.type || "" },
    contactInfo: { email: c?.contactInfo?.email || "", phone: c?.contactInfo?.phone || "" },
    links: Array.isArray(c?.links) ? c.links.join(", ") : "",
    targetedAudience: { professional: a?.professional || "", ethnic: a?.ethnic || "", language: a?.language || "", ageMin: Number(ages[0] || 13), ageMax: Number(ages[1] || 60), gender: a?.gender || "", publicRating: Number(a?.publicRating || 0), location: a?.location || "", longitude: a?.gpsLocation?.coordinates?.[0] || a?.longitude || 0, latitude: a?.gpsLocation?.coordinates?.[1] || a?.latitude || 0 },
    roles: Array.isArray(details?.roles) ? details.roles.map((r: any) => ({ roleId: r?._id || "", name: r?.name || "", subtitle: r?.subtitle || "", description: r?.description || "", ethnic: r?.ethnic || "", gender: r?.gender || "", languageSeeking: r?.languageSeeking || "", paymentDetails: { payment: r?.paymentDetails?.payment || "", currency: r?.paymentDetails?.currency || "", amount: r?.paymentDetails?.amount || "", type: r?.paymentDetails?.type || "" }, skills: (r?.skills || []).map((s: any) => ({ mainCategoryId: s?.mainCategoryId || "", subCategoryId: s?.subCategoryId || "", skillId: s?.skillId || null, level: s?.level || null })), timeLineType: r?.timeLineType || "BY_DATE", timeLine: (r?.timeLine || []).map((t: any) => ({ date: toLocalDate(t?.date), startTime: toLocalTime(t?.startTime), endTime: toLocalTime(t?.endTime), startDate: toLocal(t?.startDate), endDate: toLocal(t?.endDate), expectedDays: t?.expectedDays || "", title: t?.title || "", description: t?.description || "", mode: t?.mode || "", location: t?.location || "", longitude: t?.gpsLocation?.coordinates?.[0] || t?.longitude || 0, latitude: t?.gpsLocation?.coordinates?.[1] || t?.latitude || 0 })) })) : [],
    deleteRoleIds: [] as string[],
  };
}

export default function CollaborationEditor({ mode, collaborationId, currentUser, initialDetails, lookupData }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => normalize(initialDetails));
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [open, setOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(-1);
  const [draft, setDraft] = useState<any>(emptyRole());
  const [subCats, setSubCats] = useState<Record<number, any[]>>({});
  const [skills, setSkills] = useState<Record<number, any[]>>({});
  const [pending, startTransition] = useTransition();
  const [locationPicker, setLocationPicker] = useState<{ field: "project" | "target" | "timeline"; label: string; index?: number } | null>(null);

  const options = useMemo(() => ({
    main: mapLookup(lookupData.mainCategories || [], ["_id", "id"], ["name", "mainCategory", "title"]),
    language: mapLookup(lookupData.languages || [], ["_id", "id"], ["language", "name", "title"]),
    country: mapLookup(lookupData.countries || [], ["name", "country", "_id", "id"], ["name", "country", "title"]),
    ethnic: mapLookup(lookupData.ethnicities || [], ["_id", "id"], ["ethnic", "ethnicity", "name"]),
    professional: mapLookup(lookupData.professions || [], ["_id", "id"], ["professional", "profession", "name"]),
    gender: GENDER_VALUES.map((i) => ({ value: i.id, label: i.name })),
    level: LEVEL_VALUES.map((i) => ({ value: i._id, label: i.name })),
  }), [lookupData]);

  const setValue = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const setNested = (section: "productionInfo" | "contactInfo" | "targetedAudience", key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const selectComp = (value: string, placeholder: string, data: { value: string; label: string }[], onChange: (v: string) => void) => (
    <div className="grid gap-1">
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-dark-300 bg-dark-200 px-3 text-sm text-light-900 outline-none"
      >
        <option value="">{placeholder}</option>
        {data.map((option) => (
          <option key={`${placeholder}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {data.length === 0 ? (
        <p className="text-xs text-light-500">No options available right now.</p>
      ) : null}
    </div>
  );

  const openRole = (index = -1) => {
    setRoleIndex(index);
    setDraft(index >= 0 ? JSON.parse(JSON.stringify(form.roles[index])) : emptyRole());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function preloadRoleOptions() {
      const nextSubCats: Record<number, any[]> = {};
      const nextSkills: Record<number, any[]> = {};

      for (let index = 0; index < (draft.skills || []).length; index += 1) {
        const skill = draft.skills[index];

        if (skill?.mainCategoryId) {
          const subCategoryRes = await getSubCategoriesAction(skill.mainCategoryId);
          if (!cancelled) {
            nextSubCats[index] = subCategoryRes?.response || [];
          }
        }

        if (skill?.subCategoryId) {
          const skillRes = await getSkillsAction(skill.subCategoryId);
          if (!cancelled) {
            nextSkills[index] = skillRes?.response || [];
          }
        }
      }

      if (!cancelled) {
        setSubCats(nextSubCats);
        setSkills(nextSkills);
      }
    }

    preloadRoleOptions();

    return () => {
      cancelled = true;
    };
  }, [draft.skills, open]);

  const saveRole = () => {
    if (!draft.name || !draft.description || !(draft.skills || []).length || !(draft.timeLine || []).length) {
      toast.error("Please complete the role, skills, and timeline.");
      return;
    }
    setForm((prev: any) => {
      const roles = [...prev.roles];
      if (roleIndex >= 0) roles[roleIndex] = draft; else roles.push(draft);
      return { ...prev, roles };
    });
    setOpen(false);
  };

  const submit = () => startTransition(async () => {
    try {
      if (!form.title || !form.description || !form.location || !form.deadlineToApply) {
        toast.error("Please complete the basic collaboration details.");
        return;
      }

      if (!form.expectedDays && (!form.expectedStartDate || !form.expectedEndDate)) {
        toast.error("Add either expected days or both expected start and end dates.");
        return;
      }

      if (!form.roles.length) {
        toast.error("Please add at least one role.");
        return;
      }

      let poster = form.poster;
      if (posterFile) {
        const uploaded = await uploadFile(posterFile, "collaboration-poster", currentUser?.userName || "user");
        poster = { ...poster, mediaType: "image", url: uploaded.url, urlKey: uploaded.key };
      }
      const collaboration = {
        title: form.title, description: form.description, poster, location: form.location, longitude: Number(form.longitude || 0), latitude: Number(form.latitude || 0),
        deadlineToApply: toIso(form.deadlineToApply),
        expectedStartDate: toIso(form.expectedStartDate),
        expectedEndDate: toIso(form.expectedEndDate),
        expectedDays: form.expectedDays || "", productionInfo: form.productionInfo, contactInfo: form.contactInfo,
        links: form.links ? form.links.split(",").map((i: string) => i.trim()).filter(Boolean) : [],
        targetedAudience: { professional: form.targetedAudience.professional || null, ethnic: form.targetedAudience.ethnic || null, language: form.targetedAudience.language || null, ageRange: `${form.targetedAudience.ageMin}-${form.targetedAudience.ageMax}`, gender: form.targetedAudience.gender || null, publicRating: Number(form.targetedAudience.publicRating || 0), location: form.targetedAudience.location || "", longitude: Number(form.targetedAudience.longitude || 0), latitude: Number(form.targetedAudience.latitude || 0) },
      };
      const roles = form.roles.map((r: any) => ({ name: r.name, subtitle: r.subtitle || "", description: r.description, skills: r.skills.map((s: any) => ({ mainCategoryId: s.mainCategoryId || null, subCategoryId: s.subCategoryId || null, skillId: s.skillId || null, level: s.level || null })), ethnic: r.ethnic || null, gender: r.gender || null, languageSeeking: r.languageSeeking || null, paymentDetails: { payment: r.paymentDetails.payment, amount: r.paymentDetails.amount || null, type: r.paymentDetails.type || null, currency: r.paymentDetails.currency || null }, timeLineType: r.timeLineType, timeLine: r.timeLine.map((t: any) => ({ date: r.timeLineType === "DATE_SETS" ? toIso(t.date ? `${t.date}T00:00` : "") : null, startTime: r.timeLineType === "DATE_SETS" ? toIsoFromDateAndTime(t.date, t.startTime) : null, endTime: r.timeLineType === "DATE_SETS" ? toIsoFromDateAndTime(t.date, t.endTime) : null, startDate: r.timeLineType === "BY_DATE" ? toIso(t.startDate) : null, endDate: r.timeLineType === "BY_DATE" ? toIso(t.endDate) : null, expectedDays: r.timeLineType === "BY_DAYS" ? t.expectedDays || "" : "", title: t.title || "", description: t.description || "", mode: t.mode, location: t.location, longitude: Number(t.longitude || 0), latitude: Number(t.latitude || 0) })) }));
      const res = mode === "edit" && collaborationId
        ? await updateCollaborationAction(collaborationId, { collaboration, collaboratorRolesCreate: roles.filter((_r: any, i: number) => !form.roles[i].roleId), collaboratorRolesUpdate: roles.map((r: any, i: number) => form.roles[i].roleId ? ({ roleId: form.roles[i].roleId, data: r }) : null).filter(Boolean), deleteRoleIds: form.deleteRoleIds })
        : await createCollaborationAction({ collaboration, collaboratorRoles: roles });
      if (res?.status === "7400") {
        const id = collaborationId || res?.response?.collaboration?.id || res?.response?.collaboration?._id;
        if (mode === "edit") {
          window.location.assign(id ? `/collaboration/${id}` : "/collaboration");
          return;
        }
        window.location.assign(id ? `/collaboration/success/${id}` : "/collaboration");
        return;
      }
      toast.error(res?.message || "Failed to save collaboration");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save collaboration");
    }
  });

  return (
    <>
      <section className="flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-light-500">Collaboration {mode === "edit" ? "Edit" : "Create"}</p>
              <h1 className="pt-2 text-3xl font-semibold text-light-900">{mode === "edit" ? "Update collaboration" : "Create collaboration"}</h1>
            </div>
            <Link href={mode === "edit" && collaborationId ? `/collaboration/${collaborationId}` : "/collaboration"}><Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">Back</Button></Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{["01", "02", "03"].map((s, i) => <button key={s} type="button" className={`rounded-full px-4 py-2 text-sm ${step === i ? "bg-primary-500 text-light-900" : "bg-dark-200 text-light-500"}`} onClick={() => setStep(i)}>Step {s}</button>)}</div>
        </div>

        <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
          {step === 0 ? <div className="grid gap-4">
            <label className="flex min-h-[220px] cursor-pointer items-center justify-center rounded-[28px] border border-dashed border-dark-300 bg-dark-200">
              {posterPreview || form.poster.url ? <img src={posterPreview || form.poster.url} alt="Poster" className="max-h-[340px] w-full rounded-[28px] object-contain" /> : <span className="text-sm text-light-500">Upload poster / image</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0] || null; setPosterFile(file); if (file) setPosterPreview(URL.createObjectURL(file)); }} />
            </label>
            <Input value={form.title} onChange={(e) => setValue("title", e.target.value)} placeholder='Title eg- "Looking for a guitarist..."' className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
            <Textarea value={form.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Description" className="min-h-[220px] rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <p className="text-sm font-medium text-light-900">Project Location</p>
                <button type="button" onClick={() => setLocationPicker({ field: "project", label: "Select Location" })} className="h-11 rounded-2xl border border-dark-300 bg-dark-200 px-3 text-left text-sm text-light-900">
                  {form.location || "Select project location"}
                </button>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium text-light-900">Deadline to accept request</p>
                <NativePickerField
                  type="datetime-local"
                  value={form.deadlineToApply}
                  placeholder="Select deadline"
                  onChange={(value) => setValue("deadlineToApply", value)}
                />
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium text-light-900">Expected start date</p>
                <NativePickerField
                  type="datetime-local"
                  value={form.expectedStartDate}
                  placeholder="Select expected start date"
                  onChange={(value) => setValue("expectedStartDate", value)}
                />
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium text-light-900">Expected end date</p>
                <NativePickerField
                  type="datetime-local"
                  value={form.expectedEndDate}
                  placeholder="Select expected end date"
                  onChange={(value) => setValue("expectedEndDate", value)}
                />
              </div>
            </div>
            <Input value={form.expectedDays} onChange={(e) => setValue("expectedDays", e.target.value)} placeholder="Or expected days / weeks / months" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
          </div> : null}

          {step === 1 ? <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-light-900">Added Roles</h2><Button type="button" className="rounded-full bg-primary-500 text-light-900" onClick={() => openRole()}><Plus className="mr-2 size-4" />Add Role</Button></div>
            {form.roles.length === 0 ? <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-200 px-4 py-14 text-center text-sm text-light-500">You haven&apos;t added any roles yet.</div> : form.roles.map((role: any, index: number) => <div key={`role-${index}`} className="rounded-[28px] border border-dark-300 bg-dark-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold text-primary-500">{role.name}</p><p className="pt-1 text-sm text-light-500">{role.subtitle || "No subtitle"}</p></div><div className="flex gap-2"><Button type="button" className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300" onClick={() => openRole(index)}>Edit</Button><Button type="button" className="rounded-full bg-dark-250 text-custom-100 hover:bg-dark-300" onClick={() => setForm((prev: any) => { const roles = [...prev.roles]; const removed = roles[index]; roles.splice(index, 1); return { ...prev, roles, deleteRoleIds: removed?.roleId ? [...prev.deleteRoleIds, removed.roleId] : prev.deleteRoleIds }; })}><Trash2 className="mr-2 size-4" />Delete</Button></div></div><p className="pt-3 text-sm text-light-500">{role.description}</p></div>)}
          </div> : null}

          {step === 2 ? <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={form.productionInfo.title} onChange={(e) => setNested("productionInfo", "title", e.target.value)} placeholder="Production Title / Company" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
              <Input value={form.productionInfo.type} onChange={(e) => setNested("productionInfo", "type", e.target.value)} placeholder="Production Type" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
              <Input value={form.contactInfo.email} onChange={(e) => setNested("contactInfo", "email", e.target.value)} placeholder="Email Address" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
              <Input value={form.contactInfo.phone} onChange={(e) => setNested("contactInfo", "phone", e.target.value)} placeholder="Phone Number" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
            </div>
            <Input value={form.links} onChange={(e) => setValue("links", e.target.value)} placeholder="Comma separated relevant links" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900 placeholder:text-light-500" />
            <div className="rounded-[24px] border border-dark-300 bg-dark-200 p-4"><h3 className="text-lg font-semibold text-light-900">Customize Targeted Talents</h3><div className="mt-4 grid gap-4 md:grid-cols-2">
              {selectComp(form.targetedAudience.professional, "Profession", options.professional, (v) => setNested("targetedAudience", "professional", v))}
              {selectComp(form.targetedAudience.ethnic, "Ethnicity", options.ethnic, (v) => setNested("targetedAudience", "ethnic", v))}
              {selectComp(form.targetedAudience.gender, "Gender", options.gender, (v) => setNested("targetedAudience", "gender", v))}
              {selectComp(form.targetedAudience.language, "Language", options.language, (v) => setNested("targetedAudience", "language", v))}
              <Input type="number" value={String(form.targetedAudience.ageMin)} onChange={(e) => setNested("targetedAudience", "ageMin", Number(e.target.value || 0))} placeholder="Age min" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900" />
              <Input type="number" value={String(form.targetedAudience.ageMax)} onChange={(e) => setNested("targetedAudience", "ageMax", Number(e.target.value || 0))} placeholder="Age max" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900" />
              <Input type="number" min="0" max="5" step="0.5" value={String(form.targetedAudience.publicRating)} onChange={(e) => setNested("targetedAudience", "publicRating", Number(e.target.value || 0))} placeholder="Minimum public rating" className="h-11 rounded-2xl border-dark-300 bg-dark-200 text-light-900" />
              <div className="grid gap-2">
                <button type="button" onClick={() => setLocationPicker({ field: "target", label: "Select Targeted Location" })} className="h-11 rounded-2xl border border-dark-300 bg-dark-200 px-3 text-left text-sm text-light-900">
                  {form.targetedAudience.location || "Select targeted location"}
                </button>
              </div>
            </div></div>
          </div> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" disabled={step === 0} className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300" onClick={() => setStep((s) => Math.max(0, s - 1))}><ArrowLeft className="mr-2 size-4" />Previous</Button>
            {step < 2 ? <Button type="button" className="rounded-full bg-primary-500 text-light-900" onClick={() => setStep((s) => Math.min(2, s + 1))}>Next<ArrowRight className="ml-2 size-4" /></Button> : <Button type="button" disabled={pending} className="rounded-full bg-primary-500 text-light-900" onClick={submit}>{pending ? (mode === "edit" ? "Updating..." : "Posting...") : mode === "edit" ? "Update Post Request" : "Post Request"}</Button>}
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[28px] border-dark-300 bg-dark-200 text-light-900">
          <DialogHeader><DialogTitle className="text-2xl font-semibold text-light-900">{roleIndex >= 0 ? "Update Role" : "Add Role / Skill"}</DialogTitle><DialogDescription className="text-light-500">Add the role details, skill sets, payment, and timeline.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={draft.name} onChange={(e) => setDraft((p: any) => ({ ...p, name: e.target.value }))} placeholder="Role Name" className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" />
              <Input value={draft.subtitle} onChange={(e) => setDraft((p: any) => ({ ...p, subtitle: e.target.value }))} placeholder="Sub-title" className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" />
            </div>
            <Textarea value={draft.description} onChange={(e) => setDraft((p: any) => ({ ...p, description: e.target.value }))} placeholder="Description" className="min-h-[180px] rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" />
            <div className="grid gap-4 md:grid-cols-3">
              {selectComp(draft.ethnic, "Ethnicity", options.ethnic, (v) => setDraft((p: any) => ({ ...p, ethnic: v })))}
              {selectComp(draft.gender, "Gender", options.gender, (v) => setDraft((p: any) => ({ ...p, gender: v })))}
              {selectComp(draft.languageSeeking, "Language", options.language, (v) => setDraft((p: any) => ({ ...p, languageSeeking: v })))}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {selectComp(draft.paymentDetails.payment, "Payment", payments.map((i) => ({ value: i, label: i })), (v) => setDraft((p: any) => ({ ...p, paymentDetails: { ...p.paymentDetails, payment: v } })))}
              <Input value={draft.paymentDetails.currency} onChange={(e) => setDraft((p: any) => ({ ...p, paymentDetails: { ...p.paymentDetails, currency: e.target.value } }))} placeholder="Currency" className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" />
              <Input value={draft.paymentDetails.amount} onChange={(e) => setDraft((p: any) => ({ ...p, paymentDetails: { ...p.paymentDetails, amount: e.target.value } }))} placeholder="Amount" className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" />
              {selectComp(draft.paymentDetails.type, "Charge Type", paymentTypes.map((i) => ({ value: i, label: i })), (v) => setDraft((p: any) => ({ ...p, paymentDetails: { ...p.paymentDetails, type: v } })))}
            </div>
            <div className="rounded-[24px] border border-dark-300 bg-dark-250 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-semibold text-light-900">Skills</h3><Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300" onClick={() => setDraft((p: any) => ({ ...p, skills: [...p.skills, { mainCategoryId: "", subCategoryId: "", skillId: null, level: null }] }))}><Plus className="mr-2 size-4" />Add Skill</Button></div><div className="mt-4 grid gap-3">{draft.skills.map((skill: any, index: number) => <div key={`skill-${index}`} className="grid gap-3 rounded-[20px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-2 xl:grid-cols-4">
              {selectComp(skill.mainCategoryId, "Main Category", options.main, async (v) => { const res = await getSubCategoriesAction(v); setSubCats((p) => ({ ...p, [index]: res?.response || [] })); setSkills((p) => ({ ...p, [index]: [] })); setDraft((p: any) => { const skills = [...p.skills]; skills[index] = { ...skills[index], mainCategoryId: v, subCategoryId: "", skillId: null, level: null }; return { ...p, skills }; }); })}
              {selectComp(skill.subCategoryId, "Sub Category", (subCats[index] || []).map((i: any) => ({ value: String(i?._id || ""), label: String(i?.name || i?.subCategory || "") })), async (v) => { const res = await getSkillsAction(v); const nextOptions = res?.response || []; setSkills((p) => ({ ...p, [index]: nextOptions })); setDraft((p: any) => { const skills = [...p.skills]; skills[index] = { ...skills[index], subCategoryId: v, skillId: null, level: null }; return { ...p, skills }; }); })}
              {(skills[index] || []).length > 0 ? selectComp(skill.skillId, "Skill", (skills[index] || []).map((i: any) => ({ value: String(i?._id || ""), label: String(i?.name || i?.skill || "") })), (v) => setDraft((p: any) => { const skills = [...p.skills]; skills[index] = { ...skills[index], skillId: v }; return { ...p, skills }; })) : null}
              {(skills[index] || []).length > 0 ? selectComp(skill.level, "Level", options.level, (v) => setDraft((p: any) => { const skills = [...p.skills]; skills[index] = { ...skills[index], level: v }; return { ...p, skills }; })) : null}
            </div>)}</div></div>
            <div className="rounded-[24px] border border-dark-300 bg-dark-250 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="text-base font-semibold text-light-900">Timeline</h3><p className="text-xs text-light-500">Match the mobile flow by choosing one timeline style, then add the related dates and location.</p></div>{selectComp(draft.timeLineType, "Timeline Type", timelineTypes.map((i) => ({ value: i, label: i.replaceAll("_", " ") })), (v) => setDraft((p: any) => ({ ...p, timeLineType: v, timeLine: p.timeLine.length ? p.timeLine : [{ date: "", startTime: "", endTime: "", startDate: "", endDate: "", expectedDays: "", title: "", description: "", mode: "", location: "", longitude: 0, latitude: 0 }] })))}</div><div className="mt-4 grid gap-3">{draft.timeLine.map((t: any, index: number) => <div key={`time-${index}`} className="grid gap-3 rounded-[20px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-2 xl:grid-cols-3">
              {draft.timeLineType === "DATE_SETS" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">Date</p><NativePickerField type="date" value={t.date} placeholder="Select date" onChange={(value) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], date: value }; return { ...p, timeLine }; })} /></div> : null}
              {draft.timeLineType === "DATE_SETS" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">Start time</p><NativePickerField type="time" value={t.startTime} placeholder="Select start time" onChange={(value) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], startTime: value }; return { ...p, timeLine }; })} /></div> : null}
              {draft.timeLineType === "DATE_SETS" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">End time</p><NativePickerField type="time" value={t.endTime} placeholder="Select end time" onChange={(value) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], endTime: value }; return { ...p, timeLine }; })} /></div> : null}
              {draft.timeLineType === "BY_DATE" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">Start date</p><NativePickerField type="datetime-local" value={t.startDate} placeholder="Select start date" onChange={(value) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], startDate: value }; return { ...p, timeLine }; })} /></div> : null}
              {draft.timeLineType === "BY_DATE" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">End date</p><NativePickerField type="datetime-local" value={t.endDate} placeholder="Select end date" onChange={(value) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], endDate: value }; return { ...p, timeLine }; })} /></div> : null}
              {draft.timeLineType === "BY_DAYS" ? <div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.12em] text-light-500">Expected duration</p><Input value={t.expectedDays} onChange={(e) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], expectedDays: e.target.value }; return { ...p, timeLine }; })} placeholder="Expected days" className="h-11 rounded-2xl border-dark-300 bg-dark-250 text-light-900 placeholder:text-light-500" /></div> : null}
              {selectComp(t.mode, "Mode", modes.map((i) => ({ value: i, label: i })), (v) => setDraft((p: any) => { const timeLine = [...p.timeLine]; timeLine[index] = { ...timeLine[index], mode: v }; return { ...p, timeLine }; }))}
              <div className="grid gap-2">
                <button type="button" onClick={() => setLocationPicker({ field: "timeline", label: "Select Timeline Location", index })} className="h-11 rounded-2xl border border-dark-300 bg-dark-250 px-3 text-left text-sm text-light-900">
                  {t.location || "Select location"}
                </button>
              </div>
              <div className="flex items-end justify-end"><Button type="button" className="rounded-full bg-dark-250 text-custom-100 hover:bg-dark-300" onClick={() => setDraft((p: any) => ({ ...p, timeLine: p.timeLine.filter((_item: any, itemIndex: number) => itemIndex !== index) }))}><Trash2 className="mr-2 size-4" />Remove</Button></div>
            </div>)}<Button type="button" className="w-fit rounded-full bg-dark-200 text-light-900 hover:bg-dark-300" onClick={() => setDraft((p: any) => ({ ...p, timeLine: [...p.timeLine, { date: "", startTime: "", endTime: "", startDate: "", endDate: "", expectedDays: "", title: "", description: "", mode: "", location: "", longitude: 0, latitude: 0 }] }))}><Plus className="mr-2 size-4" />Add Timeline</Button></div></div>
          </div>
          <DialogFooter className="gap-2"><Button type="button" className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" className="rounded-full bg-primary-500 text-light-900" onClick={saveRole}>{roleIndex >= 0 ? "Update Role" : "Add Role"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <LocationPickerDialog
        open={Boolean(locationPicker)}
        title={locationPicker?.label || "Select Location"}
        initialAddress={
          locationPicker?.field === "project"
            ? form.location
            : locationPicker?.field === "target"
              ? form.targetedAudience.location
              : locationPicker?.field === "timeline" && locationPicker?.index !== undefined
                ? draft.timeLine?.[locationPicker.index]?.location || ""
                : ""
        }
        onClose={() => setLocationPicker(null)}
        onApply={({ address, latitude, longitude }) => {
          if (!locationPicker) return;

          if (locationPicker.field === "project") {
            setValue("location", address);
            setValue("latitude", latitude);
            setValue("longitude", longitude);
            return;
          }

          if (locationPicker.field === "target") {
            setNested("targetedAudience", "location", address);
            setNested("targetedAudience", "latitude", latitude);
            setNested("targetedAudience", "longitude", longitude);
            return;
          }

          if (locationPicker.field === "timeline" && locationPicker.index !== undefined) {
            setDraft((previous: any) => {
              const timeLine = [...previous.timeLine];
              timeLine[locationPicker.index] = {
                ...timeLine[locationPicker.index],
                location: address,
                latitude,
                longitude,
              };
              return { ...previous, timeLine };
            });
          }
        }}
      />
    </>
  );
}

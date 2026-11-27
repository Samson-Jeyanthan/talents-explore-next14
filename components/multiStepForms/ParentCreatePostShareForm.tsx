"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { CreatePostAboutForm, CreatePostCreditForm } from "@/components/forms";
import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import {
  createPostShareValidation,
  editPostShareValidation,
} from "@/lib/validations/post.validation";
import { EditablePost, getPostEditValues } from "@/lib/utils/postEditing";
import {
  getSkillsAction,
  getStatesAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import { MediaInput } from "@/components/inputs";
import { useUserContext } from "@/context/AuthProvider";
import { createPostShareAction, updatePostAction } from "@/actions/post.action";
import { toast } from "sonner";
import { TCredit, TPostShareMedia } from "@/types/post.types";
import { uploadFileToStorage, UploadedFile } from "@/lib/utils/uploadFile";
import { validatePostFile } from "@/lib/utils/postMedia";
import { useRouter } from "next/navigation";
import { Footer } from "../widgets";
import { townOptions } from "@/lib/utils/towns";

interface Props {
  langData: any;
  mainCategoryData: any;
  countryData: any;
  formType: "POST" | "SHARELINK";
  initialPost?: EditablePost;
  initialOptions?: { subcategories: any[]; skills: any[]; states: any[] };
}

type TShareLinkThumbnail =
  | string
  | {
      url: string;
      urlKey?: string | null;
    };

const ParentCreatePostShareForm = ({
  langData,
  mainCategoryData,
  countryData,
  formType,
  initialPost,
  initialOptions,
}: Props) => {
  const isEditing = Boolean(initialPost);
  const validation = isEditing
    ? editPostShareValidation
    : createPostShareValidation;
  const savedValues = initialPost ? getPostEditValues(initialPost) : undefined;
  const withSavedOption = (
    options: { _id: string; name: string }[],
    value?: string | null,
    label?: string,
  ) =>
    value && !options.some((option) => option._id === value)
      ? [...options, { _id: value, name: label || value }]
      : options;
  const LangOptions = (langData?.response || []).map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const mainCategoryOptions = (mainCategoryData?.response || []).map(
    (item: any) => ({
      _id: item._id,
      name: item.name,
    }),
  );

  const countryOptions = (countryData?.response || []).map((item: any) => ({
    _id: item.country,
    name: item.country,
  }));

  const router = useRouter();
  const { user } = useUserContext();
  const [page, setPage] = useState(0);
  const [processingMedia, setProcessingMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Uploading Post");
  const uploadedFiles = useRef(new WeakMap<File, UploadedFile>());
  const townRequest = useRef(0);
  const [townLoading, setTownLoading] = useState(false);
  const [townError, setTownError] = useState("");
  useEffect(
    () => () => {
      townRequest.current += 1;
    },
    [],
  );

  async function uploadPostFile(file: File, prefix: string, label: string) {
    const cached = uploadedFiles.current.get(file);
    if (cached) return cached;
    setUploadStatus(label);
    const result = await uploadFileToStorage(
      file,
      prefix,
      user?.username,
      (percent) => {
        setUploadStatus(`${label}: ${percent}%`);
      },
    );
    uploadedFiles.current.set(file, result);
    return result;
  }
  const [stateOptions, setStateOptions] = useState<
    { _id: string; name: string }[]
  >(
    withSavedOption(
      townOptions(initialOptions?.states),
      savedValues?.state,
    ),
  );
  const [subCategoryOptions, setSubCategoryOptions] = useState<
    { _id: string; name: string }[]
  >(
    withSavedOption(
      (initialOptions?.subcategories || []).map((item) => ({
        _id: item._id,
        name: item.name,
      })),
      savedValues?.subCategory,
      initialPost?.about?.subCategory,
    ),
  );
  const [skillOptions, setSkillOptions] = useState<
    { _id: string; name: string }[]
  >(
    withSavedOption(
      (initialOptions?.skills || []).map((item) => ({
        _id: item._id,
        name: item.name || item.skill,
      })),
      savedValues?.skill,
      initialPost?.about?.skill,
    ),
  );

  async function fetchSubcategories(mainCategory: string) {
    form.resetField("subCategory");
    form.setValue("skill", null);
    form.setValue("skillLevel", null);
    setSubCategoryOptions([]);
    setSkillOptions([]);
    try {
      const res = await getSubCategoriesAction(mainCategory);
      setSubCategoryOptions(
        (res?.response || []).map((item: any) => ({
          _id: item._id,
          name: item.name,
        })),
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function fetchSkills(subCategory: string) {
    form.setValue("skill", null);
    form.setValue("skillLevel", null);
    setSkillOptions([]);
    try {
      const res = await getSkillsAction(subCategory);
      const nextSkillOptions = (res?.response || []).map((item: any) => ({
        _id: item._id,
        name: item.name,
      }));
      setSkillOptions(nextSkillOptions);
      if (nextSkillOptions.length === 0) {
        form.setValue("skill", null);
        form.setValue("skillLevel", null);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function fetchStates(country: string) {
    const request = ++townRequest.current;
    // resetField would restore an edited post's previous country's town.
    form.setValue("state", "", { shouldDirty: true, shouldValidate: true });
    setStateOptions([]);
    setTownError("");
    setTownLoading(Boolean(country));
    if (!country) return;
    try {
      const res = await getStatesAction(country);
      if (request !== townRequest.current) return;
      if (res?.status !== "7400") {
        setTownError("Unable to load towns. Please try again.");
        return;
      }
      setStateOptions(townOptions(res.response));
    } catch {
      if (request === townRequest.current)
        setTownError("Unable to load towns. Please try again.");
    } finally {
      if (request === townRequest.current) setTownLoading(false);
    }
  }

  const form = useForm<z.infer<typeof createPostShareValidation>>({
    resolver: zodResolver(validation),
    defaultValues: {
      media: [],
      title: "",
      description: "",
      ownRating: 0,
      mainCategory: "",
      subCategory: "",
      skill: null,
      skillLevel: null,
      primaryLanguage: "",
      secondaryLanguage: "",
      country: "",
      state: "",
      peopleTag: [],
      keywords: "",
      // Credit form section
      isCreditWork: "",
      credit: [],
      productionName: "",
      productionDate: "",
      toolsUsed: [],
      // share form section
      website: "",
      shareLinkThumbnail: undefined,
      ...savedValues,
    },
  });

  const PAGE_ONE_FIELDS = [
    "title",
    "description",
    "mainCategory",
    "subCategory",
    "skill",
    "skillLevel",
    "primaryLanguage",
    "country",
    "state",
  ] as const;

  const onInvalid = (
    errors: FieldErrors<z.infer<typeof createPostShareValidation>>,
  ) => {
    const hasPageOneErrors = PAGE_ONE_FIELDS.some(
      (field) => errors[field] !== undefined,
    );

    if (hasPageOneErrors) {
      setPage(0);
      toast.error(
        "Please complete the required fields on page 1 before submitting.",
      );
    } else {
      toast.error("Please check the form for validation errors.");
    }
  };

  async function onSubmit(values: z.infer<typeof createPostShareValidation>) {
    if (processingMedia) {
      toast.error("Please finish selecting your media first.");
      return;
    }
    if (formType === "POST" && values.media.length === 0) {
      toast.error("Please add an image or video to your post.");
      return;
    }
    try {
      let website = values.website?.trim() || "";
      if (formType === "SHARELINK") {
        if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
        try {
          if (
            !["http:", "https:"].includes(new URL(website).protocol) ||
            !new URL(website).hostname.includes(".")
          )
            throw new Error();
        } catch {
          setPage(0);
          form.setError("website", {
            message: "Please enter a valid website link.",
          });
          return;
        }
        if (!values.shareLinkThumbnail) {
          setPage(0);
          toast.error("Please choose a thumbnail for this link.");
          return;
        }
      }
      // Validate every item before starting any upload.
      for (const item of values.media) {
        if (item.originalAsset) continue;
        if (!item.croppedData)
          throw new Error("Please select the media file again.");
        validatePostFile(item.croppedData);
        if (item.mediaType === "video" && !item.thumbnail)
          throw new Error(
            "Please select the video again to generate its thumbnail.",
          );
      }
      const formData = {
        type: formType,
        userId: user?.currentUserId,
        media: [] as TPostShareMedia[],
        website: formType === "POST" ? null : website,
        shareLinkThumbnail: (values.shareLinkThumbnail &&
        !(values.shareLinkThumbnail instanceof File)
          ? values.shareLinkThumbnail
          : null) as TShareLinkThumbnail | null,
        about: {
          title: values.title,
          description: values.description,
          mainCategoryId: values.mainCategory,
          subCategoryId: values.subCategory,
          skillId: values.skill,
          level: values.skillLevel,
          primaryLanguage: values.primaryLanguage,
          secondaryLanguage: values.secondaryLanguage
            ? values.secondaryLanguage
            : null,
          ownRating: values.ownRating,
          keywords: values.keywords,
          country: values.country,
          state: values.state,
          peopleTag: [] as any,
          productionName: values.productionName,
          productionDate: values.productionDate ? values.productionDate : null,
        },
        isCreditWork: values.isCreditWork === "true",
        credit: [] as TCredit[],
        toolsUsed: values.toolsUsed,
      };

      // Media upload
      for (let i = 0; i < values.media.length; i++) {
        const retained = values.media[i].originalAsset;
        if (retained) {
          formData.media.push(retained);
          continue;
        }
        const postShareMediaKey = await uploadPostFile(
          values.media[i].croppedData!,
          formType === "POST" ? "POST" : "SHARELINK",
          `Uploading file ${i + 1} of ${values.media.length}`,
        );
        const media: TPostShareMedia = {
          mediaType: values.media[i].mediaType,
          url: postShareMediaKey.url,
          urlKey: postShareMediaKey.key,
        };
        if (values.media[i].mediaType === "video") {
          const thumbnail = await uploadPostFile(
            values.media[i].thumbnail!,
            "POST-thumbnail",
            `Uploading thumbnail ${i + 1}`,
          );
          media.thumbnailUrl = thumbnail.url;
          media.thumbnailUrlkey = thumbnail.key;
        }
        formData.media.push(media);
      }

      // People tags
      for (const person of values.peopleTag) {
        formData.about.peopleTag.push(person._id);
      }

      // Credit title and people tags
      for (let i = 0; i < values.credit.length; i++) {
        const creditPeopleTag = [];

        for (let j = 0; j < values.credit[i].peopleTag.length; j++) {
          const creditPeopleTags = values.credit[i].peopleTag[j]._id;
          creditPeopleTag.push(creditPeopleTags);
        }
        const newCredit: any = {
          creditTitle: values.credit[i].creditTitle,
          peopleTag: creditPeopleTag,
        };
        formData.credit.push(newCredit);
      }

      // Share thumbnail upload
      if (
        formType === "SHARELINK" &&
        values.shareLinkThumbnail instanceof File
      ) {
        const shareLinkThumbnailKey = await uploadPostFile(
          values.shareLinkThumbnail,
          "share",
          "Uploading share thumbnail",
        );

        const shareLinkThumbnail = {
          url: shareLinkThumbnailKey.url,
          urlKey: shareLinkThumbnailKey.key,
        };
        formData.shareLinkThumbnail = shareLinkThumbnail;
      }

      setUploadStatus("Saving your post...");
      if (!formData.isCreditWork) formData.credit = [];
      const res = initialPost
        ? await updatePostAction(initialPost._id, formData)
        : await createPostShareAction(
            user.currentUserId,
            formData,
            formType === "POST" ? "POST" : "SHARELINK",
            "/home",
          );
      if (res?.status === "7400") {
        if (initialPost) {
          toast.success("Changes saved successfully.");
          router.push(`/post/${initialPost._id}`);
          router.refresh();
          return;
        }
        if (formType === "POST") {
          toast.success("Post created successfully", { duration: 4000 });
          router.push("/home");
        } else {
          toast.success("Share created successfully", { duration: 4000 });
          router.push("/home");
        }
      } else {
        toast.error(
          res?.message || "Could not save your post. Please try again.",
          { duration: 8000 },
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to upload your post. Please try again.",
        { duration: 5000 },
      );
    }
  }

  const handleNext = () => {
    setPage((currentPage) => currentPage + 1);
  };

  const handlePrevious = () => {
    setPage((currentPage) => currentPage - 1);
  };

  const postForm = [
    {
      form: (
        <CreatePostAboutForm
          form={form}
          langData={withSavedOption(
            withSavedOption(
              LangOptions,
              savedValues?.primaryLanguage,
              initialPost?.about?.primaryLanguage,
            ),
            savedValues?.secondaryLanguage,
            initialPost?.about?.secondaryLanguage,
          )}
          mainCategoryOptions={withSavedOption(
            mainCategoryOptions,
            savedValues?.mainCategory,
            initialPost?.about?.mainCategory,
          )}
          countryOptions={withSavedOption(countryOptions, savedValues?.country)}
          fetchStates={fetchStates}
          townLoading={townLoading}
          townError={townError}
          stateOptions={stateOptions}
          fetchSubcategories={fetchSubcategories}
          subCategoryOptions={subCategoryOptions}
          fetchSkills={fetchSkills}
          skillOptions={skillOptions}
          formType={formType}
        />
      ),
    },
    {
      form: <CreatePostCreditForm form={form} />,
    },
  ];

  return (
    <>
      {form.formState.isSubmitting && <TransparentLoader text={uploadStatus} />}
      <Form {...form}>
        <section className="flex w-full items-start justify-center gap-16">
          <form>
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <MediaInput
                  onProcessingChange={setProcessingMedia}
                  fieldChange={field.onChange}
                  values={form.getValues("media")}
                />
              )}
            />
          </form>
          <div className="flex w-full max-w-2xl flex-col gap-6">
            <header className="flex-between text-light-850">
              <h1 className="text-3xl font-semibold">
                {isEditing
                  ? formType === "POST"
                    ? "Edit Post"
                    : "Edit Shared Content"
                  : formType === "POST"
                    ? "Create Post"
                    : "Share Content"}
              </h1>
              <div className="flex items-center gap-2 rounded-md bg-dark-300 px-3 py-1.5">
                Step
                <span className="text-sm text-light-500">
                  0{page + 1}/0{postForm.length}
                </span>
              </div>
            </header>
            {postForm[page].form}

            <footer className="mt-5 flex w-full flex-col gap-5">
              {postForm.length - 1 === page ? (
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || processingMedia}
                  onClick={form.handleSubmit(onSubmit, onInvalid)}
                  className="shad-button_primary"
                >
                  {isEditing
                    ? "Save changes"
                    : formType === "POST"
                      ? "Upload Post"
                      : "Upload Share"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="shad-button_primary"
                >
                  Next
                </Button>
              )}

              {page > 0 && (
                <Button
                  onClick={handlePrevious}
                  className="shad-button_secondary"
                >
                  Back
                </Button>
              )}
              {initialPost && (
                <Button
                  type="button"
                  className="shad-button_secondary"
                  disabled={form.formState.isSubmitting}
                  onClick={() => router.push(`/post/${initialPost._id}`)}
                >
                  Cancel
                </Button>
              )}
            </footer>
          </div>
        </section>

        <div className="pt-12">
          <Footer />
        </div>
      </Form>
    </>
  );
};

export default ParentCreatePostShareForm;

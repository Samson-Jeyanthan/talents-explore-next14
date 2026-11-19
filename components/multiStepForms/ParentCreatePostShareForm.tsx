"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { CreatePostAboutForm, CreatePostCreditForm } from "@/components/forms";
import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { createPostShareValidation } from "@/lib/validations/post.validation";
import {
  getSkillsAction,
  getStatesAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import { MediaInput } from "@/components/inputs";
import { useUserContext } from "@/context/AuthProvider";
import { createPostShareAction } from "@/actions/post.action";
import { toast } from "sonner";
import { TCredit, TPostShareMedia } from "@/types/post.types";
import { uploadFileToStorage, UploadedFile } from "@/lib/utils/uploadFile";
import { validatePostFile } from "@/lib/utils/postMedia";
import { useRouter } from "next/navigation";
import { Footer } from "../widgets";

interface Props {
  langData: any;
  mainCategoryData: any;
  countryData: any;
  formType: "POST" | "SHARELINK";
}

type TShareLinkThumbnail = {
  url: string;
  urlKey: string;
};

const ParentCreatePostShareForm = ({
  langData,
  mainCategoryData,
  countryData,
  formType,
}: Props) => {
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
  const [stateOptions, setStateOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);

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
    form.resetField("state");
    setStateOptions([]);
    try {
      const res = await getStatesAction(country);
      console.log("states-res", res);
      setStateOptions(
        (res?.response || []).map((item: any) => ({
          _id: item.state || item.name || item,
          name: item.state || item.name || item,
        })),
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const form = useForm<z.infer<typeof createPostShareValidation>>({
    resolver: zodResolver(createPostShareValidation),
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
      // Validate every item before starting any upload.
      for (const item of values.media) {
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
        website: formType === "POST" ? null : values.website,
        shareLinkThumbnail: null as TShareLinkThumbnail | null,
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
        const postShareMediaKey = await uploadPostFile(
          values.media[i].croppedData,
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
      if (formType === "SHARELINK" && values.shareLinkThumbnail) {
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
      const res = await createPostShareAction(
        user.currentUserId,
        formData,
        formType === "POST" ? "POST" : "SHARELINK",
        "/home",
      );
      if (res?.status === "7400") {
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
          langData={LangOptions}
          mainCategoryOptions={mainCategoryOptions}
          countryOptions={countryOptions}
          fetchStates={fetchStates}
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
                {formType === "POST" ? "Create Post" : "Share Content"}
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
                  {formType === "POST" ? "Upload Post" : "Upload Share"}
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

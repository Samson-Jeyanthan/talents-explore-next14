"use client";

import { TextArea } from "../inputs";

const EditProInfoForm = ({ form, userData }: any) => {
  return (
    <form>
      <TextArea
        form={form}
        formLabel="Bio"
        inputName="bio"
        placeholder="What's on your mind...?"
        formDescription="Keep it positive: Let's create a supportive community by sharing constructive and respectful messages."
        maxLength={1000}
        className="h-60"
      />
    </form>
  );
};

export default EditProInfoForm;

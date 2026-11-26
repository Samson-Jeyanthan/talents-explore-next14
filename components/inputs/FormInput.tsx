import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";

type TInputProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  inputType: string;
  placeholder?: string;
  formDescription?: string;
  isAuthForm?: boolean;
};

const FormInput = ({
  form,
  formLabel,
  inputName,
  inputType,
  placeholder,
  formDescription,
  isAuthForm,
}: TInputProps) => {
  const InputComponent = inputType === "password" ? PasswordInput : Input;
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          {formLabel && (
            <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          )}
          <FormControl>
            <InputComponent
              type={inputType}
              placeholder={placeholder}
              {...field}
              {...(inputType === "password"
                ? { visibilityLabel: formLabel || placeholder || "password" }
                : {})}
              className={`${!isAuthForm ? "shad-form-input" : "shad-auth_form_input"}`}
            />
          </FormControl>
          <FormMessage className="shad-auth_form_message" />
          {formDescription && (
            <FormDescription className="text-[13px] text-light-600">
              {formDescription}
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
};

export default FormInput;

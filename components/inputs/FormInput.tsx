import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";

type TInputProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  inputType: string;
  placeholder?: string;
  formDescription?: string;
};

const FormInput = ({
  form,
  formLabel,
  inputName,
  inputType,
  placeholder,
  formDescription,
}: TInputProps) => {
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          <FormControl>
            <Input
              type={inputType}
              placeholder={placeholder}
              {...field}
              className="shad-auth_form_input"
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

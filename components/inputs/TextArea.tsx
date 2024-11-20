import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";

type TInputProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  placeholder?: string;
  maxLength?: number | undefined;
  formDescription?: string;
  className?: string;
};

const TextArea = ({
  form,
  formLabel,
  inputName,
  placeholder,
  maxLength,
  formDescription,
  className,
}: TInputProps) => {
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className={cn(className, `shad-auth_form_textarea resize-none`)}
              maxLength={maxLength}
              {...field}
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

export default TextArea;

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
import { ChangeEvent } from "react";

type TInputProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  placeholder?: string;
  maxLength?: number | undefined;
  showCharacterCount?: boolean;
  formDescription?: string;
  className?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
};

const TextArea = ({
  form,
  formLabel,
  inputName,
  placeholder,
  maxLength,
  showCharacterCount = false,
  formDescription,
  className,
  onChange,
}: TInputProps) => {
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          {formLabel && (
            <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          )}
          <div className="relative">
            <FormControl>
              <Textarea
                placeholder={placeholder}
                className={cn(
                  className,
                  "shad-auth_form_textarea resize-none",
                  showCharacterCount && "!pb-10",
                )}
                maxLength={maxLength}
                {...field}
                onChange={(e) => {
                  field.onChange(e); // keep react-hook-form in sync
                  onChange?.(e); // then call the custom handler
                }}
              />
            </FormControl>
            {showCharacterCount && maxLength !== undefined && (
              <span className="pointer-events-none absolute bottom-3 right-3 text-xs tabular-nums text-light-600">
                {String(field.value ?? "").length} / {maxLength} characters
              </span>
            )}
          </div>
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

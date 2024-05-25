import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TDropdownProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  placeholder?: string;
  options: { id: string; name: string }[];
  value: string | boolean | undefined;
  formDescription?: string;
};

const Dropdown = ({
  form,
  formLabel,
  inputName,
  placeholder,
  options,
  value,
  formDescription,
}: TDropdownProps) => {
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          <FormControl>
            <Select onValueChange={(id: string) => field.onChange(id)}>
              <SelectTrigger className="flex-between shad-auth_form_input">
                <SelectValue />
                {!value && (
                  <p className="flex w-full items-start text-light-500">
                    {placeholder}
                  </p>
                )}
              </SelectTrigger>
              <SelectContent className="shad-auth_form_select_option">
                {options.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option.id}
                    className="shad-auth_form_select_item"
                  >
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default Dropdown;

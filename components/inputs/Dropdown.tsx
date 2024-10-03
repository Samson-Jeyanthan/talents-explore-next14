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
  options: { _id: string; name: string }[];
  value: string | boolean | undefined;
  formDescription?: string;
  isModal?: boolean;
};

const Dropdown = ({
  form,
  formLabel,
  inputName,
  placeholder,
  options,
  value,
  formDescription,
  isModal,
}: TDropdownProps) => {
  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          <FormControl>
            <Select onValueChange={(_id: string) => field.onChange(_id)}>
              <SelectTrigger className="flex-between shad-auth_form_input">
                <SelectValue />
                {!value && (
                  <p className="flex w-full items-start text-light-500">
                    {placeholder}
                  </p>
                )}
              </SelectTrigger>
              <SelectContent
                className={`${isModal ? "z-[125]" : ""} shad-auth_form_select_option`}
              >
                {options.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option._id}
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

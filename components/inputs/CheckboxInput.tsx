import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "../ui/checkbox";

type TInputProps = {
  form: any;
  formLabel?: string;
  inputName: string;
  formDescription?: string;
  data: any[];
};

const CheckboxInput = ({
  form,
  formLabel,
  inputName,
  formDescription,
  data,
}: TInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      {formLabel && (
        <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
      )}
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name={inputName}
          render={() => (
            <FormItem className="flex flex-col gap-2">
              <div className="flex-start flex-wrap gap-6">
                {data?.map((item, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={inputName}
                    render={({ field }) => {
                      return (
                        <FormItem key={index} className="flex-center gap-2">
                          <FormControl>
                            <Checkbox
                              className="size-10 rounded border-none bg-dark-300 fill-light-900 text-light-900"
                              checked={field.value === item.id}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? item.id : "");
                              }}
                            />
                          </FormControl>
                          <FormLabel className="shad-auth_form_label pb-1">
                            {item.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage className="shad-auth_form_message" />
            </FormItem>
          )}
        />
      </div>
      {formDescription && (
        <FormDescription className="mt-2 text-[13px] text-light-600">
          {formDescription}
        </FormDescription>
      )}
    </div>
  );
};

export default CheckboxInput;

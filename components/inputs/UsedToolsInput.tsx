"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LEVEL_VALUES } from "@/constants";
import { MdClose } from "react-icons/md";
import { ToolTip } from "../others";

const UsedToolsInput = ({
  fieldChange,
  values,
}: {
  fieldChange: any;
  values: any;
}) => {
  const [tools, setTools] = useState({
    toolName: "",
    level: "",
  });
  const [addedTools, setAddedTools] = useState(values || []);

  const handleOkClick = () => {
    fieldChange([...addedTools, tools]);
    setAddedTools([...addedTools, tools]);
    setTools({ toolName: "", level: "" });
  };

  const handleToolsDelete = (index: number) => {
    const updatedTools = addedTools.filter(
      (_tool: any, i: number) => i !== index
    );
    fieldChange(updatedTools);
    setAddedTools(updatedTools);
  };

  return (
    <div className="flex flex-col gap-2">
      <ToolTip
        title="Tools Info"
        description="Tell us which tools you used and your skill level with each. This helps showcase your technical experience and workflow."
      />
      <div className="flex flex-wrap gap-2">
        {addedTools?.map((tool: any, index: number) => (
          <div
            key={index}
            className="flex w-max items-center justify-between gap-4 rounded-full bg-dark-400 px-3 py-2 text-sm text-light-500"
          >
            <p>
              {tool.toolName}&nbsp;-&nbsp;{tool.level}
            </p>
            <span className="cursor-pointer text-light-500 hover:text-light-900">
              <MdClose onClick={() => handleToolsDelete(index)} />
            </span>
          </div>
        ))}
      </div>
      <div className="flex w-full items-center gap-2">
        <Input
          value={tools.toolName}
          onChange={(e) => {
            setTools({
              ...tools,
              toolName: e.target.value,
            });
          }}
          placeholder="Name of the tool used ex - Photoshop"
          className="shad-auth_form_input"
        />

        <Select
          value={tools.level as string}
          onValueChange={(_id: string) => {
            setTools({
              ...tools,
              level: _id,
            });
          }}
        >
          <SelectTrigger className="flex-between shad-auth_form_input">
            {LEVEL_VALUES?.find((level) => level._id === tools.level)?.name || (
              <SelectValue />
            )}

            {!tools.level && (
              <p className="flex w-full items-start text-light-500">
                Select level
              </p>
            )}
          </SelectTrigger>
          <SelectContent className="shad-auth_form_select_option">
            {LEVEL_VALUES?.length > 0 &&
              LEVEL_VALUES?.map((level) => (
                <SelectItem
                  key={level._id}
                  value={level._id}
                  className="shad-auth_form_select_item"
                >
                  {level.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <footer className="flex w-full justify-end ">
        <div className="teritory-button" onClick={handleOkClick}>
          OK
        </div>
      </footer>
    </div>
  );
};

export default UsedToolsInput;

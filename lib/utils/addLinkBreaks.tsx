import Link from "next/link";
import React from "react";

export function addLineBreaks(text: string) {
  // Regular expression to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <>
      {text.split("\n").map((line, index) => (
        <React.Fragment key={index}>
          {line.split(urlRegex).map((part, idx) => {
            if (urlRegex.test(part)) {
              return (
                <Link
                  key={idx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer !font-medium !text-custom-lightBlue"
                >
                  {part}
                </Link>
              );
            } else {
              return (
                <p key={idx} className="text-light-500">
                  {part}
                </p>
              );
            }
          })}
          <div className="my-0.5" />
        </React.Fragment>
      ))}
    </>
  );
}

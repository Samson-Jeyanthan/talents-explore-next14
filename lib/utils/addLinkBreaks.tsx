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
                <a
                  key={idx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {part}
                </a>
              );
            } else {
              return <React.Fragment key={idx}>{part}</React.Fragment>;
            }
          })}
          <br />
        </React.Fragment>
      ))}
    </>
  );
}

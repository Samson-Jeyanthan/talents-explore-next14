import Link from "next/link";
import React from "react";

export function addLineBreaks(text: string) {
  // Regular expression to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <React.Fragment>
      {text.split("\n").map((line, index) => (
        <React.Fragment key={index}>
          {line.split(urlRegex).map((part, idx) => {
            if (urlRegex.test(part)) {
              return (
                <React.Fragment key={idx}>
                  <Link
                    key={idx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer !font-medium !text-blue-300"
                    style={{ color: "#1d4ed8" }}
                  >
                    {part}
                  </Link>
                  <br />
                  <br />
                </React.Fragment>
              );
            } else {
              return <p key={idx}>{part}</p>;
            }
          })}
          <div className="my-0.5" />
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

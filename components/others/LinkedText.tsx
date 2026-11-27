import { linkedTextParts } from "@/lib/utils/linked-text";

export default function LinkedText({
  text,
  inverted = false,
}: {
  text?: string | null;
  inverted?: boolean;
}) {
  return (
    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      {linkedTextParts(text).map((part, index) =>
        part.href ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium underline underline-offset-2 hover:no-underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 ${inverted ? "!text-blue-400 dark:!text-blue-600" : "!text-blue-600 dark:!text-blue-400"}`}
          >
            {part.text}
          </a>
        ) : (
          part.text
        ),
      )}
    </span>
  );
}

type Props = {
  media: string;
  mediaType?: string;
  videoThumbnail?: string | null;
};

export default function ChatMessageMedia({
  media,
  mediaType,
  videoThumbnail,
}: Props) {
  if (!/^https?:\/\//i.test(media))
    return <p className="text-xs">Attachment unavailable</p>;
  if (mediaType === "video")
    return (
      <video
        src={media}
        controls
        playsInline
        preload="metadata"
        poster={
          videoThumbnail && /^https?:\/\//i.test(videoThumbnail)
            ? videoThumbnail
            : undefined
        }
        className="mb-2 max-h-80 max-w-full rounded-[16px] border border-dark-300"
      />
    );
  return (
    <a
      href={media}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 block overflow-hidden rounded-[16px] border border-dark-300"
    >
      {mediaType === "image" || mediaType === "gif" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media}
          alt="Chat attachment"
          loading="lazy"
          className="max-h-80 max-w-full object-contain"
        />
      ) : (
        <span className="block px-4 py-6 text-center text-xs">
          Open attached {mediaType || "media"}
        </span>
      )}
    </a>
  );
}

import React from "react";

type Prop = {
  path: string | null | undefined;
};

const VideoAsImage = ({ path }: Prop) => {
  return (
    <video
      width="320"
      height="240"
      controls={false}
      autoPlay={false}
      controlsList="nodownload nofullscreen"
      preload="metadata"
      playsInline
      webkit-playsinline
    >
      <source src={path || ""} />
      {/* <track src={path || ""} kind="subtitles" srcLang="en" label="English" /> */}
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoAsImage;

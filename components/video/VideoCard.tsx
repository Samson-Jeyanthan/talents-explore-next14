"use client";

import React, { useRef, useEffect, useState } from "react";

const FALLBACK_IMAGE = "/assets/images/default-video-preview.png";

interface VideoCardProps {
  videoUrl: string;
  thumbnailUrl: string;
  isControl?: boolean;
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  videoUrl,
  thumbnailUrl,
  isControl,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  // Reset error state if the video URL changes
  useEffect(() => {
    setHasError(false);
  }, [videoUrl]);

  useEffect(() => {
    const handlePlay = () => {
      // Pause all other videos when one video starts playing
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((video) => {
        if (video !== videoRef.current) {
          video.pause();
        }
      });
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener("play", handlePlay);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("play", handlePlay);
      }
    };
  }, [hasError]);

  if (hasError || !videoUrl) {
    return (
      <div className="">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FALLBACK_IMAGE}
          alt="Video preview unavailable"
          width="100%"
          className={className || "rounded-md bg-dark-200 object-cover"}
        />
      </div>
    );
  }

  return (
    <div className="">
      <video
        ref={videoRef}
        controls={isControl}
        poster={thumbnailUrl || FALLBACK_IMAGE}
        className={className || "rounded-md bg-dark-200 object-cover"}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      >
        <source
          src={videoUrl}
          type="video/mp4"
          onError={() => setHasError(true)}
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoCard;

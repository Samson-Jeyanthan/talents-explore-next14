'use client';

import React, { useRef, useEffect } from 'react';

interface VideoCardProps {
    videoUrl: string;
    thumbnailUrl: string;
    videoRef?: (instance: HTMLVideoElement | null) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ videoUrl, thumbnailUrl, videoRef }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const handlePlay = () => {
            // Pause all other videos when one video starts playing
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach((video) => {
                if (video !== localVideoRef.current) {
                    video.pause();
                }
            });
        };

        const videoElement = localVideoRef.current;
        if (videoElement) {
            videoElement.addEventListener('play', handlePlay);
        }

        return () => {
            if (videoElement) {
                videoElement.removeEventListener('play', handlePlay);
            }
        };
    }, []);

    return (
        // eslint-disable-next-line tailwindcss/no-custom-classname
        <div className="video-card">
            <video
                ref={el => {
                    if (localVideoRef) {
                        (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                    }
                    if (videoRef) videoRef(el); // Use the videoRef passed from parent
                }}
                controls
                width="100%"
                poster={thumbnailUrl}
                className="rounded-md"
                controlsList={"nodownload"}
                onContextMenu={(e) => e.preventDefault()}
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoCard;

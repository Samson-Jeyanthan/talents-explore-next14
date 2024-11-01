'use client';

import React, { useRef, useEffect } from 'react';

interface VideoCardProps {
    videoUrl: string;
    thumbnailUrl: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ videoUrl, thumbnailUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        const handlePlay = () => {
            // Pause all other videos when one video starts playing
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach((video) => {
                if (video !== videoRef.current) {
                    video.pause();
                }
            });
        };

        const videoElement = videoRef.current;
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
        <div className="video-card">
            <video
                ref={videoRef}
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

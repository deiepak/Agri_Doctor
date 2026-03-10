'use client';

import { useState, useRef, useCallback } from 'react';

interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isStreaming: boolean;
    error: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    capturePhoto: () => string | null;
}

export function useCamera(): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);

            // Request camera access with preference for back camera on mobile
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: 'environment' }, // Back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsStreaming(true);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
            setError(errorMessage);
            console.error('Camera error:', err);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    }, []);

    const capturePhoto = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current || !isStreaming) {
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            return null;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 JPEG
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        return imageData;
    }, [isStreaming]);

    return {
        videoRef,
        canvasRef,
        isStreaming,
        error,
        startCamera,
        stopCamera,
        capturePhoto,
    };
}

'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    hasCamera: boolean;
    isOnline: boolean;
    userAgent: string;
}

export function useDeviceDetect(): DeviceInfo {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasCamera: false,
        isOnline: true,
        userAgent: '',
    });

    useEffect(() => {
        const detectDevice = async () => {
            const ua = navigator.userAgent.toLowerCase();
            const width = window.innerWidth;

            // Mobile detection using userAgent and screen width
            const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
            const isMobileUA = mobileKeywords.test(ua);
            const isMobileWidth = width < 768;

            // Tablet detection
            const isTabletWidth = width >= 768 && width < 1024;
            const isTablet = isTabletWidth || /ipad|tablet/i.test(ua);

            // Final mobile check (small screens or mobile UA, but not tablet)
            const isMobile = (isMobileUA || isMobileWidth) && !isTablet;

            // Desktop is everything else
            const isDesktop = !isMobile && !isTablet;

            // Camera detection
            let hasCamera = false;
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                hasCamera = devices.some(device => device.kind === 'videoinput');
            } catch {
                // Camera access not available
                hasCamera = false;
            }

            setDeviceInfo({
                isMobile,
                isTablet,
                isDesktop,
                hasCamera,
                isOnline: navigator.onLine,
                userAgent: ua,
            });
        };

        detectDevice();

        // Listen for online/offline changes
        const handleOnline = () => setDeviceInfo(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setDeviceInfo(prev => ({ ...prev, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for resize
        const handleResize = () => detectDevice();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return deviceInfo;
}

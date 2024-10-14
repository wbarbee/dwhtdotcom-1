import { useState, useEffect } from 'react';

export function useViewport() {
	const [viewportWidth, setViewportWidth] = useState(0);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const updateViewport = () => {
			setViewportWidth(window.innerWidth);
			setIsMobile(window.innerWidth <= 640);
		};

		updateViewport();
		window.addEventListener('resize', updateViewport);

		return () => window.removeEventListener('resize', updateViewport);
	}, []);

	return { viewportWidth, isMobile };
}

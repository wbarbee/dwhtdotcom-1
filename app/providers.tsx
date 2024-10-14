'use client';

import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Props = {
	children: React.ReactNode;
};

export default function Providers({ children }: Props) {
	return (
		<NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
			<NextUIProvider>{children}</NextUIProvider>
		</NextThemesProvider>
	);
}

import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import clsx from 'clsx';

import { fontSans } from '@/config/fonts';
import { ThemeSwitch } from '@/components/theme-switch';
import { NextUIProvider } from '@nextui-org/react';

export const metadata: Metadata = {
	title: 'Did we hook them?',
	description: 'A great source to find out if we hooked them or not.',
	icons: {
		icon: '/favicon.ico',
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: 'white' },
		{ media: '(prefers-color-scheme: dark)', color: 'black' },
	],
};

const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => (
	<NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
		{children}
	</NextThemesProvider>
);

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html suppressHydrationWarning lang='en'>
			<head />
			<body
				className={clsx(
					'min-h-screen bg-background font-sans antialiased',
					fontSans.variable
				)}>
				<AppThemeProvider>
					<NextUIProvider>
						<div className='relative flex flex-col h-screen'>
							<main className='container mx-auto max-w-7xl pt-16 px-6 flex-grow'>
								<ThemeSwitch />
								{children}
							</main>
							<footer className='w-full flex items-center justify-center py-3'></footer>
						</div>
					</NextUIProvider>
				</AppThemeProvider>
			</body>
		</html>
	);
}

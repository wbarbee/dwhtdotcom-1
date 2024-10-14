import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import Providers from './providers';
import { ThemeProvider } from 'next-themes';
import { ThemeSwitch } from '@/components/theme-switch';
import { fontSans } from '@/config/fonts';

export const metadata: Metadata = {
	title: 'Did we hook them?',
	description: 'A great source to find out if we hooked them.',
	icons: {
		icon: [
			{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
		],
		apple: [{ url: '/apple-touch-icon.png' }],
		other: [
			{ rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
			{ rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
		],
	},
	manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: 'white' },
		{ media: '(prefers-color-scheme: dark)', color: 'black' },
	],
};

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
				<Providers>
					<div className='relative flex flex-col h-screen'>
						<main className='container mx-auto max-w-7xl pt-16 px-6 flex-grow'>
							<ThemeSwitch />
							<ThemeProvider
								attribute='class'
								defaultTheme='system'
								enableSystem>
								{children}
							</ThemeProvider>
						</main>
						<footer className='w-full flex items-center justify-center py-3'></footer>
					</div>
				</Providers>
			</body>
		</html>
	);
}

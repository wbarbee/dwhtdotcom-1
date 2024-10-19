import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import Providers from './providers';
import { ThemeProvider } from 'next-themes';
import { ThemeSwitch } from '@/components/theme-switch';
import { fontSans } from '@/config/fonts';

const SITE_URL = 'https://www.didwehookthem.com';
const OPEN_GRAPH_IMAGE = `${SITE_URL}/opengraph-image.png`;
const SITE_DESCRIPTION =
	'The ultimate source for finding out if we hooked them. Get real-time updates, statistics, and insights.';

export const metadata: Metadata = {
	title: {
		default: 'Did we hook them? | A great source to find out if we hooked them',
		template: '%s | Did we hook them?',
	},
	description: SITE_DESCRIPTION,
	keywords: [
		'hook',
		'statistics',
		'real-time updates',
		'insights',
		'success rates',
	],
	authors: [{ name: 'Will Barbee', url: 'https://yourwebsite.com' }],
	creator: 'Will Barbee',
	publisher: 'Will Barbee',
	robots: 'index, follow',
	alternates: {
		canonical: 'https://www.didwehookthem.com',
	},
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://www.didwehookthem.com',
		siteName: 'Did we hook them?',
		title: 'Did we hook them? | A great source to find out if we hooked them',
		description: SITE_DESCRIPTION,
		images: [
			{
				url: OPEN_GRAPH_IMAGE,
				width: 1200,
				height: 630,
				alt: 'Did we hook them? - OG Image',
			},
		],
	},
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
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html suppressHydrationWarning lang='en'>
			<head>
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'WebSite',
							name: 'Did we hook them?',
							url: 'https://www.didwehookthem.com',
							description: SITE_DESCRIPTION,
							potentialAction: {
								'@type': 'SearchAction',
								target:
									'https://www.didwehookthem.com/search?q={search_term_string}',
								'query-input': 'required name=search_term_string',
							},
						}),
					}}
				/>
			</head>
			<body
				className={clsx(
					'min-h-screen bg-background font-sans antialiased',
					fontSans.variable
				)}>
				<Providers>
					<div className='relative flex flex-col h-screen'>
						<main className='container mx-auto max-w-7xl flex-grow'>
							<ThemeSwitch />
							<ThemeProvider
								attribute='class'
								defaultTheme='system'
								enableSystem>
								{children}
							</ThemeProvider>
						</main>
						<footer className='w-full items-center justify-center py-3 hidden'>
							<p>
								&copy; {new Date().getFullYear()} Did we hook them? All rights
								reserved.
							</p>
						</footer>
					</div>
				</Providers>
			</body>
		</html>
	);
}

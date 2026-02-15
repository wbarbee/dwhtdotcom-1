import { nextui } from '@nextui-org/theme';

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				burntOrange: {
					DEFAULT: '#c05700',
					50: '#fff7ed',
					100: '#ffedd5',
					200: '#fed7aa',
					300: '#fdba74',
					400: '#fb923c',
					500: '#c05700',
					600: '#a34a00',
					700: '#7c3800',
					800: '#5c2a00',
					900: '#3d1c00',
				},
				texas: {
					orange: '#bf5700',
					white: '#ffffff',
					charcoal: '#333f48',
					cream: '#d6d2c4',
				},
				surface: {
					50: '#fafafa',
					100: '#f5f5f4',
					200: '#e7e5e4',
					800: '#1c1917',
					850: '#171412',
					900: '#0c0a09',
					950: '#060504',
				},
				accent: {
					gold: '#d4a843',
					silver: '#a8a9ad',
					green: '#16a34a',
					red: '#dc2626',
				},
			},
			borderColor: {
				burntOrange: '#c05700',
			},
			animation: {
				'fade-in': 'fadeIn 0.65s ease-out',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pulse-opacity':
					'pulseOpacity 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				spin: 'spin 2s linear infinite',
				'slide-in-left': 'slideInLeft 0.65s ease-out forwards',
				'slide-in-right': 'slideInRight 0.65s ease-out forwards',
				'slide-in-left-no-fade': 'slideInLeftNoFade 0.65s ease-out forwards',
				'glow-pulse': 'glowPulse 3s ease-in-out infinite',
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)'],
				display: ['ESPN', 'Graduate', 'Arial', 'sans-serif'],
				body: ['var(--font-sans)'],
				score: ['Oxanium', 'sans-serif'],
				playfair: ['Playfair Display', 'serif'],
				gothic: ['Gothic A1', 'sans-serif'],
				oxanium: ['Oxanium', 'sans-serif'],
				menlo: [
					'Menlo',
					'Monaco',
					'Consolas',
					'"Liberation Mono"',
					'"Courier New"',
					'monospace',
				],
				graduate: ['Graduate', 'serif'],
				espn: ['ESPN', 'Arial', 'sans-serif'],
			},
			keyframes: {
				pulse: {
					'0%, 100%': { opacity: '1.0' },
					'50%': { opacity: '0.3' },
				},
				pulseOpacity: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' },
				},
				spin: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				fadeIn: {
					'0%': {
						opacity: '0',
					},
					'100%': {
						opacity: '1',
					},
				},
				slideInLeft: {
					'0%': {
						opacity: '0',
						transform: 'translateX(-50px)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)',
					},
				},
				slideInLeftNoFade: {
					'0%': {
						transform: 'translateX(-50px)',
					},
					'100%': {
						transform: 'translateX(0)',
					},
				},
				slideInRight: {
					'0%': {
						opacity: '0',
						transform: 'translateX(50px)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)',
					},
				},
				glowPulse: {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(192, 87, 0, 0.15)',
					},
					'50%': {
						boxShadow: '0 0 40px rgba(192, 87, 0, 0.3)',
					},
				},
			},
			backdropBlur: {
				xs: '2px',
			},
		},
	},
	darkMode: 'class',
	plugins: [nextui()],
};

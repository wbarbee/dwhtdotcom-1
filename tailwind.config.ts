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
				burntOrange: '#c05700',
			},
			borderColor: {
				burntOrange: '#c05700',
			},
			animation: {
				'fade-in': 'fadeIn 0.65s ease-out',
				'pulse-opacity': 'pulse 5s infinite',
				spin: 'spin 2s linear infinite',
				'slide-in-left': 'slideInLeft 0.65s ease-out forwards',
				'slide-in-right': 'slideInRight 0.65s ease-out forwards',
				'slide-in-left-no-fade': 'slideInLeftNoFade 0.65s ease-out forwards',
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)'],
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
			},
		},
	},
	darkMode: 'class',
	plugins: [nextui()],
};

'use client';
import { FC } from 'react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export interface ThemeSwitchProps {
	className?: string;
}

/** Shared scoreboard control look — calendar / theme / refresh. */
export const scoreboardControlClass =
	'inline-flex !items-center !justify-center !min-w-8 !w-8 !h-8 !p-0 !m-0 !rounded-full !bg-transparent !text-foreground/55 hover:!text-burntOrange hover:!bg-burntOrange/10 !border-0 !shadow-none !outline-none transition-colors';

export const scoreboardToolbarClass =
	'inline-flex items-center justify-center gap-0.5 p-0.5 rounded-full bg-foreground/[0.06] dark:bg-black/45 border border-foreground/10 dark:border-white/10 backdrop-blur-md';

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	return (
		<button
			type='button'
			className={clsx(scoreboardControlClass, className)}
			aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
		>
			{isDark ? (
				<Moon size={15} strokeWidth={1.75} aria-hidden />
			) : (
				<Sun size={15} strokeWidth={1.75} aria-hidden />
			)}
		</button>
	);
};

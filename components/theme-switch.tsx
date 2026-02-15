'use client';
import { FC } from 'react';
import clsx from 'clsx';
import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useIsSSR } from '@react-aria/ssr';
import { SwitchProps, useSwitch } from '@nextui-org/switch';
import { useTheme } from 'next-themes';

import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

export interface ThemeSwitchProps {
	className?: string;
	classNames?: SwitchProps['classNames'];
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
	className,
	classNames,
}) => {
	const { theme, setTheme } = useTheme();
	const isSSR = useIsSSR();

	const onChange = () => {
		if (theme === 'dark') {
			setTheme('light');
		} else {
			setTheme('dark');
		}
	};
	const shouldShowLightIcon = isSSR || theme === 'light';

	const { Component, slots, getBaseProps, getInputProps, getWrapperProps } =
		useSwitch({
			isSelected: shouldShowLightIcon,
			'aria-label': `Switch to ${shouldShowLightIcon ? 'dark' : 'light'} mode`,
			onChange,
		});

	return (
		<Component
			{...getBaseProps({
				className: clsx(
					'px-px transition-all hover:opacity-80 cursor-pointer fixed top-5 right-5 z-[14]',
					className,
					classNames?.base
				),
			})}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>
			<div
				{...getWrapperProps()}
				className={slots.wrapper({
					class: clsx(
						[
							'w-8 h-8',
							'bg-white/10 dark:bg-white/5',
							'backdrop-blur-sm',
							'border border-white/10',
							'rounded-full',
							'flex items-center justify-center',
							'group-data-[selected=true]:bg-white/10',
							'!text-foreground/60',
							'hover:!text-foreground',
							'transition-colors',
						],
						classNames?.wrapper
					),
				})}
			>
				{shouldShowLightIcon ? <SunIcon size={16} /> : <MoonIcon size={16} />}
			</div>
		</Component>
	);
};

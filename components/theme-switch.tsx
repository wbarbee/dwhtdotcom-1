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
					'px-px transition-opacity hover:opacity-80 cursor-pointer fixed top-6 right-6 z-[14]',
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
							'w-auto h-auto',
							'bg-transparent',
							'rounded-lg',
							'flex items-center justify-center',
							'group-data-[selected=true]:bg-transparent',
							'!text-default-500',
							'pt-px',
							'px-0',
							'mx-0',
						],
						classNames?.wrapper
					),
				})}
			>
				{shouldShowLightIcon ? <SunIcon /> : <MoonIcon />}
			</div>
		</Component>
	);
};

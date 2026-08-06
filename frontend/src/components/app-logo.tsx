import type { CSSProperties, ImgHTMLAttributes } from 'react';

import iconUrl from '@/assets/images/icon.png';

type AppLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  size?: number;
  decorative?: boolean;
};

export function AppLogo({ size = 20, decorative = true, style, ...props }: AppLogoProps) {
  const logoStyle: CSSProperties = {
    width: size,
    height: size,
    display: 'block',
    objectFit: 'contain',
    borderRadius: Math.max(8, Math.round(size * 0.24)),
    ...style,
  };

  return (
    <img
      {...props}
      src={iconUrl}
      alt={decorative ? '' : 'MatchMySize'}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      draggable={false}
      style={logoStyle}
    />
  );
}

export default AppLogo;

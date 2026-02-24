import React from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

const iconPaths: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d='M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z' />
      <path d='M9 21V12h6v9' />
    </>
  ),
  dumbbell: (
    <>
      <path d='M6 4v16M18 4v16' />
      <path d='M3 8h6M15 8h6M3 16h6M15 16h6' />
    </>
  ),
  utensils: (
    <>
      <path d='M3 2v7c0 1.66 1.34 3 3 3h2v10h2V12h2c1.66 0 3-1.34 3-3V2h-2v5H7V2H5v5H3V2H1v5' />
      <path d='M21 2v20h-2V13h-3V2h5z' />
    </>
  ),
  chart: <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />,
  user: (
    <>
      <circle cx='12' cy='8' r='4' />
      <path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' />
    </>
  ),
  plus: (
    <>
      <line x1='12' y1='5' x2='12' y2='19' />
      <line x1='5' y1='12' x2='19' y2='12' />
    </>
  ),
  fire: (
    <path d='M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-2.08-.64-4.01-1.73-5.61C18.63 8.5 16 10 16 10s1-3-2-5c0 0 .5 3-2 5S8 8 8 8C5.67 9.13 4 11.4 4 14c0 2.21 1.79 4 4 4h1a3 3 0 006 0h1c2.21 0 4-1.79 4-4 0-1.55-.56-2.97-1.48-4.07' />
  ),
  check: <polyline points='20 6 9 17 4 12' />,
  chevronRight: <polyline points='9 18 15 12 9 6' />,
  chevronLeft: <polyline points='15 18 9 12 15 6' />,
  x: (
    <>
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </>
  ),
  search: (
    <>
      <circle cx='11' cy='11' r='8' />
      <line x1='21' y1='21' x2='16.65' y2='16.65' />
    </>
  ),
  camera: (
    <>
      <path d='M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z' />
      <circle cx='12' cy='13' r='4' />
    </>
  ),
  water: <path d='M12 2.69l5.66 5.66a8 8 0 11-11.31 0z' />,
  apple: (
    <path d='M12 20.94c1.5.08 3.5-1.5 4-2 1.84-2 2.04-6 .5-8.5-.96-1.55-2.5-2.5-4-2.44-1.5-.06-3.04.9-4 2.44-1.54 2.5-1.34 6.5.5 8.5.5.5 2.5 2.08 4 2M12 11.5c.5 0 1-.5 1-1s-.5-1-1-1-1 .5-1 1 .5 1 1 1' />
  ),
  bell: (
    <>
      <path d='M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0' />
    </>
  ),
  settings: (
    <>
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' />
    </>
  ),
  trending: (
    <>
      <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
      <polyline points='17 6 23 6 23 12' />
    </>
  ),
  target: (
    <>
      <circle cx='12' cy='12' r='10' />
      <circle cx='12' cy='12' r='6' />
      <circle cx='12' cy='12' r='2' />
    </>
  ),
  zap: <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />,
  clock: (
    <>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </>
  ),
  repeat: (
    <>
      <polyline points='17 1 21 5 17 9' />
      <path d='M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4' />
      <path d='M21 13v2a4 4 0 01-4 4H3' />
    </>
  ),
  barcode: (
    <path d='M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M3 5h4M3 19h4M11 5h4M11 19h4M19 5h2M19 19h2' />
  ),
  star: (
    <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
  ),
  award: (
    <>
      <circle cx='12' cy='8' r='6' />
      <path d='M15.477 12.89L17 22l-5-3-5 3 1.523-9.11' />
    </>
  ),
  arrowLeft: (
    <>
      <line x1='19' y1='12' x2='5' y2='12' />
      <polyline points='12 19 5 12 12 5' />
    </>
  ),
  edit: (
    <>
      <path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' />
      <path d='M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' />
    </>
  ),
  mail: (
    <>
      <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
      <polyline points='22,6 12,13 2,6' />
    </>
  ),
  logout: (
    <>
      <path d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' />
      <polyline points='16 17 21 12 16 7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  className = '',
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {iconPaths[name]}
    </svg>
  )
}

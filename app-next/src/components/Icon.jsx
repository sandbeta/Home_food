const P = {
  home: <><path d="M4 11.2 12 4l8 7.2V20h-5v-5.5H9V20H4z" /></>,
  menu: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></>,
  pot: <><path d="M5 10h14l-1.6 9H6.6z" /><path d="M8 10V8.5A4 4 0 0 1 16 8.5V10" /><path d="M9 6.5c0-1 1-1.5 1.5-2.5M14.5 6.5c0-1 1-1.5 1.5-2.5" /></>,
  me: <><circle cx="12" cy="8.5" r="3.5" /><path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  back: <><path d="M15 5l-7 7 7 7" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  heart: <><path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z" /></>,
  star: <><path d="M12 3.8l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" /></>,
  arrow: <><path d="M7 12h10M13 8l4 4-4 4" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  trash: <><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
  edit: <><path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z" /><path d="M13.5 6.5L17 10" /></>,
  share: <><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  flame: <><path d="M12 3c1.5 3.2-.8 4.4-.8 6.4A2.8 2.8 0 0 0 14 12c1.8 0 3-1.4 3-3.2 2 2 3 4 3 6.2A8 8 0 0 1 4 15c0-4 2.6-7 5-9 0 2 .8 3 2 3.5C11 7 11.2 5 12 3z" /></>,
  sparkle: <><path d="M12 3.5l1.7 5.3 5.3 1.7-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7z" /></>,
  fridge: <><rect x="6" y="3.5" width="12" height="17" rx="2.5" /><path d="M6 10h12M9 6.5v1.5M9 13v1.5" /></>,
  wish: <><path d="M4 6.5h16v10H12l-4 3v-3H4z" /><path d="M12 8.5l.8 1.7 1.9.3-1.4 1.4.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.4 1.9-.3z" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4 8.2 8.2 0 1 0 20 14.5z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4h-4" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M4.5 16l4.5-4 3.5 3 3-2.5 4 4" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3.2 3.7M6.6 6.7C4.2 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  bowl: <><path d="M4 11h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z" /><path d="M9 8c0-1 1-1.5 1.5-2.5M14 8c0-1 1-1.5 1.5-2.5" /></>,
  list: <><path d="M8 7h12M8 12h12M8 17h12" /><circle cx="4.5" cy="7" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="17" r="1" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" /><path d="M15 6.5a3 3 0 0 1 0 5.5M17 19c-.2-2-1-3.6-2-4.6" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10h16M8 3.5v4M16 3.5v4" /></>,
  location: <><path d="M12 21s7-6.2 7-11A7 7 0 0 0 5 10c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
}

export default function Icon({ name, size = 24, fill = false, strokeWidth = 1.8, className = '', ...rest }) {
  const paths = P[name]
  if (!paths) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths}
    </svg>
  )
}

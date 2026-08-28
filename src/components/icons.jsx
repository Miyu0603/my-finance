/** Every icon in the app, defined once. Stroke icons inherit `currentColor`. */

const Stroke = ({ className = 'w-5 h-5', width = 1.5, children }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

export const IconHome = (p) => <Stroke {...p}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></Stroke>
export const IconBank = (p) => <Stroke {...p}><path d="M12 21V12m0-9L3 8v1h18V8l-9-5zM3 21h18M5 12v9m14-9v9M9 12v9m6-9v9" /></Stroke>
export const IconCard = (p) => <Stroke {...p}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></Stroke>
export const IconSettings = (p) => <Stroke {...p}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Stroke>
export const IconChevronLeft = (p) => <Stroke {...p}><path d="M15 19l-7-7 7-7" /></Stroke>
export const IconArrowRight = (p) => <Stroke {...p} width={2}><path d="M9 5l7 7-7 7" /></Stroke>
export const IconArrowDown = (p) => <Stroke {...p} width={2}><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></Stroke>
export const IconTrendUp = (p) => <Stroke {...p}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></Stroke>
export const IconTransfer = (p) => <Stroke {...p}><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></Stroke>
export const IconExchange = (p) => <Stroke {...p}><path d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" /></Stroke>
export const IconReceipt = (p) => <Stroke {...p}><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></Stroke>
export const IconEdit = (p) => <Stroke {...p}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></Stroke>
export const IconTrash = (p) => <Stroke {...p}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Stroke>
export const IconCheck = (p) => <Stroke {...p} width={2}><path d="M5 13l4 4L19 7" /></Stroke>
export const IconClose = (p) => <Stroke {...p} width={2}><path d="M6 18L18 6M6 6l12 12" /></Stroke>
export const IconPlus = (p) => <Stroke {...p} width={2}><path d="M12 4v16m8-8H4" /></Stroke>
export const IconMinus = (p) => <Stroke {...p} width={2}><path d="M20 12H4" /></Stroke>
export const IconCalendar = (p) => <Stroke {...p}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Stroke>
export const IconDollar = (p) => <Stroke {...p}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Stroke>
export const IconShield = (p) => <Stroke {...p}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></Stroke>
export const IconMoon = (p) => <Stroke {...p}><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></Stroke>
export const IconDownload = (p) => <Stroke {...p}><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></Stroke>
export const IconUpload = (p) => <Stroke {...p}><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5m0 0L7 8m5-5v12" /></Stroke>
export const IconUndo = (p) => <Stroke {...p}><path d="M3 10h10a5 5 0 010 10h-3M3 10l4-4M3 10l4 4" /></Stroke>
export const IconHistory = (p) => <Stroke {...p}><path d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></Stroke>
export const IconWarning = (p) => <Stroke {...p}><path d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></Stroke>

export const IconFaceId = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 3H5a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2m0-10V5a2 2 0 00-2-2h-2" />
    <circle cx="9" cy="10" r="0.5" fill="currentColor" />
    <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    <path d="M9.5 15a3.5 3.5 0 005 0" />
    <line x1="12" y1="10" x2="12" y2="13.5" />
  </svg>
)

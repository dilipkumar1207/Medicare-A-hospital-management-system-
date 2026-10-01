import React from 'react'

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' }

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>
)
export const UserPlusIcon = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M19 8v6M22 11h-6"/></svg>
)
export const UsersIcon = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="4"/><path d="M1 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/><path d="M17 4.5a4 4 0 0 1 0 7.9"/><path d="M23 21v-1a5.6 5.6 0 0 0-3.5-5.2"/></svg>
)
export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
)
export const GridIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
)
export const PlusSquareIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
)
export const ListIcon = (p) => (
  <svg {...base} {...p}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
)
export const CalendarCheckIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
)
export const LogInIcon = (p) => (
  <svg {...base} {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>
)
export const LogOutIcon = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
)
export const SearchIcon = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
)
export const XIcon = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>
)
export const TrashIcon = (p) => (
  <svg {...base} {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
)
export const EditIcon = (p) => (
  <svg {...base} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
)
export const ClockIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
)
export const StarIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><path d="m12 2 3.1 6.6 7.2.9-5.4 5 1.5 7.2L12 18l-6.4 3.7 1.5-7.2-5.4-5 7.2-.9Z"/></svg>
)
export const ChevronDownIcon = (p) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6"/></svg>
)
export const UploadIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
)
export const ImageIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
)
export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
)
export const MailIcon = (p) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
)
export const LockIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)
export const EyeIcon = (p) => (
  <svg {...base} {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)
export const EyeOffIcon = (p) => (
  <svg {...base} {...p}><path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a13.2 13.2 0 0 1-3.2 3.9M6.6 6.6C3.4 8.6 1 12 1 12s4 7 11 7a10.9 10.9 0 0 0 4.2-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M1 1l22 22"/></svg>
)
export const RupeeIcon = (p) => (
  <svg {...base} {...p}><path d="M6 3h12M6 8h12M6 3c0 6 3 8 3 8H6l7 8"/></svg>
)
export const CheckCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
)
export const XCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
)
export const AlertCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
)
export const ActivityIcon = (p) => (
  <svg {...base} {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
)
export const StethoscopeIcon = (p) => (
  <svg {...base} {...p}><path d="M4 3v7a5 5 0 0 0 10 0V3"/><path d="M9 14v2a5 5 0 0 0 10 0v-2.5"/><circle cx="19" cy="9" r="2"/></svg>
)
export const RefreshIcon = (p) => (
  <svg {...base} {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
)
export const LoaderIcon = (p) => (
  <svg {...base} {...p}><path d="M12 2v4M12 18v4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M2 12h4M18 12h4M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9"/></svg>
)

import React from "react";

export const Icon = ({ d, size = 16, stroke = 1.6, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

export const I = {
  dashboard: (p) => (
    <Icon {...p} d={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />
  ),
  filing: (p) => (
    <Icon {...p} d={<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>} />
  ),
  config: (p) => (
    <Icon {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>} />
  ),
  users: (p) => (
    <Icon {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>} />
  ),
  globe: (p) => (
    <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>} />
  ),
  shield: (p) => (
    <Icon {...p} d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>} />
  ),
  bell: (p) => (
    <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />
  ),
  bolt: (p) => <Icon {...p} d="m13 2-9 12h7l-1 8 9-12h-7z" />,
  inbox: (p) => (
    <Icon {...p} d={<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>} />
  ),
  archive: (p) => (
    <Icon {...p} d={<><rect x="2" y="4" width="20" height="5" rx="1" /><path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" /><path d="M10 13h4" /></>} />
  ),
  book: (p) => (
    <Icon {...p} d={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>} />
  ),
  search: (p) => (
    <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
  ),
  chev: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  chevR: (p) => <Icon {...p} d="m9 6 6 6-6 6" />,
  chevL: (p) => <Icon {...p} d="m15 6-6 6 6 6" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  filter: (p) => <Icon {...p} d="M22 3H2l8 9.5V19l4 2v-8.5z" />,
  download: (p) => (
    <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>} />
  ),
  upload: (p) => (
    <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>} />
  ),
  more: (p) => (
    <Icon {...p} d={<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>} />
  ),
  check: (p) => <Icon {...p} d="M20 6 9 17l-5-5" />,
  x: (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />,
  ext: (p) => (
    <Icon {...p} d={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></>} />
  ),
  refresh: (p) => (
    <Icon {...p} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>} />
  ),
  calendar: (p) => (
    <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />
  ),
  building: (p) => (
    <Icon {...p} d={<><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2" /></>} />
  ),
  alert: (p) => (
    <Icon {...p} d={<><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>} />
  ),
  sparkle: (p) => (
    <Icon {...p} d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>} />
  ),
  command: (p) => (
    <Icon {...p} d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  ),
  panel: (p) => (
    <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>} />
  ),
  flag: (p) => (
    <Icon {...p} d={<><path d="M4 22V4" /><path d="M4 4h14l-2 5 2 5H4" /></>} />
  ),
  user: (p) => (
    <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />
  ),
  logout: (p) => (
    <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>} />
  ),
  arrowUp: (p) => <Icon {...p} d="m6 15 6-6 6 6" />,
  arrowDn: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  dot: (p) => <Icon {...p} d={<circle cx="12" cy="12" r="3" fill="currentColor" />} />,
  dataform: (p) => (
    <Icon {...p} d={<><path d="M15 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M21 9H3" /><path d="M21 15H3" /></>} />
  ),
  postreporting: (p) => (
    <Icon {...p} d={<><path d="M16 5H3" /><path d="M16 12H3" /><path d="M11 19H3" /><path d="m15 18 2 2 4-4" /></>} />
  ),
  fireconfiguration: (p) => (
    <Icon {...p} d={<><path d="M10 15H6a4 4 0 0 0-4 4v2" /><path d="m14.305 16.53.923-.382" /><path d="m15.228 13.852-.923-.383" /><path d="m16.852 12.228-.383-.923" /><path d="m16.852 17.772-.383.924" /><path d="m19.148 12.228.383-.923" /><path d="m19.53 18.696-.382-.924" /><path d="m20.772 13.852.924-.383" /><path d="m20.772 16.148.924.383" /><circle cx="18" cy="15" r="3" /><circle cx="9" cy="7" r="4" /></>} />
  ),
  helpdocs: (p) => (
    <Icon {...p} d={<><path d="M12 13v8" /><path d="M12 3v3" /><path d="M2.354 10.354a1.207 1.207 0 0 1 0-1.708l2.06-2.06A2 2 0 0 1 5.828 6h12.344a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H5.828a2 2 0 0 1-1.414-.586z" /></>} />
  ),
  menu: (p) => <Icon {...p} d={<><path d="M3 12h18M3 6h18M3 18h18" /></>} />,
  wide: (p) => (
    <Icon {...p} d={<><path d="M16 12h6" /><path d="M8 12H2" /><path d="M12 2v2" /><path d="M12 8v2" /><path d="M12 14v2" /><path d="M12 20v2" /><path d="m19 15 3-3-3-3" /><path d="m5 9-3 3 3 3" /></>} />
  ),
  narrow: (p) => (
    <Icon {...p} d={<><path d="M22 12h-6" /><path d="M12 2v2" /><path d="M12 8v2" /><path d="M12 14v2" /><path d="M12 20v2" /><path d="m19 9-3 3 3 3" /><path d="m5 15 3-3-3-3" /><path d="m5 9-3 3 3 3" /></>} />
  ),
  packageClosed: (p) => (
    <Icon {...p} d={<><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><polyline points="3.29 7 12 12 20.71 7" /><path d="m7.5 4.27 9 5.15" /></>} />
  ),
  packageOpen: (p) => (
    <Icon {...p} d={<><path d="M12 22v-9" /><path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" /><path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" /><path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" /></>} />
  ),
  news: (p) => (
    <Icon {...p} d={<><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></>} />
  ),
  packageCheck: (p) => (
    <Icon {...p} d={<><path d="M12 22V12"/><path d="m16 17 2 2 4-4"/><path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"/><path d="M3.29 7 12 12l8.71-5"/><path d="m7.5 4.27 8.997 5.148"/></>} />
  ),
 notebookTabs: (p) => (
    <Icon {...p} d={<><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M15 2v20"/><path d="M15 7h5"/><path d="M15 12h5"/><path d="M15 17h5"/></>} />
  ),
 house: (p) => (
    <Icon {...p} d={<><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>} />
  ),

};


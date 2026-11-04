// Line icons for the landing page. Inline SVG with currentColor so they
// follow the surrounding text colour and need no network requests.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const PATHS = {
  pos: (<><rect x="3" y="4" width="18" height="12" rx="2.5" /><path d="M7 20h10M12 16v4M7 8h4M7 11h7" /></>),
  box: (<><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  truck: (<><path d="M2 6h11v10H2zM13 10h4l4 4v2h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
  wallet: (<><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2M7 6V4.5A1.5 1.5 0 0 1 8.5 3H17" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2" /></>),
  pill: (<><path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z" /><path d="m7 7 7 7" /></>),
  basket: (<><path d="M3 10h18l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.3a1.5 1.5 0 0 1-1.5-1.3z" /><path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3" /></>),
  shirt: (<><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3c-.5 1.7-2 3-4 3s-3.5-1.3-4-3Z" /></>),
  chip: (<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>),
  wrench: (<><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z" /><path d="M14.5 6.5 17 4l3 3-2.5 2.5" /></>),
  boxes: (<><rect x="3" y="12" width="8" height="8" rx="1.5" /><rect x="13" y="12" width="8" height="8" rx="1.5" /><rect x="8" y="3" width="8" height="8" rx="1.5" /></>),
  check: (<path d="m5 12.5 4.5 4.5L19 7.5" />),
  arrow: (<path d="M5 12h14M13 6l6 6-6 6" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  trend: (<path d="m3 17 6-6 4 4 8-8M15 7h6v6" />),
  alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" /></>),
  layers: (<><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>),
  x: (<><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>),
  bell: (<><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  star: (<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h16" />),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
  shield: (<><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  download: (<path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />),
  upload: (<path d="M12 20V9m-5 5 5-5 5 5M5 4h14" />),
};

export default function Icon({ name, size = 20, ...rest }) {
  return (
    <svg width={size} height={size} {...base} {...rest}>
      {PATHS[name]}
    </svg>
  );
}

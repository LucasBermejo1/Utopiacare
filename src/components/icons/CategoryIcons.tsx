type IconProps = { className?: string };

const stroke = "hsl(var(--foreground))";
const fill = "none";
const round = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const sw = 2.2; // trazo más marcado como en el mock
const accent = "hsl(var(--terracotta))"; // tono terracota de Utopia

export const IconCleanser = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* Tubo inclinado estilo mock */}
    <g transform="rotate(-22 12 12)">
      {/* cuerpo */}
      <defs>
        <clipPath id="clip-cleanser-body">
          <rect x="6.6" y="4.2" width="10.8" height="14.6" rx="3.9" />
        </clipPath>
      </defs>
      <rect x="6.6" y="4.2" width="10.8" height="14.6" rx="3.9" stroke={stroke} strokeWidth={sw} fill={fill} />
      {/* líquido diagonal dentro del cuerpo */}
      <g clipPath="url(#clip-cleanser-body)">
        <path d="M6.6 13 L17.4 9.8 L17.4 18.8 L6.6 18.8 Z" fill={accent} />
        {/* franja blanca en base */}
        <rect x="7.8" y="18.2" width="8.4" height="1.3" rx="0.65" fill="#ffffff" />
      </g>
      {/* tapón inferior */}
      <rect x="9.4" y="19.1" width="6.2" height="2.2" rx="1.1" fill={accent} />
      {/* burbujas (huecas) */}
      <circle cx="10.2" cy="10.7" r="1.0" fill="none" stroke={stroke} strokeWidth={sw-0.6} />
      <circle cx="12.2" cy="11.5" r="0.65" fill="none" stroke={stroke} strokeWidth={sw-0.6} />
      <circle cx="9.2" cy="12.9" r="0.85" fill="none" stroke={stroke} strokeWidth={sw-0.6} />
    </g>
  </svg>
);

export const IconExfoliant = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* Botella con dispensador */}
    <rect x="7.2" y="6.8" width="9.6" height="11.2" rx="3" stroke={stroke} strokeWidth={sw} fill={fill} />
    <rect x="9" y="4.8" width="6" height="2.2" rx="1.1" stroke={stroke} strokeWidth={sw} fill={fill} />
    <path d="M12 4.8V3.2" stroke={stroke} strokeWidth={sw} {...round} />
    <path d="M15.2 7.6H8.8" stroke={stroke} strokeWidth={sw} {...round} />
    {/* Banda inferior y puntos */}
    <rect x="8.2" y="14.2" width="7.6" height="2.8" rx="1.4" fill={accent} />
    <circle cx="10" cy="16.2" r=".25" fill={stroke} />
    <circle cx="11.5" cy="16.5" r=".25" fill={stroke} />
    <circle cx="13.2" cy="16.1" r=".25" fill={stroke} />
    <circle cx="14.6" cy="16.6" r=".25" fill={stroke} />
  </svg>
);

export const IconToner = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* cuello */}
    <rect x="10" y="4" width="4" height="2.5" rx="1.2" stroke={stroke} strokeWidth={sw} fill={fill} />
    {/* cuerpo */}
    <rect x="8" y="6.5" width="8" height="12.5" rx="3.5" stroke={stroke} strokeWidth={sw} fill={fill} />
    {/* líquido y burbujas */}
    <rect x="8.8" y="14" width="6.4" height="3.2" rx="1.6" fill={accent} />
    <circle cx="10.2" cy="12.2" r=".35" fill={stroke} />
    <circle cx="12" cy="11.6" r=".45" fill={stroke} />
    <circle cx="13.5" cy="12.6" r=".35" fill={stroke} />
  </svg>
);

export const IconTreatment = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* Goterito */}
    <rect x="9.4" y="4" width="5.2" height="2.8" rx="1.4" stroke={stroke} strokeWidth={sw} fill={fill} />
    <rect x="9" y="6.4" width="6" height="11" rx="3" stroke={stroke} strokeWidth={sw} fill={fill} />
    <path d="M12 8.2v5.2" stroke={stroke} strokeWidth={sw} {...round} />
    <path d="M12 16.2c-.9 1.2-.9 2.2 0 3.2 0 0 .9-1 0-3.2z" fill={accent} />
  </svg>
);

export const IconMask = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="5" y="6" width="14" height="12" rx="7" stroke={stroke} strokeWidth={sw} fill={fill} />
    <circle cx="9" cy="11" r="1.1" fill={accent} />
    <circle cx="15" cy="11" r="1.1" fill={accent} />
    <path d="M9.8 14.2c.9.7 3.5.7 4.4 0" stroke={stroke} strokeWidth={sw-0.4} {...round} />
    {/* espátula */}
    <rect x="16.6" y="8.5" width="1.6" height="7.5" rx="0.8" stroke={stroke} strokeWidth={sw-0.4} fill={accent} />
    <rect x="15.8" y="8" width="3.2" height="2.8" rx="1.4" stroke={stroke} strokeWidth={sw-0.4} fill={fill} />
  </svg>
);

export const IconMoisturizer = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* tarro con tapa */}
    <rect x="6" y="12" width="12" height="6.5" rx="2.8" stroke={stroke} strokeWidth={sw} fill={fill} />
    <rect x="6.8" y="10.6" width="10.4" height="2.2" rx="1.1" stroke={stroke} strokeWidth={sw} fill={fill} />
    {/* hoja */}
    <path d="M12 14.6c1.9-.2 3 .8 3 .8s-1 .8-3 .8-3-.8-3-.8 1.1-1 3-.8z" fill={accent} />
  </svg>
);

export const IconEye = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" stroke={stroke} strokeWidth={sw} fill={fill} />
    <circle cx="12" cy="12" r="2.6" stroke={stroke} strokeWidth={sw-0.4} fill={fill} />
    <circle cx="12" cy="12" r="1.2" fill={accent} />
    {/* crema tarro */}
    <g transform="translate(14.2,14.2)">
      <rect x="-3.6" y="2.2" width="7.2" height="3.6" rx="1.2" stroke={stroke} strokeWidth={sw-0.4} fill={fill} />
      <path d="M-2.8 2.2h5.6l1.8 1.8-1.8.6h-5.6z" fill={accent} />
    </g>
  </svg>
);

export const IconLips = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* polvera abierta */}
    <circle cx="9" cy="16" r="3.6" stroke={stroke} strokeWidth={sw} fill={fill} />
    <circle cx="9" cy="16" r="2.4" fill={accent} />
    <g transform="translate(12.5,13) rotate(-25)">
      <rect x="0" y="0" width="6.8" height="3.4" rx="1.2" stroke={stroke} strokeWidth={sw} fill={fill} />
    </g>
  </svg>
);

export const IconSun = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <circle cx="12" cy="12" r="3.6" stroke={stroke} strokeWidth={sw} fill={fill} />
    <circle cx="12" cy="12" r="2.1" fill={accent} />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2.1 2.1M17.4 17.4l2.1 2.1M19.5 4.5l-2.1 2.1M6.6 17.4l-2.1 2.1" stroke={stroke} strokeWidth={sw-0.4} {...round} />
  </svg>
);



interface EggIconProps {
  tier: 'hatchling' | 'drake' | 'dragon' | 'elder-dragon' | 'smaug'
}

const eggConfig = {
  hatchling: {
    glowColor: '#4ade80',
    mainColor: '#16a34a',
    accentColor: '#22c55e',
    pattern: '🌿',
  },
  drake: {
    glowColor: '#22d3ee',
    mainColor: '#0891b2',
    accentColor: '#06b6d4',
    pattern: '🌊',
  },
  dragon: {
    glowColor: '#a78bfa',
    mainColor: '#7c3aed',
    accentColor: '#c4b5fd',
    pattern: '⚡',
  },
  'elder-dragon': {
    glowColor: '#f97316',
    mainColor: '#ea580c',
    accentColor: '#fb923c',
    pattern: '🔥',
  },
  smaug: {
    glowColor: '#fbbf24',
    mainColor: '#f59e0b',
    accentColor: '#fcd34d',
    pattern: '👑',
  },
}

export default function EggIcon({ tier }: EggIconProps) {
  const config = eggConfig[tier]

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id={`egg-gradient-${tier}`} cx="40%" cy="40%">
          <stop offset="0%" stopColor={config.accentColor} stopOpacity="1" />
          <stop offset="50%" stopColor={config.mainColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={config.mainColor} stopOpacity="0.7" />
        </radialGradient>

        <filter id={`egg-glow-${tier}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        <filter id={`egg-shadow-${tier}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={config.glowColor} floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer glow */}
      <ellipse
        cx="22"
        cy="20"
        rx="13"
        ry="15"
        fill="none"
        stroke={config.glowColor}
        strokeWidth="2"
        opacity="0.3"
        filter={`url(#egg-glow-${tier})`}
      />

      {/* Main egg body */}
      <ellipse
        cx="22"
        cy="20"
        rx="12"
        ry="14"
        fill={`url(#egg-gradient-${tier})`}
        filter={`url(#egg-shadow-${tier})`}
      />

      {/* Highlight for 3D effect */}
      <ellipse
        cx="18"
        cy="14"
        rx="4"
        ry="5"
        fill={config.accentColor}
        opacity="0.6"
      />

      {/* Inner glow lines */}
      <path
        d="M 22 10 Q 20 15 22 20 Q 24 15 22 10"
        stroke={config.accentColor}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* Texture lines */}
      <path
        d="M 16 18 Q 18 20 20 22"
        stroke={config.mainColor}
        strokeWidth="0.5"
        opacity="0.4"
      />
      <path
        d="M 24 18 Q 26 20 28 22"
        stroke={config.mainColor}
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  )
}

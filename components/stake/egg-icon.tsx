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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 0 8px ${config.glowColor})` }}
      >
        <defs>
          <radialGradient id={`egg-grad-${tier}`} cx="35%" cy="35%">
            <stop offset="0%" stopColor={config.accentColor} />
            <stop offset="60%" stopColor={config.mainColor} />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        </defs>

        {/* Main egg body with gradient */}
        <ellipse
          cx="20"
          cy="19"
          rx="11"
          ry="13"
          fill={`url(#egg-grad-${tier})`}
        />

        {/* Highlight for 3D depth */}
        <ellipse
          cx="16"
          cy="12"
          rx="3"
          ry="4"
          fill={config.glowColor}
          opacity="0.8"
        />

        {/* Glow aura */}
        <ellipse
          cx="20"
          cy="19"
          rx="11"
          ry="13"
          fill="none"
          stroke={config.glowColor}
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Shine line */}
        <path
          d="M 18 10 Q 20 14 22 18"
          stroke={config.accentColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}

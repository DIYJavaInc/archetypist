export type RiskLevel = 'high' | 'moderate' | 'low'

export interface ArchetypeSafety {
  riskLevel: RiskLevel
  awarenessTitle: string
  intro: string
  redFlags: string[]
  closingNote: string
}

const SAFETY: Record<string, ArchetypeSafety> = {
  'Twin Flame Soulmate': {
    riskLevel: 'high',
    awarenessTitle: 'Twin Flame Awareness',
    intro:
      'Twin flame intensity is real — and powerful. But intensity is not love, and "destined" connections can still be harmful.',
    redFlags: [
      'Controlling behavior or possessiveness',
      'Isolation from friends and family',
      'Physical aggression or threats',
      'Financial control or withholding',
      'Gaslighting or emotional manipulation',
      'Using "twin flame destiny" to justify harmful behavior',
      '"We\'re too spiritual to break up" — used to trap you',
    ],
    closingNote:
      'Being fated together does not mean staying in harm. Your safety matters more than any destiny.',
  },
  'Addictive Chemistry Soulmate': {
    riskLevel: 'high',
    awarenessTitle: 'Addictive Chemistry Awareness',
    intro:
      'This magnetic pull can feel transcendent — but addictive patterns and genuine love are not the same thing.',
    redFlags: [
      'Jealousy, possessiveness, or surveillance',
      'Controlling behavior disguised as passion',
      'Loss of self — your needs disappear into theirs',
      'Isolation from your support system',
      'Cycles of intense highs followed by painful lows',
    ],
    closingNote:
      'Addiction is not love. If the connection feels more like a trap than a choice, trust that feeling.',
  },
  'Intense but Temporary Soulmate': {
    riskLevel: 'high',
    awarenessTitle: 'Volatile Connection Awareness',
    intro:
      'Passionate and explosive connections can be beautiful — but unmanaged intensity can turn dangerous.',
    redFlags: [
      'Uncontrolled anger or aggression',
      'Rapid emotional escalation with no repair',
      'Physical altercations or threats',
      'Unpredictable mood swings that keep you on edge',
      'Passion used to excuse disrespect',
    ],
    closingNote:
      'Passion without respect is not love. You can honor the connection and still choose to leave.',
  },
  'Karmic Soulmate': {
    riskLevel: 'high',
    awarenessTitle: 'Karmic Lesson Awareness',
    intro:
      'Karmic connections often carry lessons — but one of the most important lessons may be learning to set boundaries and leave cycles of pain.',
    redFlags: [
      'Repeated cycles of conflict, breakup, and reunion',
      'Power imbalances or control dynamics',
      'Using "it\'s karmic" to rationalize staying in pain',
      'Abuse or manipulation framed as "spiritual teaching"',
      'Codependency presented as a soul contract',
    ],
    closingNote:
      'You can learn your lesson and walk away. Not every contract requires you to stay.',
  },
  'Spiritual Catalyst Soulmate': {
    riskLevel: 'moderate',
    awarenessTitle: 'Spiritual Catalyst Awareness',
    intro:
      'Spiritual transformation is real — but watch for control or manipulation hiding behind spiritual language.',
    redFlags: [
      'Manipulation framed as "guiding your evolution"',
      'Isolation justified as "spiritual necessity"',
      'Gaslighting presented as "expanding your consciousness"',
      'Behaviors hidden from friends and family',
      'Spiritual authority used to override your own judgment',
    ],
    closingNote:
      'Genuine spiritual connection always respects your boundaries and autonomy.',
  },
  'Power Couple': {
    riskLevel: 'moderate',
    awarenessTitle: 'Power Couple Awareness',
    intro:
      'Strong, ambitious partnerships can become domineering. Watch for power struggles or one partner undermining the other.',
    redFlags: [
      'One partner controlling major decisions unilaterally',
      'Financial control or economic manipulation',
      'Public humiliation, contempt, or put-downs',
      'Aggressive competition that erodes respect',
      'Boundaries routinely ignored or dismissed',
    ],
    closingNote:
      'True power couples elevate each other. Healthy ambition never requires diminishing your partner.',
  },
  'Life Builder Soulmate': {
    riskLevel: 'moderate',
    awarenessTitle: 'Life Builder Awareness',
    intro:
      'Stable, grounded partnerships can create codependency or make leaving feel impossible. Watch for these patterns.',
    redFlags: [
      'One partner controlling finances or shared resources',
      'Isolation from friends or outside life gradual over time',
      'Loss of individual identity inside the relationship',
      'Emotional suppression justified as "keeping the peace"',
      'Feeling unable to leave due to entanglement or fear',
    ],
    closingNote:
      'Healthy stability maintains individual identity alongside partnership. You should feel free, not trapped.',
  },
  'Healing Partner Soulmate': {
    riskLevel: 'low',
    awarenessTitle: 'Healing Partnership Awareness',
    intro:
      'This connection is built on mutual respect and emotional support. It carries lower risk — but stay present to your own needs.',
    redFlags: [
      'Watch that "healing" doesn\'t drift into codependency',
      'Ensure both partners maintain healthy individual boundaries',
      'Healing others should not come at the cost of your own safety',
    ],
    closingNote:
      'This foundation of mutual care is a genuine strength. Protect it by staying honest with each other.',
  },
  'Safe Love Soulmate': {
    riskLevel: 'low',
    awarenessTitle: 'Safe Love Awareness',
    intro:
      'This connection is built on trust, security, and healthy attachment — one of the most sustainable foundations.',
    redFlags: [
      'Continue nurturing open, honest communication',
      'Maintain respect for each other\'s individuality',
      'Check in regularly — safety is an ongoing practice, not a destination',
    ],
    closingNote:
      'Safe love is rare and worth protecting. Keep choosing it consciously.',
  },
  'Highest Timeline Soulmate': {
    riskLevel: 'low',
    awarenessTitle: 'Highest Timeline Awareness',
    intro:
      'This connection represents extraordinary potential. Both of you support each other\'s growth at the deepest level.',
    redFlags: [
      'Even the best connections require ongoing conscious care',
      'Don\'t let "highest timeline" become complacency',
      'Continue choosing each other with intention and respect',
    ],
    closingNote:
      'The highest timeline is not guaranteed — it\'s built, day by day, through conscious love.',
  },
}

export function getArchetypeSafety(archetype: string): ArchetypeSafety | null {
  return SAFETY[archetype] ?? null
}

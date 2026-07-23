export type AnnouncementCategory =
  | 'GENERAL'
  | 'ACADEMIC'
  | 'FEES_FINANCE'
  | 'REGISTRATION'
  | 'EVENT_ACTIVITY'
  | 'DISCIPLINE'
  | 'SAFETY_ALERT'
  | 'EMERGENCY';

export const ANNOUNCEMENT_CATEGORIES: { value: AnnouncementCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ACADEMIC', label: 'Academic (Marks & Reports)' },
  { value: 'FEES_FINANCE', label: 'Fees & Finance' },
  { value: 'REGISTRATION', label: 'Registration & Requirements' },
  { value: 'EVENT_ACTIVITY', label: 'Events & Activities' },
  { value: 'DISCIPLINE', label: 'Discipline & Conduct' },
  { value: 'SAFETY_ALERT', label: 'Safety Alerts' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

export const CATEGORY_LABEL: Record<AnnouncementCategory, string> = Object.fromEntries(
  ANNOUNCEMENT_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<AnnouncementCategory, string>;

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export const REACTIONS: { value: ReactionType; emoji: string; label: string }[] = [
  { value: 'LIKE', emoji: '\u{1F44D}', label: 'Like' },
  { value: 'LOVE', emoji: '\u{2764}\u{FE0F}', label: 'Love' },
  { value: 'HAHA', emoji: '\u{1F606}', label: 'Haha' },
  { value: 'WOW', emoji: '\u{1F62E}', label: 'Wow' },
  { value: 'SAD', emoji: '\u{1F622}', label: 'Sad' },
  { value: 'ANGRY', emoji: '\u{1F620}', label: 'Angry' },
];

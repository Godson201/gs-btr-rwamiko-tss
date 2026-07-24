export type StaffTitle = 'HEAD_TEACHER' | 'DIRECTOR_OF_STUDIES' | 'DIRECTOR_OF_DISCIPLINE' | 'PATRON' | 'MATRON';

export const STAFF_TITLE_LABEL: Record<StaffTitle, string> = {
  HEAD_TEACHER: 'Head Teacher',
  DIRECTOR_OF_STUDIES: 'Director of Studies (DOS)',
  DIRECTOR_OF_DISCIPLINE: 'Director of Discipline (DOD)',
  PATRON: 'Patron',
  MATRON: 'Matron',
};

export const STAFF_TITLE_OPTIONS = Object.entries(STAFF_TITLE_LABEL) as [StaffTitle, string][];

export interface PostAuthor {
  firstName: string;
  lastName: string;
  role: string;
  teacher?: { staffTitle: StaffTitle | null } | null;
  admin?: { position: string | null } | null;
}

export function authorByline(author: PostAuthor): string | null {
  if (author.teacher?.staffTitle) return STAFF_TITLE_LABEL[author.teacher.staffTitle];
  if (author.admin?.position) return author.admin.position;
  return null;
}

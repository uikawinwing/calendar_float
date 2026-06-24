import type { CalendarProfile } from '../profile';

export function shouldShowCalendarDeveloperTools(profile: CalendarProfile): boolean {
  return profile.developerMode === true;
}

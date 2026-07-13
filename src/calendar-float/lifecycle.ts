let currentGeneration = 0;

export class CalendarFloatLifecycleCancelledError extends Error {
  constructor() {
    super('Calendar Float lifecycle 已失效');
    this.name = 'CalendarFloatLifecycleCancelledError';
  }
}

export interface CalendarFloatLifecycleToken {
  readonly generation: number;
  isCurrent(): boolean;
  throwIfStale(): void;
}

export function beginCalendarFloatLifecycle(): CalendarFloatLifecycleToken {
  const generation = ++currentGeneration;
  return {
    generation,
    isCurrent: () => generation === currentGeneration,
    throwIfStale: () => {
      if (generation !== currentGeneration) {
        throw new CalendarFloatLifecycleCancelledError();
      }
    },
  };
}

export function invalidateCalendarFloatLifecycle(): void {
  currentGeneration += 1;
}

export function isCalendarFloatLifecycleCancelledError(
  error: unknown,
): error is CalendarFloatLifecycleCancelledError {
  return error instanceof CalendarFloatLifecycleCancelledError;
}

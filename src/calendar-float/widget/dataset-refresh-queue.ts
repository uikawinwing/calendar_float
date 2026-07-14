export interface DatasetRefreshRunContext {
  isCurrent(): boolean;
}

interface ActiveDatasetRefresh {
  generation: number;
  queued: boolean;
  promise: Promise<void>;
}

export interface DatasetRefreshQueue {
  request(): Promise<void>;
  invalidate(): void;
}

export function createDatasetRefreshQueue(
  run: (context: DatasetRefreshRunContext) => Promise<void>,
): DatasetRefreshQueue {
  let generation = 0;
  let activeRefresh: ActiveDatasetRefresh | null = null;

  async function drain(refresh: ActiveDatasetRefresh): Promise<void> {
    const context: DatasetRefreshRunContext = {
      isCurrent: () => generation === refresh.generation,
    };
    do {
      refresh.queued = false;
      try {
        await run(context);
      } catch (error) {
        if (!context.isCurrent()) {
          return;
        }
        if (!refresh.queued) {
          if (activeRefresh === refresh) {
            activeRefresh = null;
          }
          throw error;
        }
      }
    } while (refresh.queued && context.isCurrent());
  }

  function request(): Promise<void> {
    if (activeRefresh?.generation === generation) {
      activeRefresh.queued = true;
      return activeRefresh.promise;
    }

    const refresh: ActiveDatasetRefresh = {
      generation,
      queued: false,
      promise: Promise.resolve(),
    };
    activeRefresh = refresh;
    refresh.promise = drain(refresh).finally(() => {
      if (activeRefresh === refresh) {
        activeRefresh = null;
      }
    });
    return refresh.promise;
  }

  function invalidate(): void {
    generation += 1;
    activeRefresh = null;
  }

  return { request, invalidate };
}

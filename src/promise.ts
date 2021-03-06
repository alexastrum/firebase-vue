import { shallowRef, watchEffect, Ref } from 'vue';

/**
 * Call inside component `setup()`:
 *
 * ```ts
 * const welcomeVideoSrc = usePromise(() => useFirebase().storage().ref('welcome.mp4').getDownloadURL());
 *
 * const user = useFirebaseUser();
 * const imgSrc = usePromise(() => user.value && useFirebase().ref(`avatars/${user.value.uid}.jpg`).getDownloadURL());
 * ```
 */
export function usePromise<T>(fn: () => T | Promise<T>, refreshMs?: number) {
  const result = shallowRef<T | null>();
  watchEffect((onInvalidate) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handle: any;
    const tick = async () => {
      try {
        result.value = await fn();
        if (refreshMs) {
          handle = setTimeout(() => {
            void tick();
          }, refreshMs);
        }
      } catch (error) {
        result.value = null;
        throw error;
      }
    };
    void tick();
    onInvalidate(() => {
      clearTimeout(handle);
    });
  });
  return result;
}

export function refToPromise<T = { isLoading?: true }>(
  ref: Ref<T>,
  filterFn = (value: T | { isLoading?: true }) =>
    value !== undefined && !('isLoading' in value && value.isLoading)
) {
  return new Promise((resolve) => {
    watchEffect(() => {
      const value = ref.value;
      if (filterFn(value)) {
        resolve(value);
      }
    });
  });
}

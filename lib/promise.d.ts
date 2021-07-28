import { Ref } from 'vue';
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
export declare function usePromise<T>(fn: () => T | Promise<T>, refreshMs?: number): Ref<T | null | undefined>;
export declare function refToPromise<T = {
    isLoading?: true;
}>(ref: Ref<T>, filterFn?: (value: T | {
    isLoading?: true;
}) => boolean): Promise<unknown>;

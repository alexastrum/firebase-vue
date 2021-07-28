import 'firebase/database';
export declare type FirebaseDatabaseResult<T> = Readonly<{
    path: string;
    data?: T;
}> | undefined;
/**
 * Call inside component `setup()`:
 *
 * ```ts
 * const root = useFirebaseDatabase();
 *
 * const user = useFirebaseUser();
 * const userProfile = useFirebaseDatabase(() => user.value && `users/${user.value.uid}`);
 * ```
 */
export declare function useFirebaseDatabase<T>(fn?: () => string): import("vue").Ref<FirebaseDatabaseResult<T>>;

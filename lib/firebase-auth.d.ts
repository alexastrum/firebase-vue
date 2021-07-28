import firebase from 'firebase/app';
import 'firebase/auth';
export declare type FirebaseUserResult = Readonly<firebase.User> | null | undefined;
/**
 * Call inside component `setup()`:
 *
 * ```ts
 * const user = useFirebaseUser();
 * ```
 */
export declare function useFirebaseUser(): import("vue").Ref<FirebaseUserResult>;

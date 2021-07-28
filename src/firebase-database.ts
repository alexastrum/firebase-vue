import { shallowRef, watchEffect } from 'vue';
import firebase from 'firebase/app';
import 'firebase/database';

export type FirebaseDatabaseResult<T> =
  | Readonly<{
      path: string;
      data?: T;
    }>
  | undefined;

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
export function useFirebaseDatabase<T>(fn: () => string = () => '') {
  const result = shallowRef<FirebaseDatabaseResult<T>>();
  watchEffect((onInvalidate) => {
    const path = fn();
    const dbRef = path && firebase.database().ref(path);
    dbRef &&
      dbRef.on('value', (snapshot) => {
        result.value = {
          path,
          data: snapshot.val() as T | undefined,
        };
      });
    onInvalidate(() => {
      dbRef && dbRef.off();
    });
  });
  return result;
}

import { shallowRef } from 'vue';
import firebase from 'firebase/app';
import 'firebase/auth';

export type FirebaseUserResult = Readonly<firebase.User> | null | undefined;

/**
 * Call inside component `setup()`:
 *
 * ```ts
 * const user = useFirebaseUser();
 * ```
 */
export function useFirebaseUser() {
  const result = shallowRef<FirebaseUserResult>();
  firebase.auth().onAuthStateChanged((user) => {
    result.value = user;
  });
  return result;
}

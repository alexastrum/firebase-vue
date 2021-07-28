import { shallowRef } from 'vue';
import firebase from 'firebase/app';
import 'firebase/auth';
/**
 * Call inside component `setup()`:
 *
 * ```ts
 * const user = useFirebaseUser();
 * ```
 */
export function useFirebaseUser() {
    const result = shallowRef();
    firebase.auth().onAuthStateChanged((user) => {
        result.value = user;
    });
    return result;
}

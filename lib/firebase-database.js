import { shallowRef, watchEffect } from 'vue';
import firebase from 'firebase/app';
import 'firebase/database';
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
export function useFirebaseDatabase(fn = () => '') {
    const result = shallowRef();
    watchEffect((onInvalidate) => {
        const path = fn();
        const dbRef = path && firebase.database().ref(path);
        dbRef &&
            dbRef.on('value', (snapshot) => {
                result.value = {
                    path,
                    data: snapshot.val(),
                };
            });
        onInvalidate(() => {
            dbRef && dbRef.off();
        });
    });
    return result;
}

import firebase from 'firebase/app';
import 'firebase/functions';
import { extractPathAndId } from './utils';
export const httpsCallable = (name, options) => {
    const { id } = extractPathAndId(name, '');
    return firebase.functions().httpsCallable(id, options);
};

import firebase from 'firebase/app';
import 'firebase/functions';
import { extractPathAndId } from './utils';

export const httpsCallable = <I, O>(
  name: string,
  options?: firebase.functions.HttpsCallableOptions
): ((requestPayload?: I) => Promise<{ data: O }>) => {
  const { id } = extractPathAndId(name, '');
  return firebase.functions().httpsCallable(id, options);
};

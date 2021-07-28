import firebase from 'firebase/app';
import 'firebase/functions';
export declare const httpsCallable: <I, O>(name: string, options?: firebase.functions.HttpsCallableOptions | undefined) => (requestPayload?: I | undefined) => Promise<{
    data: O;
}>;

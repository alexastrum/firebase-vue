export * from './callable';
export * from './collection-registry';
export * from './firebase-auth';
export * from './firebase-database';
export * from './firestore';
export * from './promise';

import { Plugin } from 'vue';
import firebase from 'firebase/app';

const install = (app, options) => {
  if (!firebase.apps.length) {
    firebase.initializeApp(options);
  }
};

export default install;

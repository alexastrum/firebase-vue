import { Plugin } from 'vue';
import firebase from 'firebase/app';

const install: Plugin = (app, options) => {
  if (!firebase.apps.length) {
    firebase.initializeApp(options);
  }
};

export default install;

import firebase from 'firebase/app';
import 'firebase/firestore';
import { shallowRef, watchEffect } from 'vue';
import {
  Collection,
  CollectionSchema,
  Doc,
  DocSnapshot,
  Database,
  WatchDocsResult,
  WatchDocResult,
  DocReference,
} from './database';

/** Alias for firestore.FieldValue.serverTimestamp() */
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

export type DocumentData = firebase.firestore.DocumentData;

export type Query<T = DocumentData> = firebase.firestore.Query<T>;

export type FirestoreDocSnapshot<T> = Readonly<DocSnapshot<T, Query<T>>>;
export type FirestoreDocsSnapshot<T> =
  | ReadonlyArray<Readonly<DocSnapshot<T, Query<T>>>>
  | undefined;

export class FirestoreCollection<T extends DocumentData>
  implements Collection<T, Query<T>>
{
  private get collectionQuery() {
    return getCollectionReference<T>(this.path);
  }

  constructor(
    public path: string,
    public schema: CollectionSchema<T>,
    private database = Database.instance
  ) {
    database.registerCollection(this);
  }

  async add(data: T): Promise<Doc<T, firebase.firestore.Query<T>>> {
    const docRef = await this.collectionQuery.add(data);
    return new FirestoreDoc(() => docRef.id, this);
  }

  doc(id: () => string): Doc<T, Query<T>> {
    return new FirestoreDoc(id, this);
  }

  watchFirst(fn: (builder: Query<T>) => Query<T>): WatchDocResult<T, Query<T>> {
    const result = shallowRef<DocSnapshot<T, Query<T>>>({
      id: '',
      isLoading: true,
      collection: this,
    });
    watchEffect((onInvalidate) => {
      const query = fn(this.collectionQuery);
      if (!query) {
        result.value = {
          id: '',
          collection: this,
        };
        return;
      }
      console.log(`[Firestore] Watch first subscribe /${this.path}`);
      const unsubscribe = query.limit(1).onSnapshot((snapshot) => {
        console.log(
          `[Firestore] Watch first snapshot /${this.path}`,
          snapshot.docs[0]
        );
        if (snapshot.docs.length === 1) {
          const doc = snapshot.docs[0];
          result.value = {
            id: doc.id,
            data: unpackFirestoreData(doc.data()),
            doc: new FirestoreDoc(() => doc.id, this),
            collection: this,
          };
        } else {
          result.value = { id: '', collection: this };
        }
      });
      onInvalidate(() => {
        console.log(`[Firestore] Watch first unsubscribe /${this.path}`);
        unsubscribe();
      });
    });
    return result;
  }

  watchAll(
    fn?: (builder: Query<T>) => Query<T> | undefined
  ): WatchDocsResult<T, Query<T>> {
    const result = shallowRef<Array<DocSnapshot<T, Query<T>>>>();
    watchEffect((onInvalidate) => {
      const query = fn ? fn(this.collectionQuery) : this.collectionQuery;
      if (!query) {
        result.value = [];
        return;
      }
      console.log(`[Firestore] Watch all subscribe /${this.path}`);
      const unsubscribe = query.onSnapshot((snapshot) => {
        console.log(
          `[Firestore] Watch all snapshot /${this.path}`,
          snapshot.docs
        );
        result.value = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            data: unpackFirestoreData(doc.data()),
            doc: new FirestoreDoc(() => doc.id, this),
            collection: this,
          };
        });
      });
      onInvalidate(() => {
        console.log(`[Firestore] Watch all unsubscribe /${this.path}`);
        unsubscribe();
      });
    });
    return result;
  }

  async getAll(
    fn?: (builder: Query<T>) => Query<T>
  ): Promise<Array<DocSnapshot<T, Query<T>>>> {
    const query = fn ? fn(this.collectionQuery) : this.collectionQuery;
    if (!query) {
      return Promise.resolve([]);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        data: unpackFirestoreData(doc.data()),
        doc: new FirestoreDoc(() => doc.id, this),
        collection: this,
      };
    });
  }

  watchDocs<T, Q>(
    fn: () => Array<DocReference | string> | undefined
  ): WatchDocsResult<T, Q> {
    return this.database.watchDocs(fn, this.path);
  }

  setAll = async (items: Array<{ id?: string; data: T }>) => {
    return Promise.all(
      items.map(async (item) => {
        if (item.id) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const doc = this.doc(() => item.id!);
          await doc.set(item.data);
          return doc;
        } else {
          return this.add(item.data);
        }
      })
    );
  };
}

export class FirestoreDoc<T> implements Doc<T, Query<T>> {
  private get docRef() {
    return getCollectionReference<T>(this.collection.path).doc(this.id());
  }

  constructor(
    public id: () => string,
    public collection: Collection<T, Query<T>>
  ) {}

  set(data: T): Promise<unknown> {
    return this.docRef.set(data);
  }

  async get(): Promise<Readonly<T | undefined>> {
    const snapshot = await this.docRef.get();
    return snapshot.data();
  }

  watch(): WatchDocResult<T, Query<T>> {
    const result = shallowRef<DocSnapshot<T, Query<T>>>({
      id: '',
      isLoading: true,
      doc: this,
      collection: this.collection,
    });
    watchEffect((onInvalidate) => {
      const unsubscribe = this.subscribe((snapshot) => {
        result.value = snapshot;
      });
      onInvalidate(() => {
        unsubscribe();
      });
    });
    return result;
  }

  subscribe(fn: (snapshot: DocSnapshot<T, Query<T>>) => void): () => void {
    const docRef = this.docRef;
    fn({
      id: docRef.id,
      isLoading: true,
      doc: this,
      collection: this.collection,
    });
    console.log(`[Firestore] Watch doc subscribe /${docRef.path}`);
    const unsubscribe = docRef.onSnapshot((snapshot) => {
      console.log(`[Firestore] Watch doc snapshot /${docRef.path}`, snapshot);
      fn({
        id: snapshot.id,
        data: unpackFirestoreData(snapshot.data()),
        doc: this,
        collection: this.collection,
      });
    });
    return () => {
      console.log(`[Firestore] Watch doc unsubscribe /${docRef.path}`);
      unsubscribe();
    };
  }

  update(data: Partial<T>): Promise<unknown> {
    return this.docRef.update(data);
  }

  delete(): Promise<unknown> {
    return this.docRef.delete();
  }
}

function unpackFirestoreData<
  T extends firebase.firestore.DocumentData | undefined
>(data: T, maxDepth = 10): T {
  if (!data) {
    return data;
  }
  const keys = Object.keys(data as firebase.firestore.DocumentData);
  if (!keys.length) {
    return data;
  }
  const result = { ...data };
  if (!result) {
    return data;
  }
  keys.forEach((key) => {
    const val = result[key] as unknown;
    if (val instanceof firebase.firestore.Timestamp) {
      // Convert Timestamp to Date for interoperability with other collection implementations.
      result[key] = val.toDate();
      return;
    }
    if (val instanceof firebase.firestore.DocumentReference) {
      // Firebase SDK has a bug preventing onSnapshot from working on referenced docs.
      // Convert DocumentReference to string for interoperability with other collection implementations.
      // To load a referenced doc, use `const otherDoc = database.doc(() => thisDoc.value.data.otherDocPath).watch()
      result[key] = val.path;
      return;
    }
    if (maxDepth <= 0) {
      return;
    }
    if (typeof val === 'object') {
      result[key] = unpackFirestoreData(result[key], maxDepth - 1) as unknown;
    }
  });
  return result;
}

function getCollectionReference<T>(path: string) {
  return firebase
    .firestore()
    .collection(path) as firebase.firestore.CollectionReference<T>;
}

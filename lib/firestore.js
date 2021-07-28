import firebase from 'firebase/app';
import 'firebase/firestore';
import { shallowRef, watchEffect } from 'vue';
import { CollectionRegistry, } from './collection-registry';
/** Alias for firestore.FieldValue.serverTimestamp() */
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
export class FirestoreCollection {
    path;
    schema;
    registry;
    get collectionQuery() {
        return getCollectionReference(this.path);
    }
    constructor(path, schema, registry = CollectionRegistry.instance) {
        this.path = path;
        this.schema = schema;
        this.registry = registry;
        registry.registerCollection(this);
    }
    async add(data) {
        const docRef = await this.collectionQuery.add(data);
        return new FirestoreDoc(() => docRef.id, this);
    }
    doc(id) {
        return new FirestoreDoc(id, this);
    }
    watchFirst(fn) {
        const result = shallowRef({
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
                console.log(`[Firestore] Watch first snapshot /${this.path}`, snapshot.docs[0]);
                if (snapshot.docs.length === 1) {
                    const doc = snapshot.docs[0];
                    result.value = {
                        id: doc.id,
                        data: unpackFirestoreData(doc.data()),
                        doc: new FirestoreDoc(() => doc.id, this),
                        collection: this,
                    };
                }
                else {
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
    watchAll(fn) {
        const result = shallowRef();
        watchEffect((onInvalidate) => {
            const query = fn ? fn(this.collectionQuery) : this.collectionQuery;
            if (!query) {
                result.value = [];
                return;
            }
            console.log(`[Firestore] Watch all subscribe /${this.path}`);
            const unsubscribe = query.onSnapshot((snapshot) => {
                console.log(`[Firestore] Watch all snapshot /${this.path}`, snapshot.docs);
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
    async getAll(fn) {
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
    watchDocs(fn) {
        return this.registry.watchDocs(fn, this.path);
    }
    setAll = async (items) => {
        return Promise.all(items.map(async (item) => {
            if (item.id) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const doc = this.doc(() => item.id);
                await doc.set(item.data);
                return doc;
            }
            else {
                return this.add(item.data);
            }
        }));
    };
}
export class FirestoreDoc {
    id;
    collection;
    get docRef() {
        return getCollectionReference(this.collection.path).doc(this.id());
    }
    constructor(id, collection) {
        this.id = id;
        this.collection = collection;
    }
    set(data) {
        return this.docRef.set(data);
    }
    async get() {
        const snapshot = await this.docRef.get();
        return snapshot.data();
    }
    watch() {
        const result = shallowRef({
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
    subscribe(fn) {
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
    update(data) {
        return this.docRef.update(data);
    }
    delete() {
        return this.docRef.delete();
    }
}
function unpackFirestoreData(data, maxDepth = 10) {
    if (!data) {
        return data;
    }
    const keys = Object.keys(data);
    if (!keys.length) {
        return data;
    }
    const result = { ...data };
    if (!result) {
        return data;
    }
    keys.forEach((key) => {
        const val = result[key];
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
            result[key] = unpackFirestoreData(result[key], maxDepth - 1);
        }
    });
    return result;
}
function getCollectionReference(path) {
    return firebase
        .firestore()
        .collection(path);
}

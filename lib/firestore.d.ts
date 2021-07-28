import firebase from 'firebase/app';
import 'firebase/firestore';
import { Collection, CollectionSchema, Doc, DocSnapshot, CollectionRegistry, WatchDocsResult, WatchDocResult, DocReference } from './collection-registry';
/** Alias for firestore.FieldValue.serverTimestamp() */
export declare const serverTimestamp: firebase.firestore.FieldValue;
export declare type DocumentData = firebase.firestore.DocumentData;
export declare type Query<T = DocumentData> = firebase.firestore.Query<T>;
export declare type FirestoreDocSnapshot<T> = Readonly<DocSnapshot<T, Query<T>>>;
export declare type FirestoreDocsSnapshot<T> = ReadonlyArray<Readonly<DocSnapshot<T, Query<T>>>> | undefined;
export declare class FirestoreCollection<T extends DocumentData> implements Collection<T, Query<T>> {
    path: string;
    schema: CollectionSchema<T>;
    private registry;
    private get collectionQuery();
    constructor(path: string, schema: CollectionSchema<T>, registry?: CollectionRegistry);
    add(data: T): Promise<Doc<T, firebase.firestore.Query<T>>>;
    doc(id: () => string): Doc<T, Query<T>>;
    watchFirst(fn: (builder: Query<T>) => Query<T>): WatchDocResult<T, Query<T>>;
    watchAll(fn?: (builder: Query<T>) => Query<T> | undefined): WatchDocsResult<T, Query<T>>;
    getAll(fn?: (builder: Query<T>) => Query<T>): Promise<Array<DocSnapshot<T, Query<T>>>>;
    watchDocs<T, Q>(fn: () => Array<DocReference | string> | undefined): WatchDocsResult<T, Q>;
    setAll: (items: Array<{
        id?: string;
        data: T;
    }>) => Promise<Doc<T, Query<T>>[]>;
}
export declare class FirestoreDoc<T> implements Doc<T, Query<T>> {
    id: () => string;
    collection: Collection<T, Query<T>>;
    private get docRef();
    constructor(id: () => string, collection: Collection<T, Query<T>>);
    set(data: T): Promise<unknown>;
    get(): Promise<Readonly<T | undefined>>;
    watch(): WatchDocResult<T, Query<T>>;
    subscribe(fn: (snapshot: DocSnapshot<T, Query<T>>) => void): () => void;
    update(data: Partial<T>): Promise<unknown>;
    delete(): Promise<unknown>;
}

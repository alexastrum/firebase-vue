import { Component, Ref } from 'vue';
export declare class CollectionRegistry {
    static readonly instance: CollectionRegistry;
    private collections;
    registerCollection<T, Q>(collection: Collection<T, Q>): void;
    collection<T, Q>(path: string): Collection<T, Q>;
    doc<T, Q>(path: () => DocReference | string, collectionPath?: string): Doc<T, Q>;
    watchDocs<T, Q>(fn: () => Array<DocReference | string> | undefined, collectionPath?: string, debounceMs?: number): WatchDocsResult<T, Q>;
}
export interface Collection<T, Q> {
    readonly path: string;
    readonly schema: Readonly<CollectionSchema<T>>;
    add(data: T): Promise<Doc<T, Q>>;
    doc(id: () => string): Doc<T, Q>;
    watchFirst(fn: (builder: Q) => Q | undefined): WatchDocResult<T, Q>;
    watchAll(fn?: (builder: Q) => Q | undefined): WatchDocsResult<T, Q>;
}
export interface Doc<T, Q> {
    readonly id: () => string;
    readonly collection: Collection<T, Q>;
    set(data: T): Promise<unknown>;
    get(): Promise<Readonly<T | undefined>>;
    watch(): WatchDocResult<T, Q>;
    subscribe(fn: (snapshot: DocSnapshot<T, Q>) => void): () => void;
    update(data: Partial<T>): Promise<unknown>;
    delete(): Promise<unknown>;
}
export declare type WatchDocResult<T, Q> = Ref<Readonly<DocSnapshot<T, Q>>>;
export declare type WatchDocsResult<T, Q> = Ref<ReadonlyArray<Readonly<DocSnapshot<T, Q>>> | undefined>;
export interface DocReference {
    id: string;
}
export interface DocSnapshot<T, Q> extends DocReference {
    data?: Readonly<T>;
    isLoading?: true;
    doc?: Doc<T, Q>;
    collection?: Collection<T, Q>;
}
export interface CollectionSchema<T> {
    iconUrlField?: Exclude<keyof T, number>;
    displayField?: Exclude<keyof T, number>;
    fields: Array<SchemaField<Exclude<keyof T, number>>>;
}
export interface SchemaField<T> {
    name: T;
    label?: string;
    tdType?: 'text' | Component;
    tdProps?: {
        [name: string]: unknown;
    };
    inputType?: Component;
    inputProps?: {
        placeholder?: string;
        hint?: string;
        required?: boolean;
        [name: string]: unknown;
    };
}

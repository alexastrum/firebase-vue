import { Component, Ref, shallowRef, watchEffect } from 'vue';
import { extractPathAndId } from './utils';

export class CollectionRegistry {
  static readonly instance = new CollectionRegistry();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private collections = new Map<string, Collection<any, any>>();

  registerCollection<T, Q>(collection: Collection<T, Q>) {
    this.collections.set(collection.path, collection);
  }

  collection<T, Q>(path: string): Collection<T, Q> {
    const collection = this.collections.get(path);
    if (!collection) {
      throw new Error('Unknown collection: ' + path);
    }
    return collection as Collection<T, Q>;
  }

  doc<T, Q>(
    path: () => DocReference | string,
    collectionPath?: string
  ): Doc<T, Q> {
    return new DocProxy<T, Q>(path, this, collectionPath);
  }

  watchDocs<T, Q>(
    fn: () => Array<DocReference | string> | undefined,
    collectionPath?: string,
    debounceMs = 100
  ): WatchDocsResult<T, Q> {
    const result = shallowRef<Array<DocSnapshot<T, Q>>>();
    watchEffect((onInvalidate) => {
      const docIds =
        fn()?.map((docId) =>
          typeof docId === 'object' && 'id' in docId ? docId.id : docId
        ) || [];
      const idsSet = new Set(docIds);
      const resultMap = new Map<string, DocSnapshot<T, Q>>();

      let updateResultTimeout: NodeJS.Timeout | undefined;
      function updateResult() {
        updateResultTimeout = undefined;
        result.value = docIds.map((id) => resultMap.get(id) || { id });
      }

      let isInitialSnapshot = true;
      const unsubscribes = [...idsSet.values()].map((id) => {
        const doc = this.doc<T, Q>(() => id, collectionPath);
        return doc.subscribe((snapshot) => {
          resultMap.set(id, snapshot);
          if (!isInitialSnapshot) {
            updateResultTimeout && clearTimeout(updateResultTimeout);
            updateResultTimeout = setTimeout(updateResult, debounceMs);
          }
        });
      });
      updateResult();
      isInitialSnapshot = false;

      onInvalidate(() => {
        unsubscribes.map((fn) => fn && fn());
      });
    });

    return result;
  }
}

class DocProxy<T, Q> implements Doc<T, Q> {
  private get actualDoc(): Doc<T, Q> {
    const docId = this.path();
    const { path, id } = extractPathAndId(
      typeof docId === 'object' && 'id' in docId ? docId.id : docId || '',
      typeof docId === 'object' && 'collection' in docId
        ? docId.collection?.path
        : this.collectionPath
    );
    const collection = this.registry.collection<T, Q>(path);
    return collection.doc(() => id);
  }

  id = this.actualDoc.id;

  get collection(): Collection<T, Q> {
    return this.actualDoc.collection;
  }

  constructor(
    private path: () => string | DocSnapshot<T, Q>,
    private registry: CollectionRegistry,
    private collectionPath?: string
  ) {}

  set(data: T): Promise<unknown> {
    return this.actualDoc.set(data);
  }

  get(): Promise<T | undefined> {
    return this.actualDoc.get();
  }

  watch(): WatchDocResult<T, Q> {
    return this.actualDoc.watch();
  }

  subscribe(fn: (snapshot: Readonly<DocSnapshot<T, Q>>) => void): () => void {
    return this.actualDoc.subscribe(fn);
  }

  update(data: T): Promise<unknown> {
    return this.actualDoc.update(data);
  }

  delete(): Promise<unknown> {
    return this.actualDoc.delete();
  }
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

export type WatchDocResult<T, Q> = Ref<Readonly<DocSnapshot<T, Q>>>;

export type WatchDocsResult<T, Q> = Ref<
  ReadonlyArray<Readonly<DocSnapshot<T, Q>>> | undefined
>;

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

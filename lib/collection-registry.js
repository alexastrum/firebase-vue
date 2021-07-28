import { shallowRef, watchEffect } from 'vue';
import { extractPathAndId } from './utils';
export class CollectionRegistry {
    static instance = new CollectionRegistry();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collections = new Map();
    registerCollection(collection) {
        this.collections.set(collection.path, collection);
    }
    collection(path) {
        const collection = this.collections.get(path);
        if (!collection) {
            throw new Error('Unknown collection: ' + path);
        }
        return collection;
    }
    doc(path, collectionPath) {
        return new DocProxy(path, this, collectionPath);
    }
    watchDocs(fn, collectionPath, debounceMs = 100) {
        const result = shallowRef();
        watchEffect((onInvalidate) => {
            const docIds = fn()?.map((docId) => typeof docId === 'object' && 'id' in docId ? docId.id : docId) || [];
            const idsSet = new Set(docIds);
            const resultMap = new Map();
            let updateResultTimeout;
            function updateResult() {
                updateResultTimeout = undefined;
                result.value = docIds.map((id) => resultMap.get(id) || { id });
            }
            let isInitialSnapshot = true;
            const unsubscribes = [...idsSet.values()].map((id) => {
                const doc = this.doc(() => id, collectionPath);
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
class DocProxy {
    path;
    registry;
    collectionPath;
    get actualDoc() {
        const docId = this.path();
        const { path, id } = extractPathAndId(typeof docId === 'object' && 'id' in docId ? docId.id : docId || '', typeof docId === 'object' && 'collection' in docId
            ? docId.collection?.path
            : this.collectionPath);
        const collection = this.registry.collection(path);
        return collection.doc(() => id);
    }
    id = this.actualDoc.id;
    get collection() {
        return this.actualDoc.collection;
    }
    constructor(path, registry, collectionPath) {
        this.path = path;
        this.registry = registry;
        this.collectionPath = collectionPath;
    }
    set(data) {
        return this.actualDoc.set(data);
    }
    get() {
        return this.actualDoc.get();
    }
    watch() {
        return this.actualDoc.watch();
    }
    subscribe(fn) {
        return this.actualDoc.subscribe(fn);
    }
    update(data) {
        return this.actualDoc.update(data);
    }
    delete() {
        return this.actualDoc.delete();
    }
}

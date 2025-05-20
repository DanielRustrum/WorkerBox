/**
 * Creates a dynamic, type-safe Web Worker with bidirectional communication and initialization support.
 *
 * This utility abstracts away the complexity of setting up a Web Worker by providing a structured API for
 * sending, receiving, polling, and subscribing to messages, all while maintaining strong TypeScript typing.
 *
 * A serializable `data` object is passed during initialization via the `start()` method on the main thread.
 * This object becomes available inside the worker through the `data` field of the provided helper API.
 *
 * Once created, the worker is memoized by a global key derived from the function body to avoid re-creation.
 *
 * @template MainToWorker - The type of messages that can be sent from the main thread to the worker.
 * @template WorkerToMain - The type of messages that can be sent from the worker to the main thread.
 * @template Data - A serializable object passed to the worker during initialization via `start(data)`.
 *
 * @param workerCallback - A function that defines the behavior of the worker. It receives a `WorkerHelperAPI`
 *                   object providing methods to communicate with the main thread, as well as the
 *                   `data` object passed from `start(data)`.
 *
 * @returns A tuple:
 *  - `start(data: Data) => Promise<void>`: Starts the worker with the provided initialization data.
 *  - An object containing messaging methods:
 *      - `send`: Sends a message to the worker.
 *      - `receive`: Awaits a message from the worker (with optional timeout).
 *      - `poll`: Synchronously retrieves the next available message.
 *      - `stop`: Terminates the worker.
 *      - `subscribe`: Listens for incoming messages from the worker in real time.
 *
 * @example
 * ```ts
 *     const [start, api] = addWorker<
 *         { type: "event", payload: string },
 *        { ack: true },
 *        { configUrl: string }
 *     >((api) => {
 *         console.log("Worker started with config:", api.data.configUrl)
 *         api.subscribe((msg) => {
 *             console.log("Received:", msg)
 *             api.send({ ack: true })
 *         })
 *     })
 *
 *     start({ configUrl: "/settings.json" })
 *     api.send({ type: "event", payload: "Hello, worker!" })
 * ```
 */
export const addWorker = (workerCallback) => {
    let globalKey = "__WebWorker_";
    try {
        globalKey = "__WebWorker_" + btoa(encodeURIComponent(workerCallback.toString()));
    }
    catch (e) {
        globalKey = "__WebWorker_" + Buffer.from(workerCallback.toString()).toString('base64');
    }
    if (globalThis[globalKey]) {
        return globalThis[globalKey];
    }
    const workerBootstrap = (workerFn) => {
        const messageQueue = [];
        const pendingReceivers = [];
        function send(message) {
            postMessage(message);
        }
        function receive(timeoutMs) {
            if (messageQueue.length > 0) {
                return Promise.resolve(messageQueue.shift());
            }
            return new Promise((resolve) => {
                let timer = null;
                const resolver = (msg) => {
                    if (timer !== null)
                        clearTimeout(timer);
                    resolve(msg);
                };
                pendingReceivers.push(resolver);
                if (typeof timeoutMs === 'number') {
                    timer = setTimeout(() => {
                        const index = pendingReceivers.indexOf(resolver);
                        if (index >= 0) {
                            pendingReceivers.splice(index, 1);
                        }
                        resolve(undefined);
                    }, timeoutMs);
                }
            });
        }
        function poll() {
            return messageQueue.shift();
        }
        function subscribe(callback) {
            const handler = (event) => {
                callback(event.data);
            };
            self.addEventListener('message', handler);
            return () => self.removeEventListener('message', handler);
        }
        function stop() {
            close();
        }
        self.addEventListener('message', event => {
            const msg = event.data;
            if (pendingReceivers.length > 0) {
                const resolver = pendingReceivers.shift();
                if (resolver)
                    resolver(msg);
            }
            else {
                messageQueue.push(msg);
            }
        });
        receive().then((data) => {
            workerFn({ send, receive, poll, stop, subscribe, data: data });
        });
    };
    const workerCode = `(${workerBootstrap.toString()})(${workerCallback.toString()})`;
    const workerUrl = URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
    let worker = null;
    const messageQueue = [];
    const pendingReceivers = [];
    const send = (message) => {
        if (worker === null)
            return;
        worker.postMessage(message);
    };
    const receive = async (timeoutMs) => {
        if (messageQueue.length > 0) {
            return messageQueue.shift();
        }
        return new Promise((resolve) => {
            let timer = null;
            const resolver = (msg) => {
                if (timer !== null)
                    clearTimeout(timer);
                resolve(msg);
            };
            pendingReceivers.push(resolver);
            if (typeof timeoutMs === 'number') {
                timer = setTimeout(() => {
                    const index = pendingReceivers.indexOf(resolver);
                    if (index >= 0) {
                        pendingReceivers.splice(index, 1);
                    }
                    resolve(undefined); // or throw new Error('Timeout')
                }, timeoutMs);
            }
        });
    };
    const poll = () => {
        return messageQueue.shift();
    };
    const subscribe = (callback) => {
        if (worker === null)
            throw new Error("Run Not Called");
        const handler = (event) => {
            const message = event.data;
            callback(message);
        };
        worker.addEventListener('message', handler);
        return () => {
            if (worker === null)
                throw new Error("Run Not Called; How did you even get this far?");
            worker.removeEventListener('message', handler);
        };
    };
    const stop = () => {
        if (worker === null)
            throw new Error("Run Not Called");
        worker.terminate();
        worker = null;
        messageQueue.length = 0;
        pendingReceivers.length = 0;
        URL.revokeObjectURL(workerUrl);
    };
    const start = async (data) => {
        if (worker !== null)
            return;
        worker = new Worker(workerUrl);
        worker.addEventListener('message', (event) => {
            const message = event.data;
            if (pendingReceivers.length > 0) {
                const resolver = pendingReceivers.shift();
                if (resolver)
                    resolver(message);
            }
            else {
                messageQueue.push(message);
            }
        });
        worker.postMessage(data);
    };
    const api = [start, { send, receive, poll, stop, subscribe }];
    globalThis[globalKey] = api;
    return api;
};

type WorkerAPI<MainToWorker, WorkerToMain, Data extends Object> = [
    start: (data: Data) => Promise<void>,
    {
        send: (message: MainToWorker) => void;
        receive: (timeoutMs?: number) => Promise<WorkerToMain | undefined>;
        poll: () => WorkerToMain | undefined;
        stop: () => void;
        subscribe: (callback: (msg: WorkerToMain) => void) => () => void;
    }
];
type WorkerHelperAPI<MainToWorker, WorkerToMain, Data extends Object> = {
    send: (message: WorkerToMain) => void;
    receive: (timeoutMs?: number) => Promise<MainToWorker | undefined>;
    poll: () => MainToWorker | undefined;
    stop: () => void;
    subscribe: (callback: (msg: MainToWorker) => void) => () => void;
    data: Data;
};
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
export declare const addWorker: <MainToWorker, WorkerToMain, Data extends Object = {}>(workerCallback: (api: WorkerHelperAPI<MainToWorker, WorkerToMain, Data>) => void) => WorkerAPI<MainToWorker, WorkerToMain, Data>;
export {};

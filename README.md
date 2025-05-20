# 🧰 workerbox

**Type-safe, zero-boilerplate Web Worker helper for TypeScript.**

`workerbox` lets you create dynamic Web Workers with structured communication, reactive messaging, and clean startup logic — all without touching Blob URLs, `postMessage`, or `onmessage` handlers yourself.

---

## 🚀 Features
- ✅ **Type-safe** bidirectional communication between main thread and worker
- ⚙️ **Initialization data** passed via `start(data)`
- 📡 Support for async `receive()`, sync `poll()`, and reactive `subscribe()`
- 🔄 Automatically memoizes workers to avoid duplication
- 🪶 Tiny, dependency-free, and easy to integrate

---

## 📦 Installation

```bash
    npm install workerbox
    # or if using Yarn
    yarn add workerbox
```

You can also import directly from GitHub if it's unpublished:
```bash
    npm install github:your-username/workerbox
```

## 🧪 Quick Start
```ts
    import { addWorker } from "workerbox"

    const [start, api] = addWorker<
    { type: "ping" },        // Main → Worker
    { type: "pong" },        // Worker → Main
    { userId: string }       // Init data
    >((ctx) => {
    console.log("Worker started with userId:", ctx.data.userId)

    ctx.subscribe((msg) => {
        if (msg.type === "ping") {
        ctx.send({ type: "pong" })
        }
    })
    })

    // Start the worker with init data
    await start({ userId: "abc-123" })

    // Send a message to the worker
    api.send({ type: "ping" })

    // Listen for reply
    api.subscribe((msg) => console.log("Main received:", msg))
```

## 📘 API Reference
`addWorker<MainToWorker, WorkerToMain, Data>() => WorkerAPI`

Creates a new typed worker. The worker code is defined inline as a function and automatically converted into a background script.
```ts
    const [start, api] = addWorker<MainToWorker, WorkerToMain, InitData>((ctx) => { ... })
```

### Worker Startup
```ts
    await start(data)
```
Starts the worker and passes data to it. Accessible inside the worker via ctx.data.

### Worker API (in the main thread)
```ts
    {
        send(message: MainToWorker): void
        receive(timeoutMs?: number): Promise<WorkerToMain | undefined>
        poll(): WorkerToMain | undefined
        subscribe(callback): () => void
        stop(): void
    }
```
`send(message)`:
Sends a message from the main thread to the worker.

`receive(timeoutMs?)`:
Returns a promise that resolves with the next worker message (or undefined if it times out).

`poll()`:
Returns the next available message from the worker (non-blocking).

`subscribe(callback)`:
Listens for all messages from the worker. Returns an unsubscribe function.

`stop()`:
Terminates the worker and clears any internal state.

### Worker Helper API (inside the worker)
Inside the worker, your function receives this object:
```ts
    type WorkerHelperAPI<MainToWorker, WorkerToMain, Data> = {
        data: Data
        send(message: WorkerToMain): void
        receive(timeoutMs?: number): Promise<MainToWorker | undefined>
        poll(): MainToWorker | undefined
        subscribe(callback): () => void
        stop(): void
    }
```

## 🧑‍💻 Use Cases
- Background data parsing (e.g., CSV, JSON, image decoding)
- Keeping UIs responsive during heavy operations
- Reactive systems without SharedArrayBuffer or extra complexity
- Type-safe, stateful background engines
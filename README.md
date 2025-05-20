# WorkerBox
A lightweight, type-safe utility for building and managing Web Workers in TypeScript — with first-class support for bidirectional messaging, message polling, subscriptions, and initialization data.

workerbox wraps the complexity of Web Workers in a clean API, making it easy to:
- Send and receive strongly typed messages between the main thread and a worker.
- Pass structured initialization data on worker startup.
- Use reactive or async patterns via receive(), poll(), and subscribe().
- Avoid duplicated workers with automatic memoization via function signatures.

✨ Features
- ⚡ Zero-config dynamic worker creation via function serialization
- 🧠 Fully type-safe communication in both directions
- 🧰 Easy-to-use API (send, receive, poll, stop, subscribe)
- 🛠️ Pass and access structured init data without boilerplate
- 🧼 Automatically memoizes workers to prevent duplication

```ts
    const [start, api] = addWorker<
        { type: "ping" },        // main → worker
        { type: "pong" },        // worker → main
        { userId: string }       // init data
    >((ctx) => {
        console.log("Init:", ctx.data.userId)
        ctx.subscribe((msg) => {
            if (msg.type === "ping") ctx.send({ type: "pong" });
        })
    })

    await start({ userId: "abc-123" })
    api.send({ type: "ping" })
```
# 🚀 使用 ReadableStream 优雅地处理 SSE（Server-Sent Events）

在现代 Web 应用中，实时性变得越来越重要。虽然我们有 WebSocket 作为强力工具，但有些场景下，一个轻量、只需要服务器单向推送的方案 —— **Server-Sent Events（SSE）** 会是更合适的选择。

而在前端，我们也可以结合 `ReadableStream` 和 `for await...of` 语法，将流式事件处理写得优雅又现代。

本文将基于以下示例，介绍如何用 `ReadableStream` 封装 SSE 数据流，并逐步展示它的妙用。

---

### 💡 什么是 Server-Sent Events？

SSE 是浏览器内置支持的通信协议，允许服务端通过 HTTP 长连接不断推送消息给前端。前端只需使用原生的 `EventSource` 对象即可接收这些消息。

---

### ✨ 目标：将 EventSource 包装成 ReadableStream

我们希望实现下面这种代码结构：

```ts
for await (const event of stream) {
  // 处理每一条 SSE 消息
}
```

这就意味着我们需要把 `EventSource` 事件包装成一个异步可迭代的流。

---

### 🔧 createSSEStream：EventSource + ReadableStream

我们先封装一个 `createSSEStream` 函数：

```ts
function createSSEStream(url) {
  return new ReadableStream({
    start(controller) {
      const eventSource = new EventSource(url);

      eventSource.addEventListener("message", (event) => {
        controller.enqueue({ data: event.data, event: "message" });
      });

      eventSource.addEventListener("update", (event) => {
        controller.enqueue({ data: event.data, event: "update" });
      });

      eventSource.addEventListener("ping", (event) => {
        controller.enqueue({ data: event.data, event: "ping" });
      });

      eventSource.addEventListener("close", (event) => {
        controller.enqueue({ data: event.data, event: "close" });
        eventSource.close();
        controller.close(); // 关闭流
      });

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        eventSource.close();
        controller.error(err); // 推送错误
      };
    },
  });
}
```

这段代码的关键点：

- 用 `ReadableStream` 封装了事件监听；
- 每个事件都会通过 `controller.enqueue()` 推送数据；
- 通过监听 `close` 事件来主动终止连接；
- 在出错时关闭流并抛出错误。

---

### 🧪 使用 async/await 优雅消费流

封装好之后，我们可以像消费文件、网络流那样来使用 SSE：

```ts
const stream = createSSEStream("/sse");

for await (const chunk of stream) {
  console.log("接收到 SSE 事件：", chunk.event, chunk.data);
}
```

这让我们的事件处理逻辑可以完全异步串行写，无需陷入多个嵌套的回调地狱。

---

### 🎨 给每类事件加点视觉效果

假设我们要把每类事件都显示到页面上，可以这么写：

```ts
const backgroundColors = {
  message: "linear-gradient(135deg, #6a11cb, #2575fc)",
  update: "linear-gradient(135deg, #ff7e5f, #feb47b)",
  ping: "linear-gradient(135deg, #43cea2, #185a9d)",
  close: "linear-gradient(135deg, #ff512f, #dd2476)",
};

const outer = document.querySelector("#outer");

for await (const x of stream) {
  const dom = document.createElement("div");
  dom.innerHTML = `
    <div class='item-wrapper' style="
      margin-bottom: 10px; 
      padding: 10px; 
      border-radius: 5px; 
      background: ${backgroundColors[x.event] || backgroundColors.message}; 
      color: white;
      font-family: Arial;
      transform: scale(0.9);
      transition: all .3s ease;
    ">
      <strong>Event:</strong> ${x.event}<br>
      <strong>Data:</strong> ${x.data}
    </div>
  `;
  outer.appendChild(dom);
  setTimeout(() => {
    dom.firstElementChild.style.transform = "scale(1)";
  }, 100);
}
```

你可以结合 `JSON.stringify` 来格式化数据展示，或者为每种事件设计不同的 UI。

---

### 🧱 小结

- `ReadableStream` 让我们可以像处理 async 数据源一样处理 SSE；
- `for await...of` 语法写起来非常顺滑，易于维护；
- SSE 在适合“服务端单向推送”的场景（如实时通知、监控系统）非常合适。

---

### ✅ 最后：完整代码仓库

你可以在 [GitHub 仓库地址](https://github.com/linzhe141/sse-demo) 找到完整示例代码，包含后端 Express 服务和前端 HTML 页面。

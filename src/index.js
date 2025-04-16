import express from "express";

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 或指定具体域名
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 对于预检请求（OPTIONS）直接返回 200
  if (req.method === "OPTIONS") {
    // return res.sendStatus(200);
  }

  next();
});

app.get("/sse", (req, res) => {
  // 设置响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // flush headers
  res.flushHeaders();

  console.log("客户端连接了 SSE");

  // 发送 ping 心跳，保持连接
  const pingInterval = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 3000);

  let count = 0;
  const maxCount = 10; // 假设我们只发送 5 次数据
  // 模拟发送各种事件
  const sendEvents = () => {
    res.write(
      `event: message\ndata: ${JSON.stringify({ count: count++ })}\n\n`
    );

    const updatePayload = {
      id: Math.floor(Math.random() * 100),
      status: "updated",
    };
    res.write(`event: update\ndata: ${JSON.stringify(updatePayload)}\n\n`);

    if (count >= maxCount) {
      clearInterval(eventInterval); // 清除定时器，停止发送数据
      res.write(
        'event: close\ndata: {"message": "SSE stream is stopping"}\n\n'
      ); // 可选：发送一条消息
      res.end(); // 结束响应流
      console.log("SSE stream stopped after reaching max count");
    }
  };

  const eventInterval = setInterval(sendEvents, 1000);

  // 客户端断开连接时清理
  req.on("close", () => {
    console.log("客户端断开连接");
    clearInterval(pingInterval);
    clearInterval(eventInterval);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SSE server is running at http://localhost:${PORT}/sse`);
});

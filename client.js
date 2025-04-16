const sseURL = "http://localhost:3000/sse";

async function main() {
  const stream = createSSEStream(sseURL);

  const outer = document.querySelector("#outer");
  for await (const x of stream) {
    console.log("SSE chunk:", x);
    const backgroundColors = {
      message: "linear-gradient(135deg, #6a11cb, #2575fc)",
      update: "linear-gradient(135deg, #ff7e5f, #feb47b)",
      ping: "linear-gradient(135deg, #43cea2, #185a9d)",
      close: "linear-gradient(135deg, #ff512f, #dd2476)",
    };

    const dom = document.createElement("div");
    dom.innerHTML = `
    <div class='item-wrapper' style="
      margin-bottom: 10px; 
      padding: 10px; 
      border-radius: 5px; 
      background: ${
        backgroundColors[x.event] || "linear-gradient(135deg, #6a11cb, #2575fc)"
      }; 
      color: white; 
      font-family: Arial, sans-serif; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
      transition: all .3s ease;
      transform: scale(0.9);
    ">
      <strong>Event:</strong> ${x.event}<br>
      <strong>Data:</strong> ${x.data}
    </div>
  `;
    outer.appendChild(dom);

    setTimeout(() => {
      dom.querySelector(".item-wrapper").style.transform = "scale(1)";
    }, 100);
  }
}

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
        // 前端必须要主动断开，要不EventSource又会主动连接了
        eventSource.close();
        controller.close();
      });

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        eventSource.close();
        controller.close();
      };
    },
  });
}

main();

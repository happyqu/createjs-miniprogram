function compute(items) {
  return items.map(({ local, parent = [1, 0, 0, 1, 0, 0] }) => [
    parent[0] * local[0] + parent[2] * local[1],
    parent[1] * local[0] + parent[3] * local[1],
    parent[0] * local[2] + parent[2] * local[3],
    parent[1] * local[2] + parent[3] * local[3],
    parent[0] * local[4] + parent[2] * local[5] + parent[4],
    parent[1] * local[4] + parent[3] * local[5] + parent[5],
  ]);
}

worker.onMessage((message) => {
  if (!message || message.type !== "createjs:matrices") return;
  worker.postMessage({ id: message.id, matrices: compute(message.items || []) });
});

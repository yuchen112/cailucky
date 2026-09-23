import { arrange13 } from "./rules.mjs";
self.onmessage = (e) => {
  const { id, hand } = e.data;
  try {
    const generator = arrange13(hand);
    let step = generator.next();
    while (!step.done) step = generator.next();
    self.postMessage({ id, result: step.value });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};

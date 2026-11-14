const START_EVENT = "dear-letter:loading-start";
const FINISH_EVENT = "dear-letter:loading-finish";

export function startTopLoading() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

export function finishTopLoading() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FINISH_EVENT));
}

export { START_EVENT, FINISH_EVENT };

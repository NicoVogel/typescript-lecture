type GetDetails<T extends keyof HTMLElementEventMap> =
  HTMLElementEventMap[T] extends CustomEvent<infer U> ? U : never;

export function createEvent<T extends keyof HTMLElementEventMap>(
  eventName: T,
  detail: GetDetails<T>
) {
  // eslint-disable-next-line no-restricted-syntax
  return new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
  });
}

export type GetEvent<T extends keyof HTMLElementEventMap> =
  HTMLElementEventMap[T];

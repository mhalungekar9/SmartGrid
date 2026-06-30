type Listener<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Listener[]>();

  on(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event) ?? [];

    listeners.push(listener);

    this.listeners.set(event, listeners);
  }

  emit<T>(event: string, payload: T): void {
    const listeners = this.listeners.get(event);

    listeners?.forEach((listener) => listener(payload));
  }

  off(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event);

    if (!listeners) return;

    this.listeners.set(
      event,
      listeners.filter((l) => l !== listener),
    );
  }
}

// Proporciona una implementación básica de EventEmitter para el navegador
// Este archivo se importa antes que cualquier biblioteca que use node:events

class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, listener: Function): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
    return this;
  }
}

// Crear mock para el módulo node:events
const eventsModule = {
  EventEmitter
};

// Asignar al global para que esté disponible
(globalThis as any).nodeEvents = eventsModule;

// Si alguna importación intenta usar 'node:events', redirigirla a nuestro mock
if (typeof window !== 'undefined') {
  (window as any).require = (name: string) => {
    if (name === 'node:events' || name === 'events') {
      return eventsModule;
    }
    throw new Error(`Module ${name} not found`);
  };
}

export default eventsModule; 
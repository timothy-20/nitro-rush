import type { Entity } from './Entity';
import type { ComponentMap, ComponentType } from './Component';
import type { System } from './System';

export class World {
  private nextId = 0;
  private entities = new Set<Entity>();
  private stores = new Map<ComponentType, Map<Entity, unknown>>();
  private systems: System[] = [];

  createEntity(): Entity {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
    for (const store of this.stores.values()) {
      store.delete(entity);
    }
  }

  addComponent<K extends ComponentType>(entity: Entity, type: K, data: ComponentMap[K]): void {
    if (!this.stores.has(type)) {
      this.stores.set(type, new Map());
    }
    this.stores.get(type)!.set(entity, data);
  }

  getComponent<K extends ComponentType>(entity: Entity, type: K): ComponentMap[K] | undefined {
    return this.stores.get(type)?.get(entity) as ComponentMap[K] | undefined;
  }

  hasComponent(entity: Entity, type: ComponentType): boolean {
    return this.stores.get(type)?.has(entity) ?? false;
  }

  query(...types: ComponentType[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      if (types.every(t => this.hasComponent(entity, t))) {
        result.push(entity);
      }
    }
    return result;
  }

  addSystem(system: System): void {
    this.systems.push(system);
    system.init?.(this);
  }

  update(dt: number): void {
    for (const system of this.systems) {
      system.update(this, dt);
    }
  }

  destroy(): void {
    for (const system of this.systems) {
      system.destroy?.();
    }
    this.systems = [];
    this.entities.clear();
    this.stores.clear();
  }
}

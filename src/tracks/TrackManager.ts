import * as THREE from 'three';
import { buildSpline } from './SplineBuilder';
import { TrackMeshBuilder } from './TrackMeshBuilder';
import { SceneryBuilder } from './SceneryBuilder';
import { MAPS } from './data';
import type { TrackDefinition, SplineData } from './types';

export class TrackManager {
  SP: number[][] = [];
  SW: number[] = [];
  SN = 0;

  private trackGroup: THREE.Group | null = null;
  private sceneryGroup: THREE.Group | null = null;
  private trackMeshBuilder = new TrackMeshBuilder();
  private sceneryBuilder = new SceneryBuilder();

  get currentSpline(): SplineData {
    return { pts: this.SP, ws: this.SW };
  }

  rebuildSpline(idx: number): void {
    const t = MAPS[idx];
    const r = buildSpline(t.raw, t.widths, 14);
    this.SP = r.pts;
    this.SW = r.ws;
    this.SN = this.SP.length;
  }

  loadMap(idx: number, scene: THREE.Scene, groundMesh: THREE.Mesh, ambLight: THREE.AmbientLight, dl: THREE.DirectionalLight): void {
    const t = MAPS[idx];
    this.rebuildSpline(idx);

    scene.background = new THREE.Color(t.bg);
    scene.fog = new THREE.Fog(t.fog, t.fogNear ?? 160, t.fogFar ?? 820);
    (groundMesh.material as THREE.MeshStandardMaterial).color.setHex(t.gnd);
    ambLight.color.setHex(t.ambColor ?? 0x101030);
    ambLight.intensity = t.ambInt ?? 1.8;
    dl.color.setHex(t.dlColor ?? 0xffffff);
    dl.intensity = t.dlInt ?? 1.2;

    // Clear old
    if (this.trackGroup) { this.disposeGroup(this.trackGroup); scene.remove(this.trackGroup); }
    if (this.sceneryGroup) { this.disposeGroup(this.sceneryGroup); scene.remove(this.sceneryGroup); }

    // Build new
    this.trackGroup = this.trackMeshBuilder.build(this.SP, this.SW, t);
    scene.add(this.trackGroup);

    this.sceneryGroup = this.sceneryBuilder.build(t.scenery || 'monaco', this.SP, this.SW, this.SN);
    scene.add(this.sceneryGroup);
  }

  getTrackDef(idx: number): TrackDefinition {
    return MAPS[idx];
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose();
      }
    });
  }
}

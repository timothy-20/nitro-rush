import * as THREE from 'three';

export class Renderer {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ambLight: THREE.AmbientLight;
  dirLight: THREE.DirectionalLight;
  groundMesh: THREE.Mesh;
  gridHelper: THREE.GridHelper;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(innerWidth, innerHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020118);
    this.scene.fog = new THREE.Fog(0x020118, 160, 820);

    this.camera = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, 0.5, 2000);

    // Lights
    this.ambLight = new THREE.AmbientLight(0x101030, 1.8);
    this.scene.add(this.ambLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(100, 200, 80);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 1200;
    this.dirLight.shadow.camera.left = this.dirLight.shadow.camera.bottom = -800;
    this.dirLight.shadow.camera.right = this.dirLight.shadow.camera.top = 800;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.dirLight);

    // Ground
    this.groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000, 80, 80),
      new THREE.MeshStandardMaterial({ color: 0x08061a, roughness: 1 }),
    );
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.gridHelper = new THREE.GridHelper(4000, 120, 0x0a0a18, 0x0a0a18);
    this.scene.add(this.gridHelper);

    // Stars
    const sv: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI, r = 1400 + Math.random() * 300;
      sv.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true })));

    addEventListener('resize', () => {
      this.renderer.setSize(innerWidth, innerHeight);
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}

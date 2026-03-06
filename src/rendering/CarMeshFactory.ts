import * as THREE from 'three';

export function makeCar(colorHex: number, isPlayer: boolean): THREE.Group {
  const g = new THREE.Group();

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 9),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.7, emissive: colorHex, emissiveIntensity: 0.18 }));
  body.position.y = 1; body.castShadow = true; g.add(body);

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 4),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.8 }));
  hood.position.set(0, 1.88, 1.8); g.add(hood);

  // Cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x050515, roughness: 0.4, metalness: 0.6 }));
  cab.position.set(0, 2.3, -0.4); cab.castShadow = true; g.add(cab);

  // Windshield
  const wshld = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 2),
    new THREE.MeshStandardMaterial({ color: 0x4488cc, transparent: true, opacity: 0.5, roughness: 0 }));
  wshld.position.set(0, 2.7, 1.6); g.add(wshld);

  // Wheels
  ([[-2.7, 0.6, 3.2], [2.7, 0.6, 3.2], [-2.7, 0.6, -3.2], [2.7, 0.6, -3.2]] as const).forEach(([x, y, z]) => {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.8, 14), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
    wh.rotation.z = Math.PI / 2; wh.position.set(x, y, z); wh.castShadow = true; g.add(wh);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.82, 8), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 }));
    rim.rotation.z = Math.PI / 2; rim.position.set(x, y, z); g.add(rim);
  });

  // Headlights
  ([[-1.6, 1, 4.4], [1.6, 1, 4.4]] as const).forEach(([x, y, z]) => {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffcc })));
    g.children[g.children.length - 1].position.set(x, y, z);
    const sl = new THREE.SpotLight(0xffffff, isPlayer ? 2.5 : 1.2, 55, Math.PI / 8, 0.5);
    sl.position.set(x, y, z);
    sl.target.position.set(x, y - 0.5, z + 22);
    g.add(sl); g.add(sl.target);
  });

  // Tail lights
  ([[-1.6, 1, -4.4], [1.6, 1, -4.4]] as const).forEach(([x, y, z]) => {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: 0xff1111 })));
    g.children[g.children.length - 1].position.set(x, y, z);
  });

  // Ground glow
  const gw = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 8.6), new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 }));
  gw.position.y = 0.18; g.add(gw);

  // Wireframe outline
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.1, 1.7, 9.1)), new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.55 })));

  return g;
}

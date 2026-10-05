import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSite } from '../context/SiteContext';
import { CITIES } from '../data/cities';

export const Globe = () => {
  const canvasRef = useRef(null);
  const pinsRef = useRef(null);
  const pinElementsRef = useRef([]);

  const {
    isScout,
    poses,
    activeSection,
    selectedCityIndex,
    setSelectedCityIndex,
    isScanning,
    shockRef,
    addLeadRef,
    clearLeadsRef,
    citySelectRef
  } = useSite();

  // Keep latest props/state in refs so the Three.js loop never triggers React re-renders
  const stateRef = useRef({
    activeSection,
    selectedCityIndex,
    isScanning,
    poses,
    isScout
  });

  useEffect(() => {
    stateRef.current = {
      activeSection,
      selectedCityIndex,
      isScanning,
      poses,
      isScout
    };
  }, [activeSection, selectedCityIndex, isScanning, poses, isScout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pinBox = pinsRef.current;
    if (!canvas || !pinBox) return;

    let animId = null;
    let renderer = null;
    let disposed = false;

    try {
      const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      const root = document.documentElement;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 8);

      const wrap = new THREE.Group();
      const globe = new THREE.Group();
      wrap.add(globe);
      scene.add(wrap);

      function createTexture(fn) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        fn(g);
        return new THREE.CanvasTexture(c);
      }

      const dotT = createTexture((g) => {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(32, 32, 30, 0, 7);
        g.fill();
      });

      const glowT = createTexture((g) => {
        const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, 'rgba(255,255,255,1)');
        r.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = r;
        g.fillRect(0, 0, 64, 64);
      });

      function makePointsMaterial(size, op) {
        return new THREE.PointsMaterial({
          size,
          map: dotT,
          transparent: true,
          opacity: op,
          depthWrite: false,
          sizeAttenuation: true,
          alphaTest: 0.05
        });
      }

      // Point-sphere of N=2600 Fibonacci points
      const N = 2600;
      const base = new Float32Array(N * 3);
      const pos = new Float32Array(N * 3);
      const st = new Float32Array(N * 3);
      const rnd = new Float32Array(N);
      const ga = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = ga * i;
        const i3 = i * 3;
        base[i3] = Math.cos(th) * r * 2;
        base[i3 + 1] = y * 2;
        base[i3 + 2] = Math.sin(th) * r * 2;

        const u = Math.random() * 2 - 1;
        const w = Math.random() * 6.283;
        const q = Math.sqrt(1 - u * u);
        const R0 = 7 + Math.random() * 9;
        st[i3] = Math.cos(w) * q * R0;
        st[i3 + 1] = u * R0;
        st[i3 + 2] = Math.sin(w) * q * R0;
        rnd[i] = Math.random();
      }
      pos.set(rm ? base : st);

      const gg = new THREE.BufferGeometry();
      const pa = new THREE.BufferAttribute(pos, 3);
      gg.setAttribute('position', pa);
      const pm = makePointsMaterial(0.032, 0.8);
      const pts = new THREE.Points(gg, pm);
      pts.frustumCulled = false;
      globe.add(pts);

      // Stars
      const SN = 700;
      const sp = new Float32Array(SN * 3);
      for (let j = 0; j < SN; j++) {
        const u2 = Math.random() * 2 - 1;
        const w2 = Math.random() * 6.283;
        const q2 = Math.sqrt(1 - u2 * u2);
        const r2 = 16 + Math.random() * 24;
        sp[j * 3] = Math.cos(w2) * q2 * r2;
        sp[j * 3 + 1] = u2 * r2;
        sp[j * 3 + 2] = Math.sin(w2) * q2 * r2;
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const stm = makePointsMaterial(0.09, 0.45);
      const stars = new THREE.Points(sg, stm);
      stars.frustumCulled = false;
      scene.add(stars);

      // Glow sprite
      const gm = new THREE.SpriteMaterial({ map: glowT, transparent: true, opacity: 0.16, depthWrite: false });
      const gs = new THREE.Sprite(gm);
      gs.scale.set(8, 8, 1);
      wrap.add(gs);

      function latLonToVector(lat, lon, rad) {
        lat *= Math.PI / 180;
        lon *= Math.PI / 180;
        return {
          x: rad * Math.cos(lat) * Math.sin(lon),
          y: rad * Math.sin(lat),
          z: rad * Math.cos(lat) * Math.cos(lon)
        };
      }

      const cs = CITIES.map((c) => latLonToVector(c.lat, c.lon, 2.03));
      const cp = new Float32Array(cs.length * 3);
      cs.forEach((v, i) => {
        cp[i * 3] = v.x;
        cp[i * 3 + 1] = v.y;
        cp[i * 3 + 2] = v.z;
      });

      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(cp, 3));
      const cm = makePointsMaterial(0.13, 1);
      globe.add(new THREE.Points(cg, cm));

      const wm = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.07 });
      globe.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.97, 2), wm));

      const mkm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      const mark = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.14, 40), mkm);
      globe.add(mark);

      const om = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1 });
      const orb = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.004, 8, 200), om);
      orb.rotation.x = 1.25;
      wrap.add(orb);

      const sm = new THREE.MeshBasicMaterial({});
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), sm);
      wrap.add(sat);

      const swm_ = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
      const swm = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 96), swm_);
      scene.add(swm);

      // Arcs & Packets
      const lm = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
      const arcG = new THREE.Group();
      let arcs = [];
      const pkp = new Float32Array(7 * 3);
      const pkg = new THREE.BufferGeometry();
      globe.add(arcG);

      pkg.setAttribute('position', new THREE.BufferAttribute(pkp, 3));
      const pkm = makePointsMaterial(0.1, 1);
      const pks = new THREE.Points(pkg, pkm);
      pks.frustumCulled = false;
      globe.add(pks);

      let sel = {
        lat: CITIES[0].lat,
        lon: CITIES[0].lon,
        i: 0,
        dirty: true,
        arcs: true
      };

      function buildArcs() {
        arcs.forEach((a) => {
          arcG.remove(a.line);
          a.line.geometry.dispose();
        });
        arcs = [];
        const A = cs[sel.i];

        cs.forEach((B, j) => {
          if (j === sel.i) return;
          const dx = A.x - B.x;
          const dy = A.y - B.y;
          const dz = A.z - B.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const mx_ = A.x + B.x;
          const my_ = A.y + B.y;
          const mz_ = A.z + B.z;
          const ml = Math.sqrt(mx_ * mx_ + my_ * my_ + mz_ * mz_) || 1;
          const h = 2.03 + dist * 0.45;

          const M = { x: (mx_ / ml) * h, y: (my_ / ml) * h, z: (mz_ / ml) * h };
          const n = 40;
          const arr = new Float32Array((n + 1) * 3);

          for (let k = 0; k <= n; k++) {
            const t = k / n;
            const a = (1 - t) * (1 - t);
            const b = 2 * (1 - t) * t;
            const c = t * t;
            arr[k * 3] = a * A.x + b * M.x + c * B.x;
            arr[k * 3 + 1] = a * A.y + b * M.y + c * B.y;
            arr[k * 3 + 2] = a * A.z + b * M.z + c * B.z;
          }

          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
          g.setDrawRange(0, rm ? n + 1 : 0);
          const line = new THREE.Line(g, lm);
          arcG.add(line);
          arcs.push({ line, arr, prog: rm ? 1 : 0, n });
        });
        pkm.opacity = 1;
      }

      // Scout lead markers on globe
      const LN = 12;
      const lp = new Float32Array(LN * 3);
      const lg = new THREE.BufferGeometry();
      let lc = 0;
      lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
      lg.setDrawRange(0, 0);
      const lmp = makePointsMaterial(0.085, 1);
      const lpts = new THREE.Points(lg, lmp);
      lpts.frustumCulled = false;
      globe.add(lpts);

      addLeadRef.current = () => {
        if (lc >= LN) return;
        const v = latLonToVector(
          sel.lat + (Math.random() - 0.5) * 9,
          sel.lon + (Math.random() - 0.5) * 9,
          2.03
        );
        lp[lc * 3] = v.x;
        lp[lc * 3 + 1] = v.y;
        lp[lc * 3 + 2] = v.z;
        lc++;
        lg.setDrawRange(0, lc);
        lg.attributes.position.needsUpdate = true;
        shockRef.current = 1;
      };

      clearLeadsRef.current = () => {
        lc = 0;
        lg.setDrawRange(0, 0);
      };

      citySelectRef.current = (idxOrGeo) => {
        let targetLat, targetLon, targetIdx = 0;
        if (typeof idxOrGeo === 'number') {
          const city = CITIES[idxOrGeo];
          if (city) {
            targetLat = city.lat;
            targetLon = city.lon;
            targetIdx = idxOrGeo;
          }
        } else if (idxOrGeo && typeof idxOrGeo === 'object') {
          targetLat = idxOrGeo.lat;
          targetLon = idxOrGeo.lon;
          targetIdx = typeof idxOrGeo.i === 'number' ? idxOrGeo.i : 0;
        }

        if (targetLat !== undefined && targetLon !== undefined) {
          sel = {
            lat: targetLat,
            lon: targetLon,
            i: targetIdx,
            dirty: true,
            arcs: true
          };
          free = false;
          if (clearLeadsRef.current) clearLeadsRef.current();
        }
      };

      const mats = [lmp, pm, cm, wm, mkm, om, sm, swm_, lm, pkm, stm, gm];

      let lastTheme = '';
      function paint(force = false) {
        try {
          const currentTheme = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          if (!force && currentTheme === lastTheme) return;
          lastTheme = currentTheme;
          const c = new THREE.Color(getComputedStyle(root).getPropertyValue('--ink').trim() || '#000');
          mats.forEach((m) => m.color.copy(c));
        } catch (e) {}
      }

      function onResize() {
        if (!renderer || disposed) return;
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }

      window.addEventListener('resize', onResize);
      onResize();
      paint();

      // Render pins in DOM
      pinBox.innerHTML = '';
      const pins = CITIES.map((c, i) => {
        const b = document.createElement('button');
        b.className = 'pin';
        b.type = 'button';
        b.textContent = c.name;
        b.addEventListener('click', () => {
          setSelectedCityIndex(i);
        });
        pinBox.appendChild(b);
        return b;
      });
      pinElementsRef.current = pins;

      // Pointer & Drag handling
      let drag = false;
      let lx = 0;
      let ly = 0;
      let dvx = 0;
      let free = false;
      let scanSpin = 0;
      let mx = 0;
      let my = 0;

      const handlePointerMove = (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        if (!drag) return;
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
        cur.ry += dx * 0.006;
        dvx = dx * 0.006;
        cur.rx = Math.max(-1.1, Math.min(1.1, cur.rx + dy * 0.004));
      };

      const handlePointerDown = (e) => {
        if (e.target.closest && e.target.closest('a,button,input,label,.card,.plan,.res,.nts,.faq,.stats3,#hud,.kb')) {
          return;
        }
        drag = true;
        lx = e.clientX;
        ly = e.clientY;
        free = true;
        document.body.classList.add('dragging');
        shockRef.current = 1;
      };

      const handlePointerUp = () => {
        drag = false;
        document.body.classList.remove('dragging');
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      // Loop state variables
      const cur = { x: 0, y: 0, s: 1, o: 0.8, ry: 0, rx: 0.25, z: 8 };
      let lastY = window.scrollY;
      let f = 0;
      let lastIdx = -1;
      let t0 = 0;
      let intro = rm ? 1 : 0;
      let imp = null;
      let shockOn = false;
      const INTRO = 3000;

      function ang(a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
      }

      function ease(x) {
        x = Math.max(0, Math.min(1, x));
        return 1 - Math.pow(1 - x, 4);
      }

      function frame(t) {
        if (disposed) return;
        animId = requestAnimationFrame(frame);
        f++;
        if (!t0) t0 = t;
        if (f % 30 === 0) paint();

        const { activeSection: idx, poses: curPoses, isScanning: scanning, isScout: currentIsScout } = stateRef.current;
        const XS = curPoses.XS;
        const SC = curPoses.SC;
        const OP = curPoses.OP;
        const CZ = curPoses.CZ;

        if (scanning && f % 50 === 0) {
          shockRef.current = 1;
        }

        const d = window.innerWidth >= 900;
        const vy = window.scrollY - lastY;
        lastY = window.scrollY;

        if (idx !== lastIdx) {
          free = false;
          lastIdx = idx;
        }

        if (sel.arcs) {
          buildArcs();
          sel.arcs = false;
        }

        const poseLen = XS.length;
        const safeIdx = Math.max(0, Math.min(poseLen - 1, idx));
        const tx = d ? XS[safeIdx] : 0;
        const ty = d ? 0 : 0.9;
        const ts = d ? SC[safeIdx] : (safeIdx === (currentIsScout ? 3 : 5) ? 0.45 : 0.75);

        cur.x += (tx - cur.x) * 0.05;
        cur.y += (ty - cur.y) * 0.05;
        cur.s += (ts - cur.s) * 0.05;
        cur.o += (OP[safeIdx] - cur.o) * 0.05;
        cur.z += ((d ? CZ[safeIdx] : CZ[safeIdx] + 1.5) - (scanning ? 1.2 : 0) - cur.z) * 0.04;

        if ((currentIsScout ? idx <= 1 : idx === 1) && !free) {
          cur.ry += ang((-sel.lon * Math.PI) / 180 - cur.ry) * 0.07;
          cur.rx += ((sel.lat * Math.PI) / 180 - cur.rx) * 0.07;
        } else {
          cur.ry += (rm ? 0 : 0.0035) + vy * 0.004 + (drag ? 0 : dvx);
          dvx *= 0.95;
          if (!free) cur.rx += (0.25 - cur.rx) * 0.05;
        }

        if (scanning) {
          cur.ry += 0.14;
        }

        const floatY = Math.sin(t * 0.0016) * (d ? 0.08 : 0.04);
        const floatX = Math.cos(t * 0.0011) * (d ? 0.05 : 0.02);

        globe.rotation.set(cur.rx, cur.ry, 0);
        wrap.position.set(cur.x + (rm ? 0 : floatX), cur.y + (rm ? 0 : floatY), 0);
        wrap.scale.setScalar(cur.s);

        wrap.rotation.y += ((rm ? 0 : mx * 0.35) - wrap.rotation.y) * 0.05;
        wrap.rotation.x += ((rm ? 0 : my * 0.25) - wrap.rotation.x) * 0.05;
        wrap.rotation.z += ((rm ? 0 : -mx * 0.08) - wrap.rotation.z) * 0.05;

        camera.position.set(rm ? 0 : mx * 0.7, rm ? 0 : -my * 0.45, cur.z);
        camera.lookAt(0, 0, 0);

        stars.rotation.y += rm ? 0 : 0.0002;
        stars.rotation.x = my * 0.05;

        pm.opacity = cur.o;
        cm.opacity = Math.min(1, cur.o + 0.15);
        stm.opacity = 0.45;

        let need = false;
        if (intro < 1) {
          intro = Math.min(1, (t - t0) / INTRO);
          for (let i = 0; i < N; i++) {
            const e = ease(intro * 1.5 - rnd[i] * 0.5);
            const k = i * 3;
            pos[k] = st[k] + (base[k] - st[k]) * e;
            pos[k + 1] = st[k + 1] + (base[k + 1] - st[k + 1]) * e;
            pos[k + 2] = st[k + 2] + (base[k + 2] - st[k + 2]) * e;
          }
          need = true;
        } else if (shockRef.current > 0) {
          if (!imp) {
            imp = new THREE.Vector3(0, 0, 1)
              .applyQuaternion(globe.quaternion.clone().conjugate())
              .normalize();
          }
          const front = (1 - shockRef.current) * Math.PI * 1.1;
          const amp = 0.4 * shockRef.current;
          for (let i2 = 0; i2 < N; i2++) {
            const k2 = i2 * 3;
            const dt = (base[k2] * imp.x + base[k2 + 1] * imp.y + base[k2 + 2] * imp.z) / 2;
            const dd = Math.acos(Math.max(-1, Math.min(1, dt)));
            const w3 = Math.exp(-Math.pow((dd - front) / 0.25, 2)) * amp + 1;
            pos[k2] = base[k2] * w3;
            pos[k2 + 1] = base[k2 + 1] * w3;
            pos[k2 + 2] = base[k2 + 2] * w3;
          }
          shockOn = true;
          need = true;
        } else if (shockOn) {
          pos.set(base);
          shockOn = false;
          imp = null;
          need = true;
        }
        if (need) pa.needsUpdate = true;

        if (sel.dirty) {
          const v = cs[sel.i];
          mark.position.set(v.x, v.y, v.z);
          mark.lookAt(v.x * 2, v.y * 2, v.z * 2);
          sel.dirty = false;
        }
        const kk = 1 + 0.3 * Math.sin(t * 0.004);
        mark.scale.set(kk, kk, kk);

        const a0 = t * 0.0006;
        sat.position.set(
          Math.cos(a0) * 2.9,
          Math.sin(a0) * 2.9 * Math.sin(1.25),
          -Math.sin(a0) * 2.9 * Math.cos(1.25)
        );

        arcs.forEach((a, j) => {
          if (a.prog < 1) {
            a.prog = Math.min(1, a.prog + 0.018);
            a.line.geometry.setDrawRange(0, Math.floor(a.prog * (a.n + 1)));
          }
          const u3 = (t * 0.00035 + j * 0.14) % 1;
          const kq = Math.min(a.n, Math.floor(u3 * (a.n + 1))) * 3;
          pkp[j * 3] = a.arr[kq];
          pkp[j * 3 + 1] = a.arr[kq + 1];
          pkp[j * 3 + 2] = a.arr[kq + 2];
        });
        pkg.attributes.position.needsUpdate = true;

        if (shockRef.current > 0) shockRef.current -= 0.014;
        if (shockRef.current < 0) shockRef.current = 0;

        if (shockRef.current > 0) {
          swm.position.set(cur.x, cur.y, 0);
          const q3 = 1 + (1 - shockRef.current) * 4 * cur.s;
          swm.scale.set(q3, q3, q3);
          swm_.opacity = Math.max(0, shockRef.current * 0.4);
        } else {
          swm_.opacity = 0;
        }

        renderer.render(scene, camera);

        // City labels follow markers (Section 8: Landing shows on s1, Scout shows on s0)
        const show = (currentIsScout ? idx === 0 : idx === 1) && d;
        pinBox.classList.toggle('on', show);

        if (show) {
          globe.updateMatrixWorld(true);
          for (let p = 0; p < pins.length; p++) {
            const wv = new THREE.Vector3(cs[p].x, cs[p].y, cs[p].z).applyMatrix4(globe.matrixWorld);
            const nx = wv.x - wrap.position.x;
            const ny = wv.y - wrap.position.y;
            const nz = wv.z;
            const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

            const cx = camera.position.x - wv.x;
            const cy = camera.position.y - wv.y;
            const cz = camera.position.z - wv.z;
            const cl = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
            const face = (nx * cx + ny * cy + nz * cz) / (nl * cl);

            wv.project(camera);
            const op = Math.max(0, Math.min(1, (face - 0.12) * 3));
            pins[p].style.transform = `translate(${((wv.x * 0.5 + 0.5) * window.innerWidth).toFixed(1)}px, ${((-wv.y * 0.5 + 0.5) * window.innerHeight).toFixed(1)}px)`;
            pins[p].style.opacity = op;
            pins[p].style.pointerEvents = op > 0.4 ? 'auto' : 'none';
            pins[p].classList.toggle('sel', p === sel.i);
          }
        }
      }

      animId = requestAnimationFrame(frame);

      return () => {
        disposed = true;
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);

        // Clean up geometries, materials, textures, renderer
        dotT.dispose();
        glowT.dispose();
        gg.dispose();
        sg.dispose();
        cg.dispose();
        lg.dispose();
        pkg.dispose();
        mats.forEach((m) => m.dispose());
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.warn('WebGL Globe initialization fallback:', err);
      document.body.classList.add('nogl');
    }
  }, [setSelectedCityIndex, addLeadRef, clearLeadsRef, citySelectRef, shockRef]);

  return (
    <>
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div id="pins" ref={pinsRef} aria-label="City markers" />
    </>
  );
};

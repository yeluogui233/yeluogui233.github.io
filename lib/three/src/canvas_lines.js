/**
 * Canvas lines retain the existing scene and pointer response.
 * Render only while the camera is moving, with the original refresh rate and pixel ratio.
 */
(function() {
  'use strict';
  var mouseX = 0, mouseY = 0;
  var halfWidth = innerWidth / 2, halfHeight = innerHeight / 2;
  var camera, scene, renderer, frame = 0;
  var resizePending = false;

  function wake() {
    if (!frame && !document.hidden) {
      frame = requestAnimationFrame(animate);
    }
  }

  function resize() {
    halfWidth = innerWidth / 2;
    halfHeight = innerHeight / 2;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(devicePixelRatio || 1);
    renderer.setSize(innerWidth, innerHeight);
    resizePending = false;
  }

  function animate() {
    frame = 0;
    if (document.hidden) return;
    if (resizePending) resize();
    var factor = .05;
    camera.position.x += (mouseX - camera.position.x) * factor;
    camera.position.y += (200 - mouseY - camera.position.y) * factor;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
    if (Math.abs(mouseX - camera.position.x) > .15 ||
        Math.abs(200 - mouseY - camera.position.y) > .15) wake();
  }

  function init() {
    var container = document.createElement('div');
    container.id = 'kylo-canvas-lines';
    container.className = 'kylo-canvas-lines';
    container.style.cssText = 'position:fixed;inset:0;z-index:0;opacity:.52;pointer-events:none;overflow:hidden';
    document.body.appendChild(container);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 1, 10000);
    camera.position.z = 100;
    scene = new THREE.Scene();
    renderer = new THREE.CanvasRenderer({ alpha: true });
    resize();
    container.appendChild(renderer.domElement);
    var material = new THREE.SpriteCanvasMaterial({
      color: 10263708,
      program: function(context) {
        context.beginPath();
        context.arc(0, 0, .5, 0, Math.PI * 2, true);
        context.fill();
      }
    });
    var geometry = new THREE.Geometry();
    for (var i = 0; i < 100; i++) {
      var particle = new THREE.Sprite(material);
      particle.position.x = Math.random() * 2 - 1;
      particle.position.y = Math.random() * 2 - 1;
      particle.position.z = Math.random() * 2 - 1;
      particle.position.normalize();
      particle.position.multiplyScalar(10 * Math.random() + 450);
      particle.scale.x = particle.scale.y = 10;
      scene.add(particle);
      geometry.vertices.push(particle.position);
    }
    scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 10263708, opacity: .5 })));
    document.addEventListener('mousemove', function(event) {
      mouseX = event.clientX - halfWidth;
      mouseY = event.clientY - halfHeight;
      wake();
    }, { passive: true });
    document.addEventListener('touchstart', function(event) {
      if (event.touches.length > 1) { mouseX = event.touches[0].pageX - halfWidth; wake(); }
    }, { passive: true });
    document.addEventListener('touchmove', function(event) {
      if (event.touches.length === 1) {
        mouseX = event.touches[0].clientX - halfWidth;
        wake();
      }
    }, { passive: true });
    window.addEventListener('resize', function() { resizePending = true; wake(); }, { passive: true });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else wake();
    });
    wake();
  }

  if (window.requestIdleCallback) requestIdleCallback(init, { timeout: 1200 });
  else requestAnimationFrame(init);
})();

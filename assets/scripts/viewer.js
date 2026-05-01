export async function initViewer(){
  const canvas=document.getElementById('statueViewer');
  if(!canvas) return;

  const modelUrl=canvas.dataset.model;
  const loading=document.getElementById('modelLoading');
  const fallback=document.getElementById('modelFallback');
  const fallbackMessage=document.getElementById('fallbackMessage');
  const statusBadge=document.getElementById('modelStatus');
  const readyState=document.getElementById('readyState');
  const triCount=document.getElementById('triCount');
  const modelSize=document.getElementById('modelSize');
  const scaleSlider=document.getElementById('modelScale');
  const scaleValue=document.getElementById('scaleValue');
  const autoRotateBtn=document.getElementById('autoRotate');
  const viewButtons=document.querySelectorAll('.view-btn');

  if(!modelUrl){
    fallbackMessage.textContent='Модель не задана.';
    fallback?.classList.add('show');
    return;
  }

  let autoRotate=true;
  let pointerDown=false;
  let pointerStartX=0;
  let pointerStartRotation=0;
  let baseScale=1;

  const THREE = await import('three');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,0.1,1000);
  camera.position.set(0,0.4,1.35);

  const group=new THREE.Group();
  const modelRoot=new THREE.Group();
  group.add(modelRoot);
  scene.add(group);

  const ambient=new THREE.AmbientLight(0xffffff,0.9);
  scene.add(ambient);
  const dirLight=new THREE.DirectionalLight(0xffffff,0.85);
  dirLight.position.set(0.5,1,1);
  scene.add(dirLight);
  const fillLight=new THREE.DirectionalLight(0xffffff,0.35);
  fillLight.position.set(-1,0.4,-0.7);
  scene.add(fillLight);

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.ShadowMaterial({opacity:0.08}));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-0.62;
  ground.receiveShadow=true;
  scene.add(ground);

  function resize(){
    const width=canvas.clientWidth;
    const height=canvas.clientHeight;
    const pixelRatio=Math.min(window.devicePixelRatio,2);
    const needResize=canvas.width!==Math.floor(width*pixelRatio)||canvas.height!==Math.floor(height*pixelRatio);
    if(needResize){
      renderer.setSize(width,height,false);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    }
  }

  function animate(){
    resize();
    if(autoRotate&&!pointerDown) group.rotation.y += 0.0033;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }

  canvas.style.cursor='grab';
  canvas.style.touchAction='none';

  canvas.addEventListener('pointerdown',event=>{
    pointerDown=true;
    pointerStartX=event.clientX;
    pointerStartRotation=group.rotation.y;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor='grabbing';
  });

  canvas.addEventListener('pointermove',event=>{
    if(!pointerDown) return;
    const delta=(event.clientX-pointerStartX)*0.005;
    group.rotation.y = pointerStartRotation + delta;
  });

  const releasePointer = event=>{
    pointerDown=false;
    canvas.style.cursor='grab';
    if(event.pointerId) canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerup',releasePointer);
  canvas.addEventListener('pointercancel',releasePointer);
  canvas.addEventListener('pointerleave',releasePointer);

  viewButtons.forEach(button=>{
    button.addEventListener('click',()=>{
      viewButtons.forEach(btn=>btn.classList.toggle('active',btn===button));
      const view=button.dataset.view;
      if(view==='iso'){camera.position.set(1.2,0.8,1.2);camera.up.set(0,1,0);}
      if(view==='front'){camera.position.set(0,0.45,1.3);camera.up.set(0,1,0);}
      if(view==='side'){camera.position.set(1.3,0.3,0.1);camera.up.set(0,1,0);}
      if(view==='top'){camera.position.set(0,1.4,0.08);camera.up.set(0,0,-1);}
      camera.lookAt(0,0,0);
      camera.updateProjectionMatrix();
    });
  });

  autoRotateBtn?.addEventListener('click',()=>{
    autoRotate=!autoRotate;
    autoRotateBtn.classList.toggle('active',autoRotate);
    autoRotateBtn.textContent=autoRotate?'Автоповорот':'Вручную';
  });

  const setState=(text)=>{
    if(statusBadge) statusBadge.textContent=text;
    if(readyState) readyState.textContent=text;
  };

  try{
    setState('Загрузка');
    const [{FBXLoader}]=await Promise.all([
      import('../vendor/three/examples/jsm/loaders/FBXLoader.js')
    ]);
    const loader=new FBXLoader();
    loader.load(modelUrl,async object=>{
      object.traverse(child=>{
        if(child.isMesh){
          child.castShadow=true;
          child.receiveShadow=true;
          if(child.material){
            child.material.side = THREE.DoubleSide;
            if(child.material.map) child.material.map.encoding = THREE.sRGBEncoding;
          }
        }
      });
      modelRoot.add(object);
      const bounds=new THREE.Box3().setFromObject(object);
      const size=bounds.getSize(new THREE.Vector3());
      const center=bounds.getCenter(new THREE.Vector3());
      object.position.x -= center.x;
      object.position.y -= center.y;
      object.position.z -= center.z;
      const maxDim=Math.max(size.x,size.y,size.z); 
      baseScale = maxDim ? 0.85 / maxDim : 1;
      modelRoot.scale.setScalar(baseScale);
      if(scaleSlider&&scaleValue){
        scaleSlider.addEventListener('input',()=>{
          const value=Number(scaleSlider.value);
          scaleValue.textContent=`${value}%`;
          modelRoot.scale.setScalar(baseScale * (value / 100));
        });
      }
      const triangles = (()=>{let count=0;object.traverse(node=>{if(node.isMesh){const geom=node.geometry;if(geom.index) count += geom.index.count/3; else if(geom.attributes.position) count += geom.attributes.position.count/3;}});return count;})();
      if(triCount) triCount.textContent=`${Math.round(triangles)} треуг.`;
      if(modelSize){
        try{const head=await fetch(modelUrl,{method:'HEAD'});const length=head.headers.get('content-length');modelSize.textContent=length?`${(Number(length)/1024/1024).toFixed(1)} MB`:'—';}catch{}
      }
      setState('Готово');
      loading?.classList.add('hide');
    },progress=>{
      if(progress.lengthComputable&&readyState){
        readyState.textContent=`Загружено ${Math.round(progress.loaded/1024)} KB`;
      }
    },error=>{
      console.error(error);
      fallbackMessage.textContent='Не удалось загрузить модель. Запустите сайт через сервер или проверьте файл.';
      fallback?.classList.add('show');
      loading?.classList.add('hide');
      setState('Ошибка');
    });
  }catch(error){
    console.error(error);
    fallbackMessage.textContent='Ошибка загрузки 3D-движка. Обновите страницу.';
    fallback?.classList.add('show');
    loading?.classList.add('hide');
    setState('Ошибка');
  }

  animate();
}

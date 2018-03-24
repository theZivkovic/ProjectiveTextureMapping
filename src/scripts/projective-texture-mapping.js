import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls';
import 'three/examples/js/loaders/OBJLoader';

import basicVertexShader from '../static/shaders/basic_vs.glsl';
import basicFragmentShader from '../static/shaders/basic_fs.glsl';
import projectorTexturePath from '../static/images/projector-texture.png';
import projectorModelPath from '../static/models/projector.obj';

import rotateUpPath from '../static/images/rotate_up.png';
import rotateDownPath from '../static/images/rotate_down.png';
import rotateLeftPath from '../static/images/rotate_left.png';
import rotateRightPath from '../static/images/rotate_right.png';
import increasePath from '../static/images/increase.png';
import decreasePath from '../static/images/descrease.png';

const PROJECTOR_STEP_ANGLE = Math.PI / 18.0;
const PROJECTOR_MIN_VERTICAL_ANGLE = 0.0;
const PROJECTOR_MAX_VERICAL_ANGLE = Math.PI / 2.0;
const PROJECTOR_INITIAL_HOR_ANGLE =  Math.PI / 2.0;
const PROJECTOR_INITIAL_VERT_ANGLE = Math.PI / 4.0;
const PROJECTOR_DISTANCE = 15.0;
const PROJECTOR_MAX_SCALE = 3;
const PROJECTOR_MIN_SCALE = 0.5;
const PROJECTOR_INITIAL_SCALE = 1;
const PROJECTOR_SCALE_STEP = 0.1;

export default class ProjectiveTextureMapping {

    constructor(){
        
        this.containerDiv = document.querySelector('#container');
        
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.animate = this.animate.bind(this);

        this.initializeUI();
        this.initialize3DContext();

        Promise.all([
          this.loadProjectorModel(),
          this.loadProjectorTexture()
        ])
        .then(() => {
          this.initializeSceneObjects();
          this.initializeCamera();
          this.initializeProjector();
          this.initializeLights();
          this.initializeShaderMaterialUniforms();
          this.start();
          this.onResize();
        });

        window.onresize = this.onResize.bind(this);
    }

    initializeUI() {
      const rotateLeftBtn = document.querySelector('#rotateLeft');
      const rotateRightBtn = document.querySelector('#rotateRight');
      const rotateUpBtn = document.querySelector('#rotateUp');
      const rotateDownBtn = document.querySelector('#rotateDown');
      const increaseProjectionBtn = document.querySelector('#increaseProjection');
      const decreaseProjectionBtn = document.querySelector('#decreaseProjection');

      rotateLeftBtn.addEventListener("click", (e) =>  this.onRotateProjectorLeftClick(e));
      rotateRightBtn.addEventListener("click", (e) =>  this.onRotateProjectorRightClick(e));
      rotateUpBtn.addEventListener("click", (e) =>  this.onRotateProjectorUpClick(e));
      rotateDownBtn.addEventListener("click", (e) =>  this.onRotateProjectorDownClick(e));
      increaseProjectionBtn.addEventListener("click", (e) =>  this.onIncreaseProjectionSize(e));
      decreaseProjectionBtn.addEventListener("click", (e) =>  this.onDecreaseProjectionSize(e));
    }

    initialize3DContext() {
      this.scene = new THREE.Scene();

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setClearColor('#000000')
      this.renderer.setSize(this.containerDiv.clientWidth, this.containerDiv.clientHeight);

      this.containerDiv.appendChild(this.renderer.domElement);
    }

    initializeSceneObjects() {

      this.shaderMaterial =
        new THREE.ShaderMaterial({
          vertexShader:   basicVertexShader,
          fragmentShader: basicFragmentShader
      });

      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cube = new THREE.Mesh(cubeGeometry, this.shaderMaterial)
      cube.position.y = 1.0;
      this.scene.add(cube)

      const planeGeometry = new THREE.PlaneGeometry(30, 30, 32);
      const plane = new THREE.Mesh(planeGeometry, this.shaderMaterial);
      plane.lookAt(new THREE.Vector3(0.0, 1.0, 0.0));
      this.scene.add(plane);

      const sphereGeometry = new THREE.SphereGeometry(2.0, 32, 32);
      const sphere = new THREE.Mesh(sphereGeometry, this.shaderMaterial);
      sphere.position.set(3.0, 2.0, 3.0);
      this.scene.add(sphere);
    }

    initializeCamera() {
      this.camera = new THREE.PerspectiveCamera(75, this.containerDiv.clientWidth / this.containerDiv.clientHeight, 0.1, 1000);
      this.camera.position.set(12.0, 17.0, 12.0);
      this.controls = new THREE.OrbitControls( this.camera,  this.renderer.domElement );
    }

    initializeProjector() {
      this.projectorPhi = PROJECTOR_INITIAL_HOR_ANGLE;
      this.projectorTheta = PROJECTOR_INITIAL_VERT_ANGLE;
      this.projectorDistance = PROJECTOR_DISTANCE;
      this.projectedImageScale = PROJECTOR_INITIAL_SCALE;

      this.projector = new THREE.PerspectiveCamera(30, 1.0, 0.1, 1000);
      this.updateProjectorFromSphericalCoords();
      this.projector.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
      this.projector.updateMatrixWorld();

      this.syncProjectorModelWithActualProjector();
      this.scene.add(this.projectorModel);
    }

    updateProjectorFromSphericalCoords(){
      this.projector.position.set(
        this.projectorDistance * Math.cos(this.projectorPhi) * Math.cos(this.projectorTheta),
        this.projectorDistance * Math.sin(this.projectorTheta),
        this.projectorDistance * Math.sin(this.projectorPhi) * Math.cos(this.projectorTheta)
      );
      this.projector.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
      this.projector.updateMatrixWorld();
    }
    
    syncProjectorModelWithActualProjector(){
      this.projectorModel.position.copy(this.projector.position);
      this.projectorModel.quaternion.copy(this.projector.quaternion);
      this.projectorModel.updateMatrix();
    }

    initializeLights(){
      this.light = new THREE.DirectionalLight( 0xffffff );
      this.light.position.set( 0, 1, 1 ).normalize();
      this.scene.add(this.light);
    }

    initializeShaderMaterialUniforms() {
      this.shaderMaterial.uniforms = {
        'projectorProjectionMat' : { type: 'm4', value: this.projector.projectionMatrix},
        'projectorViewMat': { type: 'm4', value: this.projector.matrixWorldInverse},
        'projectorTexture': { type: 't', value: this.projectorTexture},
        'lightPosition': {type:'v3', value: this.light.position },
        'projectedImageScale': { value: this.projectedImageScale }
      }
    }

    loadProjectorTexture(){
      return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(projectorTexturePath, (texture) => {
          this.projectorTexture = texture;
          resolve();
        });
      });
    }

    loadProjectorModel(){
      const loader = new THREE.OBJLoader();
      return new Promise((resolve, reject) => {
        loader.load(projectorModelPath, (projectorModel) => {
            this.projectorModel = projectorModel;
            resolve();
        });
      });
    }
      
    start() {
      if (!this.frameId) {
        this.frameId = requestAnimationFrame(this.animate)
      }
    }
  
    stop() {
      cancelAnimationFrame(this.frameId)
    }
  
    animate() {
      this.controls.update();
      this.renderScene()
      this.frameId = window.requestAnimationFrame(this.animate)
    }
  
    renderScene() {
      this.renderer.render(this.scene, this.camera)
    }

    onRotateProjectorLeftClick(e){
      this.projectorPhi += PROJECTOR_STEP_ANGLE;
      this.updateProjectorFromSphericalCoords();
      this.syncProjectorModelWithActualProjector();
    }

    onRotateProjectorRightClick(e){
      this.projectorPhi -= PROJECTOR_STEP_ANGLE;
      this.updateProjectorFromSphericalCoords();
      this.syncProjectorModelWithActualProjector();
    }

    onRotateProjectorUpClick(e){
      if (this.projectorTheta + PROJECTOR_STEP_ANGLE < PROJECTOR_MAX_VERICAL_ANGLE)
        this.projectorTheta += PROJECTOR_STEP_ANGLE;
      this.updateProjectorFromSphericalCoords();
      this.syncProjectorModelWithActualProjector();
    }

    onRotateProjectorDownClick(e){
      if (this.projectorTheta - PROJECTOR_STEP_ANGLE > PROJECTOR_MIN_VERTICAL_ANGLE)
        this.projectorTheta -= PROJECTOR_STEP_ANGLE;
      this.updateProjectorFromSphericalCoords();
      this.syncProjectorModelWithActualProjector();
    }

    onIncreaseProjectionSize(e){
      if (this.projectedImageScale + PROJECTOR_SCALE_STEP < PROJECTOR_MAX_SCALE)
        this.projectedImageScale += PROJECTOR_SCALE_STEP;
      this.shaderMaterial.uniforms.projectedImageScale.value = this.projectedImageScale;
    }

    onDecreaseProjectionSize(e){
      if (this.projectedImageScale - PROJECTOR_SCALE_STEP > PROJECTOR_MIN_SCALE)
        this.projectedImageScale -= PROJECTOR_SCALE_STEP;
      this.shaderMaterial.uniforms.projectedImageScale.value = this.projectedImageScale;
    }

    onResize(){
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize( window.innerWidth - 5, window.innerHeight - 5 );
    }
}
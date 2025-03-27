import {
  Animation,
  ArcRotateCamera,
  DefaultRenderingPipeline,
  Engine,
  FresnelParameters,
  HemisphericLight,
  LoadAssetContainerAsync,
  MeshBuilder,
  PBRMaterial,
  ReflectionProbe,
  RefractionTexture,
  RenderTargetTexture,
  Scene,
  Tools,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";

import { Ground } from "./ground";

export default class MainScene {
  private camera: ArcRotateCamera;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine) {
    this._setCamera(scene);
    this._setLight(scene);
    this.loadComponents();
  }

  _setCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera("camera", Tools.ToRadians(90), Tools.ToRadians(80), 20, Vector3.Zero(), scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.setTarget(Vector3.Zero());
  }

  _setLight(scene: Scene): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
  }

  _setPipeLine(): void {
    const pipeline = new DefaultRenderingPipeline("default-pipeline", false, this.scene, [this.scene.activeCamera!]);
  }

  async loadComponents(): Promise<void> {
    // Load your files in order
    // new Ground(this.scene);

    const res = await LoadAssetContainerAsync("model/room.glb", this.scene);
    res.addAllToScene();
    res.meshes[0].getChildMeshes().forEach((m) => {
      m.checkCollisions = true;
    });
    this._setFPSCamera();
    //
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 32 }, this.scene);
    sphere.position.y = 2;
    const spMat = new PBRMaterial("spMat", this.scene);
    spMat.realTimeFiltering = true;
    spMat.alpha = 0.5;

    sphere.material = spMat;
    //
    const probe = new ReflectionProbe("satelliteProbe", 512, this.scene);
    // probe.refreshRate = 3;
    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.attachToMesh(sphere);
    res.meshes[0].getChildMeshes().forEach((m) => {
      probe!.renderList!.push(m);
      console.log(m.name);
      //  (m.material as PBRMaterial).reflectionTexture = probe.cubeTexture;
    });
    spMat.reflectionTexture = probe.cubeTexture;
    spMat.refractionTexture = new RefractionTexture("water", 1024, this.scene, true);
    // (spMat.refractionTexture as RefractionTexture).renderList = [sphere];
    (spMat.refractionTexture as RefractionTexture).depth = 0;

    Animation.CreateAndStartAnimation("a1", sphere, "position.z", 60, 360, 0, -4, Animation.ANIMATIONLOOPMODE_CONSTANT);
    //
    var IoR = 0.1;
    var theta = 0;
    this.scene.registerBeforeRender(function () {
      //  (spMat.refractionTexture as RefractionTexture).depth = Math.abs(Math.sin(theta)*100); = IoR + Math.abs(Math.cos(theta) * 1.5);
      //console.log(waterMaterial.indexOfRefraction);
      theta += 0.015;
      sphere.rotation.y += 0.01;
    });
    //
  }
  //
  _setFPSCamera() {
    let camera;
    if (!this.scene.getCameraByName("FirstViewCamera")) {
      camera = new UniversalCamera("FirstViewCamera", new Vector3(-4, 2, 0), this.scene);
      camera.setTarget(Vector3.Zero());
    } else {
      camera = this.scene.getCameraByName("FirstViewCamera");
    }

    //   this._fpsCameraActive = true;

    // this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("workshop_pipeline", camera);

    camera.ellipsoid = new Vector3(0.75, 1, 0.75);
    camera.speed = 0.2;

    this.scene.collisionsEnabled = true;
    this.scene.gravity.y = -0.08;

    camera.checkCollisions = true;
    camera.applyGravity = true;
    //  //Controls  WASD
    camera.keysUp.push(87);
    camera.keysDown.push(83);
    camera.keysRight.push(68);
    camera.keysLeft.push(65);
    camera.keysUpward.push(32);
    camera.minZ = 0.1;

    const canvas = this.scene.getEngine().getRenderingCanvas();
    //  this.scene.activeCamera?.detachControl();
    // this.engine.enterPointerlock();
    camera.attachControl(canvas, true);
    this.scene.activeCamera = camera;

    //  this.scene.getMeshByName("ground")!.checkCollisions = true;
  }
  //
}

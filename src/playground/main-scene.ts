import {
  ArcRotateCamera,
  DefaultRenderingPipeline,
  Engine,
  HemisphericLight,
  LoadAssetContainerAsync,
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
    this._prepareFPSCamera();
    this._setFPSCamera();
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

  _prepareFPSCamera() {
    const camera = new UniversalCamera("FirstViewCamera", new Vector3(-4, 2, 0), this.scene);
    camera.setTarget(Vector3.Zero());
  }

  _setFPSCamera() {
    let camera;
    if (!this.scene.getCameraByName("FirstViewCamera")) {
      camera = new UniversalCamera("FirstViewCamera", new Vector3(-4, 2, 0), this.scene);
      camera.setTarget(Vector3.Zero());
    } else {
      camera = this.scene.getCameraByName("FirstViewCamera");
    }

    // this._fpsCameraActive = true;

    this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("workshop_pipeline", camera);

    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.speed = 0.8;
    camera.position.y = 3;

    this.scene.collisionsEnabled = true;
    this.scene.gravity.y = -0.08;

    camera.checkCollisions = true;
    camera.applyGravity = false;
    //Controls  WASD
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

    this.scene.meshes.forEach((m) => {
      m.checkCollisions = true;
    });
  }

  async loadComponents(): Promise<void> {
    // Load your files in order
    new Ground(this.scene);

    const res = LoadAssetContainerAsync("model/Xbot.glb", this.scene);
    (await res).addAllToScene();
  }
}

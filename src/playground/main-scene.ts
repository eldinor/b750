import {
  ArcRotateCamera,
  AssetContainer,
  DefaultRenderingPipeline,
  Engine,
  FramingBehavior,
  HemisphericLight,
  LoadAssetContainerAsync,
  Scene,
  Tools,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";

import { Ground } from "./ground";

export default class MainScene {
  private camera: ArcRotateCamera;
  private screenshotCamera: ArcRotateCamera;
  private assetArray: any;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine) {
    this.assetArray = [];
    this._setCamera(scene);
    this._setLight(scene);
    this.loadComponents();
  }

  _setCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera("camera", Tools.ToRadians(90), Tools.ToRadians(80), 20, Vector3.Zero(), scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.setTarget(Vector3.Zero());
    this.screenshotCamera = this.camera.clone("screenshotCamera") as ArcRotateCamera;
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
    console.log(this.scene);

    this.canvas.ondragover = (event) => {
      event.preventDefault();
    };

    this.canvas.addEventListener("drop", async (event) => {
      event.preventDefault();
      console.log(event);
      console.log(event.dataTransfer?.files);
      const file = event.dataTransfer?.files[0];
      console.log(file);

      const res = await LoadAssetContainerAsync(file!, this.scene);
      let tmpArr = [];

      res.addAllToScene();

      this.scene.activeCamera = this.screenshotCamera;

      this.screenshotCamera.useFramingBehavior = true;

      const framingBehavior = this.screenshotCamera.getBehaviorByName("Framing") as FramingBehavior;
      framingBehavior.framingTime = 0;
      framingBehavior.elevationReturnTime = -1;

      this.scene.meshes.forEach((m) => {
        m.setEnabled(false);
      });

      res.meshes.forEach((m) => {
        m.setEnabled(true);
      });

      if (this.scene.meshes.length) {
        this.screenshotCamera.lowerRadiusLimit = null;

        const worldExtends = this.scene.getWorldExtends(function (mesh) {
          return mesh.isVisible && mesh.isEnabled();
        });
        framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
      }
      this.screenshotCamera.pinchPrecision = 200 / this.camera.radius;
      this.screenshotCamera.upperRadiusLimit = 5 * this.camera.radius;

      this.screenshotCamera.wheelDeltaPercentage = 0.01;
      this.screenshotCamera.pinchDeltaPercentage = 0.01;
      this.screenshotCamera.lowerRadiusLimit = 1;
      //
      const screenShot = await Tools.CreateScreenshotUsingRenderTargetAsync(this.engine, this.screenshotCamera, 400);
      //   console.log(screenShot);

      const imageList = document.getElementById("imagelist");
      const el = document.createElement("li");
      (imageList as HTMLUListElement).append(el);
      const img = document.createElement("img");
      el.append(img);
      img.src = screenShot;
      img.style.width = "98px";
      //
      res.meshes[0].setEnabled(false);
      this.assetArray.push(res);
      el.id = (this.assetArray.length - 1).toString();
      console.log(this.assetArray);

      this.scene.activeCamera = this.camera;

      el.onclick = (event) => {
        // console.log(event);
        let ind = parseInt(el.id);
        console.log(this.assetArray[ind]);
        const container = this.assetArray[ind] as AssetContainer;
        const copied = container.instantiateModelsToScene(undefined, undefined, { doNotInstantiate: false });
        copied.rootNodes[0].setEnabled(true);
        console.log(copied.rootNodes);
        el.style.border = "2px solid red";
        setTimeout(() => {
          el.style.border = "0px";
        }, 1000);
      };

      //
    });
  }
}

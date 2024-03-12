import { render } from "react-dom";
import * as THREE from "three";
import { Vector2 } from "three";
import { Engine } from "./Engine";
const imageUrl = new URL("eso_dark.jpg", import.meta.url);
console.log(imageUrl)

const TEX_SIZE = 2048

export enum ViewEventType {
    MOVE_START,
    MOVE,
    MOVE_STOP,
    ZOOM,
    ADD_COMMENT
}

export class Panoview {
    threeInstance
    // horizontal/vertical view position
    currentViewPos = new Vector2()
    lastViewPos = new Vector2()
    viewTexture

    constructor(threeInstance: Engine) {
        console.log("[Panoview] new instance")

        this.threeInstance = threeInstance
        threeInstance.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            1100,
        );

        threeInstance.scene = new THREE.Scene();
        threeInstance.update = this.onUpdate;
    }

    init() {
        const { scene, camera, container } = this.threeInstance
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-1, 1, 1);
        const texture = new THREE.TextureLoader().load(imageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            // wireframe: true,
        });
        this.viewTexture = texture
        const mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);

        camera.position.z = 5;

    }

    onViewEvt = (view, evt) => {
        const viewMove = new Vector2(view.x, view.y)
        this.currentViewPos = viewMove.multiplyScalar(0.1).add(this.lastViewPos)

        switch (evt) {
            case ViewEventType.MOVE_STOP:
                this.lastViewPos = this.currentViewPos
                this.patchTexture()
                break;
            case ViewEventType.ZOOM:
                const { camera } = this.threeInstance
                const fov = camera.fov + view.zoom * 0.05;
                camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
                camera.updateProjectionMatrix();
                break;
            case ViewEventType.ADD_COMMENT:
                break;
        }
    }

    patchTexture = () => {
        const { renderer, scene, camera, container } = this.threeInstance

        const viewX = (this.lastViewPos.x % 360)   // varying from 0 to 360
        const viewY = (this.lastViewPos.y)   // varying from -90 to 90

        // map view pos to texture coords
        // 0 to 360 -> 0 to 1024 
        // -90 to 90 -> 0 to 1024
        const texX = viewX * 2 * TEX_SIZE / 360
        const texY = (viewY + 90) * TEX_SIZE / 180

        console.log(`texX:${texX}, texY:${texY}`)

        const width = 32;
        const height = 32;
        const texData = new Uint8Array(width * height * 4);
        // const dataTexture = new THREE.DataTexture(texData, width, height);
        // const cloneTexture = this.viewTexture.clone()
        const rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });

        // render scene to texture
        renderer.setRenderTarget(rtTexture);
        renderer.clear();
        renderer.render(scene, camera);
        // restore
        renderer.setRenderTarget(null);
        // var gl = webglRenderer.context;
        // gl.readPixels(texX, texY, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.viewTexture);
        // console.log(pixels); // Uint8Array
        // const size = dataTexture.image.width * dataTexture.image.height;
        // const data = dataTexture.image.data;
        // // generate a random color and update texture data
        // const color = new THREE.Color();
        // color.setHex(Math.random() * 0xffffff);

        // const r = Math.floor(color.r * 255);
        // const g = Math.floor(color.g * 255);
        // const b = Math.floor(color.b * 255);

        // for (let i = 0; i < size; i++) {

        //     const stride = i * 4;

        //     data[stride] = r;
        //     data[stride + 1] = g;
        //     data[stride + 2] = b;
        //     data[stride + 3] = 1;

        // }
        // copy render target area to texture
        renderer.readRenderTargetPixels(rtTexture, viewX, viewY, width, height, texData);
        const dataTexture = new THREE.DataTexture(texData, width, height);
        // patch view texture with it
        const position = new Vector2(texX, texY)
        renderer.copyTextureToTexture(position, dataTexture, this.viewTexture);

        const dpr = window.devicePixelRatio;
        const texSize = 128 * dpr;
        const fbx = (window.innerWidth * dpr / 2) - (texSize / 2);
        const fby = (window.innerHeight * dpr / 2) - (texSize / 2);

        const fbTex = new THREE.FramebufferTexture(texSize, texSize);
        renderer.copyFramebufferToTexture(new Vector2(fbx, fby), fbTex);
        renderer.clearDepth();
        // renderer.copyTextureToTexture(position, fbTex, this.viewTexture);

        const canvasTex = new THREE.CanvasTexture(container);
        renderer.copyTextureToTexture(position, canvasTex, this.viewTexture);


        // const position = new Vector2(texX, texY)
        // const dpr = window.devicePixelRatio;
        // const textureSize = 128 * dpr;
        // const texture = new THREE.FramebufferTexture(textureSize, textureSize);
        // console.log(position)
        // renderer.copyFramebufferToTexture(position, texture);
        // renderer.copyTextureToTexture(position, this.viewTexture, dataTexture);
        // renderer.copyTextureToTexture(position, dataTexture, this.viewTexture);
    }

    // make it arrow func so that context is kept when called externally
    onUpdate = () => {
        const { camera } = this.threeInstance
        const { x: horizontal, y: vertical } = this.currentViewPos
        const lat = Math.max(-85, Math.min(85, horizontal));
        const phi = THREE.MathUtils.degToRad(90 - vertical);
        const theta = THREE.MathUtils.degToRad(horizontal);

        const x = 500 * Math.sin(phi) * Math.cos(theta);
        const y = 500 * Math.cos(phi);
        const z = 500 * Math.sin(phi) * Math.sin(theta);

        camera.lookAt(x, y, z);
        //   camera.lookAt(0, 0, 0);
    }
}

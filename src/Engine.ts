import * as THREE from "three"
export class Engine {
    container
    renderer
    camera
    scene
    update
    constructor() {
        console.log("[Engine] new instance")
    }
    init(container) {
        this.container = container
        this.renderer = new THREE.WebGLRenderer({ canvas: container });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xeeeeee, 1);
        window.addEventListener("resize", this.onWindowResize);
    }

    render = () => {
        requestAnimationFrame(this.render);
        this.update?.();
        this.renderer.render(this.scene, this.camera);
    };

    onWindowResize = () => {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}
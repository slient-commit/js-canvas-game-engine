class SampleScene extends Scene {

    constructor(engine) {
        super('sampleScene', engine);
        this.light = new Lighting(this.engine, 10, 10, 50);
    }

    OnCreate() {
        this.light.addLightSpot(new LightSpot(new Position(50, 10), new RGB(255, 255, 255), 3, 50), false);
        this.light.addLightSpot(new LightSpot(new Position(100, 10), new RGB(255, 255, 255), 3, 20), false);
        this.light.addLightSpot(new LightSpot(new Position(50, 20), new RGB(255, 255, 255), 2, 20), false);
        this.light.addLightSpot(new LightSpot(new Position(50, 40), new RGB(255, 255, 255), 2, 20), false);
        this.fire = new Fire(this.engine, new Position(145, 150), 2, 7);
        return true;
    }

    OnUpdate(elapsedTime) {
        this.fire.generate();
        this.engine.drawer.clearWithColor('skyblue');
        this.engine.drawer.rectangle(new Position(100, 100), new Size(300, 300), true, 1, 'green');
        // if (this.engine.mouseClicked(MouseButton.LEFT)) {
        //     this.light.addLightSpot(new LightSpot(this.engine.mousePosition(), new RGB(255, 255, 255), 2));
        // }
        this.light.draw();
        // this.fire.draw(elapsedTime);
        // this.engine.drawer.lightSpot(new LightSpot(new Position(150, 150), new RGB(255, 255, 255), 3, this.getRandomArbitrary(5, 20)));
        // this.engine.drawer.lightSpot(new LightSpot(this.engine.mousePosition(), new RGB(255, 255, 255), 3, 15));
    }
    getRandomArbitrary(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
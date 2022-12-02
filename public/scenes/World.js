class WorldMap extends Phaser.Scene{
    constructor(){
        super("WorldMap")
    }

    preload() {
        this.load.image("TileImage","../assets/piratesheet.png")
        this.load.tilemapTiledJSON("TileJSON","../assets/MainMap.json")

        this.load.image("ship","../assets/ship.png")
        this.load.image("playership","../assets/mainship.png")
    };
    
    create() {
        this.Map = this.make.tilemap({key:"TileJSON",tileWidth:128,tileHeight:128})
        this.Tileset = this.Map.addTilesetImage("PirateTiles","TileImage")

        this.SeaLayer = this.Map.createDynamicLayer ("Sea",this.Tileset,0,0)
        this.TerrainLayer = this.Map.createDynamicLayer ("Terrain",this.Tileset)
        this.AssetLayer = this.Map.createDynamicLayer ("Assets",this.Tileset)

        this.ship = this.physics.add.sprite(25*128,10*128,"playership")
        this.ship.setCollideWorldBounds(true)
        //this.ship.body.setDrag(10,10)
        this.ship.body.setAngularDrag(50)

        //shrink bouding box to 1/2 so smoother

        const camera = this.cameras.main
        camera.setBounds(0, 0, 50*128, 50*128);
        camera.startFollow(this.ship);

        this.physics.world.setBounds(0, 0, 50*128, 50*128);

        this.TerrainLayer.setCollisionByExclusion([-1])
        this.physics.add.collider(this.ship,this.TerrainLayer)

        this.ForwardKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.BrakeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        this.RotateKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.AntiRotateKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        this.socket = io()

        this.OtherUsers = []

        this.socket.emit("NewUser","sussy",this.ship.body.position,this.ship.angle)

        this.socket.on("ServerList",(sessions)=>{
            sessions.forEach(element => {
                let NewShip = this.physics.add.sprite(element.position.x+33,element.position.y+57,"ship")
                NewShip.angle = element.angle
                NewShip.setCollideWorldBounds(true)
                NewShip.body.setAngularDrag(50)
                this.physics.add.collider(NewShip,this.TerrainLayer)
                this.OtherUsers.push({sprite:NewShip,id:element.session,speed:0})
            });
        })
        this.socket.on("ServerNewUser",(user,session)=>{
            console.log(`${session} has a username of ${user}`)
            let NewShip = this.physics.add.sprite(25*128,10*128,"ship")
            NewShip.setCollideWorldBounds(true)
            NewShip.body.setAngularDrag(50)
            this.physics.add.collider(NewShip,this.TerrainLayer)
            this.OtherUsers.push({sprite:NewShip,id:session,speed:0})
        })
        this.socket.on("ServerSetSpeed",(speed,session)=>{
            const target = this.OtherUsers.find(e=>e.id=session)
            target.speed = speed
        })
        this.socket.on("ServerSetAngle",(angle,session)=>{
            const target = this.OtherUsers.find(e=>e.id=session)
            target.sprite.body.angularVelocity = angle
        })
        this.socket.on("ServerDelete",(session)=>{
            console.log(session)
            console.log(this.OtherUsers)
            const target = this.OtherUsers.findIndex(e=>e.id==session)
            this.OtherUsers[target].sprite.destroy()
            console.log(target)
            this.OtherUsers.splice(target,1)
            console.log(this.OtherUsers)
        })

        this.TerrainLayer.renderDebug(this.add.graphics(),{tileColor: null,collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),faceColor: new Phaser.Display.Color(40, 39, 37, 255)})
    };
    
    update() {
        if (this.ForwardKey.isDown && this.ship.body.speed<=299) {
            this.ship.body.speed = this.ship.body.speed + 1
            this.socket.emit("SetSpeed",this.ship.body.speed,this.ship.body.position)
        } else if (this.BrakeKey.isDown) {
               if(this.ship.body.speed>1){
                this.ship.body.speed = this.ship.body.speed -1
                this.socket.emit("SetSpeed",this.ship.body.speed,this.ship.body.position,this.ship.angle)
               } else {
                this.ship.body.speed = 0
                this.socket.emit("SetSpeed",this.ship.body.speed,this.ship.body.position,this.ship.angle)
               }
        } else {
            if(this.ship.body.speed>0.5){
                this.ship.body.speed = this.ship.body.speed -0.5
                this.socket.emit("SetSpeed",this.ship.body.speed,this.ship.body.position,this.ship.angle)
            }
        }
        if (this.RotateKey.isDown) {
            this.ship.body.setAngularVelocity(-45)
            this.socket.emit("SetAngle",this.ship.body.angularVelocity,this.ship.body.position,this.ship.angle)
        } else if(this.AntiRotateKey.isDown){
            this.ship.body.setAngularVelocity(45)
            this.socket.emit("SetAngle",this.ship.body.angularVelocity,this.ship.body.position,this.ship.angle)
        }
        this.physics.velocityFromAngle(this.ship.angle+90,this.ship.body.speed,this.ship.body.velocity)

        this.OtherUsers.forEach(element => {
            try{
                this.physics.velocityFromAngle(element.sprite.angle+90,element.speed,element.sprite.body.velocity) 
            } catch {
                console.log(this.OtherUsers)
                console.log("Failed to find user")
            }
        });
    }
}

export default WorldMap
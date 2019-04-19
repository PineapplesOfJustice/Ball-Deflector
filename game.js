var ballGroup, missileGroup, explosionGroup;
var deflector;
var canvas;

var ballSpeed = 7;
var ballLimit = 10;

var missileSpeed = 20;
var missileKnockBack = 15;

var deflectorSpeed = 12;

var live = 15;
var startingLive = 15;
var score = 0;
var gravity = 0.5;

var startScreen = true;
var restartScreen = false;
var gameOverScreen = false;
var gameActivity = false;
var instructionDisplay = true;

var netArray = 16;
var fontSrc = {};


// Game Setup

function preload() {
    fontSrc["chakraPetch"] = loadFont("ChakraPetch-Medium.ttf");
}

function setup() {
    canvas = createCanvas(1200, 640);
    canvas.id('canvas');
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    canvas.position(x, y);

    ballGroup = new Group();
    missileGroup = new Group();
    explosionGroup = new Group();

    deflector = createSprite(140, height / 2);
    //deflector.scale = 0.5
    deflector.frameDelay = 8;
    deflector.restitution = 1;
    deflector.immovable = true;
    deflector.mass = 10;
    //deflector.debug = true;
    deflector.width = 54;
    deflector.height = 192;
    deflector.setCollider("rectangle", 4, 0, 20, deflector.height)
    //console.log(deflector)

    deflector.addAnimation('idle', "dIdle/frame1.png");
    deflector.addAnimation('motion', "dMotion/frame1.png");
    deflector.addAnimation('collisionString', "dCollisionString/frame1.png", "dCollisionString/frame2.png", "dCollisionString/frame3.png", "dCollisionString/frame4.png", "dCollisionString/frame5.png", "dCollisionString/frame6.png");
    deflector.addAnimation('death', "dDeath/frame1.png", "dDeath/frame1.png", "dDeath/frame2.png", "dDeath/frame2.png", "dDeath/frame3.png", "dDeath/frame3.png", "dDeath/frame4.png", "dDeath/frame4.png", "dDeath/frame5.png", "dDeath/frame5.png", "dDeath/frame6.png", "dDeath/frame6.png", "dDeath/frame7.png", "dDeath/frame7.png", "dDeath/frame8.png");
    deflector.changeAnimation("idle");

    console.log("WASD Keys = Motion \nF Key = Fullscreen\nR Key = Restart \nI Key = Instruction Toggle");
}


// Main Loop

function draw() {
    background(0, 107, 0);

    stroke("white");
    strokeWeight(1);

    line(0, height / 8, width, height / 8);
    line(0, height * 7 / 8, width, height * 7 / 8);
    line(0, height / 2, width / 40, height / 2);
    line(width * 9 / 39, height / 2, width * 30 / 39, height / 2);
    line(width * 39 / 40, height / 2, width, height / 2);
    line(width * 9 / 39, height / 8, width * 9 / 39, height * 7 / 8);
    line(width * 30 / 39, height / 8, width * 30 / 39, height * 7 / 8);
    var offsetY = height / netArray;
    var deduction = height * 0.25 / (netArray - 1);
    for (var i = 0; i < netArray; i++) {
        line(width / 2, offsetY * i + deduction, width / 2, offsetY * (i + 1) - deduction);
    }
    
    if(instructionDisplay){
        drawGameInstruction();
    }

    if (!restartScreen) {
        updatePlayerInput();
        limitDeflectorMotion();
    }
    if (deflector.getAnimationLabel() == "idle" || deflector.getAnimationLabel() == "motion") {
        fill("red");
    }
    stroke("black");
    strokeWeight(1);
    rect(deflector.position.x + 6, deflector.position.y - 15, 15, 30);



    if (deflector.getAnimationLabel() == "collisionString" && deflector.animation.getFrame() == deflector.animation.getLastFrame()) {
        deflector.changeAnimation("idle");
    }
    else if (deflector.getAnimationLabel() == "death" && deflector.animation.getFrame() == deflector.animation.getLastFrame()) {
        deflector.changeAnimation("idle");
        if (live > 0) {
            live -= 1;
        }
    }

    ballGroup.bounce(ballGroup);
    ballGroup.bounce(missileGroup);
    missileGroup.displace(ballGroup);

    for (var i = 0, length = ballGroup.length; i < length; i++) {
        var current = ballGroup[i];
        if (current.wallBounce) {
            wallBounceBall(current);
            noStroke();
            fill(255, 50)
            circle(current.position.x + current.collider.offset.x, current.position.y + current.collider.offset.y, current.collider.radius);
        }
        current.bounce(deflector, function() {
            if (collideCircleCircle(deflector.position.x + 13, deflector.position.y, deflector.height * 3 / 7, current.position.x + current.collider.offset.x, current.position.y + current.collider.offset.y, current.collider.radius)) {
                if (deflector.getAnimationLabel() == "idle" || deflector.getAnimationLabel() == "motion") {
                    deflector.changeAnimation("collisionString");
                    deflector.animation.changeFrame(0)
                }
                if (current.wallBounce && live > 0) {
                    score += 3;
                }
            } 
            else if (current.wallBounce && live > 0) {
                score += 1;
            }
            current.wallBounce = false;
            if (deflector.velocity.x > 0 && current.velocity.x < 0) {
                current.velocity.x *= -1;
                current.position.x = deflector.position.x + deflector.width / 2;
            }
        });

        current.rotation = current.getDirection();
        if (!collideRectCircle(0, 0, width * 2, height, current.position.x + current.collider.offset.x, current.position.y + current.collider.offset.y, current.collider.radius)) {
            if (current.position.x < 0 && current.wallBounce && live > 0) {
                live -= 1;
            }
            current.remove();
            i -= 1;
            length -= 1;
        }
    }

    for (var i = 0, length = missileGroup.length; i < length; i++) {
        var collision = false;
        var current = missileGroup[i];
        current.bounce(deflector, function() {
            if (deflector.getAnimationLabel() != "death") {
                deflector.changeAnimation("death");
                deflector.animation.changeFrame(0);
            }
            addExplosion(deflector.position.x, current.position.y);
            collision = true;
            deflector.velocity.x -= missileKnockBack;
        });
        if (collision || !collideRectRect(0, 0, width * 2, height, current.position.x - current.width / 2, current.position.y - current.height / 2, current.width, current.height)) {
            current.remove();
            i -= 1;
            length -= 1;
        }
        else if (!collideRectRect(0, 0, width, height, current.position.x - current.width / 2, current.position.y - current.height / 2, current.width, current.height) && current.velocity.x < 0) {
            fill("yellow");
            stroke("black");
            strokeWeight(2);
            triangle(width-55, current.position.y-30, width-85, current.position.y+30, width-25, current.position.y+30);
            fill("red");
            textSize(40);
            textAlign(CENTER, CENTER);
            textFont(fontSrc["chakraPetch"]);
            text("!", width-55, current.position.y);
        }
    }

    for (var i = 0, length = explosionGroup.length; i < length; i++) {
        var current = explosionGroup[i];
        if (current.animation.getFrame() == current.animation.getLastFrame()) {
            current.remove();
            i -= 1;
            length -= 1;
        }
    }

    drawSprites(ballGroup);
    drawSprites(missileGroup);
    drawSprite(deflector);
    drawSprites(explosionGroup);

    for (var i = 0, length = ballGroup.length; i < length; i++) {
        var current = ballGroup[i];
        if (!current.wallBounce) {
            noStroke();
            fill(0, 70)
            circle(current.position.x + current.collider.offset.x, current.position.y + current.collider.offset.y, current.collider.radius);
        }
    }

    textSize(32);
    fill("white");
    stroke("black");
    strokeWeight(3);
    textAlign(LEFT, TOP);
    textFont(fontSrc["chakraPetch"]);
    text("Life: " + live, 20, 20);
    text("Score: " + score, 20, 95);

    if (gameOverScreen) {
        noStroke();
        fill(0, 0, 0, 75 + sin(frameCount * 0.05) * 25);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        textSize(64);
        stroke("black");
        strokeWeight(5);
        fill("white");
        text("Game Over", width / 2, height * 3 / 7 - 10);
        if (sin(frameCount * 0.05) > -0.64) {
            textSize(25);
            strokeWeight(3);
            text("Press R to restart", width / 2, height * 4 / 7 - 10);
        }
    }
    if (restartScreen) {
        deflector.velocity.y += gravity;
        for (var i = 0, length = ballGroup.length; i < length; i++) {
            var current = ballGroup[i];
            current.velocity.y += gravity;
        }
        for (var i = 0, length = missileGroup.length; i < length; i++) {
            var current = missileGroup[i];
            current.velocity.y += gravity;
        }
        if (allSprites.length == 1 && (deflector.position.y - deflector.height / 2) > height * 3) {
            restartGame();
        }
    }
    if (startScreen) {
        textAlign(CENTER, CENTER);
        textSize(64);
        stroke("black");
        strokeWeight(5);
        fill("white");
        text("Ball Deflector", width / 2, height * 3 / 7 - 10);
        if (sin(frameCount * 0.05) > -0.64) {
            textSize(25);
            strokeWeight(3);
            text("Press any key to start", width / 2, height * 4 / 7 - 10);
        }
        textSize(20);
        stroke(0, 150);
        strokeWeight(15);
        fill("white");
        textAlign(CENTER, BOTTOM);
        text("A reimagination of an uphill battle in tennis.", width/2, height*7/8 - 20);
        //text("A reimagination of an uphill battle in tennis.", width * 31 / 39, height / 4, width * 7 / 39, height / 2);
    }

    if (live <= 0 && !restartScreen) {
        gameActivity = false;
        gameOverScreen = true;
        deflector.velocity.y = 0;
    }

    if (frameCount % 70 == 0 && gameActivity) {
        addBall();
        /*if(ballGroup.length > ballLimit){
          ballGroup.shift();
        }*/
    }
    if (frameCount % 200 == 0 && gameActivity) {
        addMissile();
        if (score > 50) {
            addMissile();
        }
        if (score > 100) {
            addMissile();
        }
        if (score > 150) {
            addMissile();
        }
    }
}


// Support Function

function wallBounceBall(object) {
    if (object.position.x + object.width / 3 >= width) {
        object.position.x = width - object.width / 3;
        object.velocity.x *= -1;
    }
    /*else if(object.position.x-object.width/3 <= 0){
    object.position.x = object.width/3;
    object.velocity.x *= -1;
    }*/
    else if (object.position.y + object.height / 3 >= height) {
        object.position.y = height - object.height / 3;
        object.velocity.y *= -1;
    } 
    else if (object.position.y - object.height / 3 <= 0) {
        object.position.y = object.height / 3;
        object.velocity.y *= -1;
    }
}

function limitDeflectorMotion() {
    deflector.width = 54;
    deflector.height = 192;
    if (deflector.position.y + deflector.height / 2 > height) {
        deflector.position.y = height - deflector.height / 2;
        deflector.velocity.y = 0;
    } 
    else if (deflector.position.y - deflector.height / 2 < 0) {
        deflector.position.y = deflector.height / 2;
        deflector.velocity.y = 0;
    }
    if (deflector.position.x + deflector.width / 2 + 15 > width / 2) {
        deflector.position.x = width / 2 - deflector.width / 2 - 15;
        deflector.velocity.x = 0;
    } 
    else if (deflector.position.x - deflector.width / 2 < 0) {
        deflector.position.x = deflector.width / 2;
        deflector.velocity.x = 0;
    }
}

function restartGame() {
    live = startingLive;
    score = 0;
    deflector.position.x = 140;
    deflector.position.y = height / 2;
    deflector.velocity.x = 0;
    deflector.velocity.y = 0;
    restartScreen = false;
    gameOverScreen = false;
    startScreen = false;
    gameActivity = true;
    frameCount = 1;
}

function drawGameInstruction() {
    // Player 1
    drawKey("W", 87, width*69/78, height/4);
    drawKey("A", 65, width*69/78 - 50, height*5/16);
    drawKey("S", 83, width*69/78, height*5/16);
    drawKey("D", 68, width*69/78 + 50, height*5/16);

    drawKey("F", 70, width*32/39, height*5/8);
    drawKey("R", 82, width*32/39, height*11/16);
    drawKey("I", 73, width*32/39, height*3/4);
  
    fill("white")
    stroke("black");
    textFont(fontSrc["chakraPetch"]);
    textSize(23);
    textAlign(CENTER, BOTTOM);
    text("Move", width*23/26, height*7/16);
    
    textSize(23);
    textAlign(LEFT, CENTER);
    text("Fullscreen", width*67/78, height*5/8);
    text("Restart", width*67/78, height*11/16);
    text("Instruction", width*67/78, height*3/4);
}

function drawKey(letter, code, x, y) {
    fill("black");
    if (keyIsDown(code)) {
        fill("white");
    }
    stroke("black");
    strokeWeight(3);
    rect(x - 20, y - 13, 40, 30, 7, 0);

    fill("white");
    if (keyIsDown(code)) {
        fill("black");
    }
    noStroke();
    textFont(fontSrc["chakraPetch"]);
    textSize(25);
    textAlign(CENTER, CENTER);
    text(letter, x, y);
}


// "Constructor" Function

function addBall() {
    var theta = (Math.random() * 140) + 110;
    var ball = createSprite(width + 50, Math.random() * height);
    //ball.scale = 0.5
    ball.frameDelay = 8;
    ball.setSpeed(ballSpeed, theta);
    ball.restitution = 1.01;
    ball.mass = 1;
    ball.limitSpeed(30);
    ball.rotation = theta;
    ball.wallBounce = true;
    //ball.debug = true;
    ball.setCollider("circle", 0, 0, ball.width / 3)

    ball.addAnimation('normal', "ball/frame1.png", "ball/frame2.png", "ball/frame3.png", "ball/frame4.png", "ball/frame5.png", "ball/frame6.png");
    ballGroup.add(ball);
}

function addMissile() {
    var theta = 180;
    var missile = createSprite(width*5/3, Math.random() * height);
    //missile.scale = 0.5
    missile.frameDelay = 4;
    missile.setSpeed(missileSpeed, theta);
    missile.restitution = 1;
    missile.mass = 10;
    missile.rotation = theta;
    missile.wallBounce = true;
    //missile.debug = true;

    missile.addAnimation('normal', "missile/frame1.png", "missile/frame2.png", "missile/frame3.png", "missile/frame4.png");
    missileGroup.add(missile);
}

function addExplosion(x, y) {
    var explosion = createSprite(x, y);
    //explosion.scale = 0.5
    explosion.frameDelay = 8;

    explosion.addAnimation('normal', "explosion/frame1.png", "explosion/frame2.png", "explosion/frame3.png", "explosion/frame4.png", "explosion/frame5.png", "explosion/frame6.png", "explosion/frame7.png", "explosion/frame8.png", "explosion/frame9.png");
    explosionGroup.add(explosion);
}


// Player Input

function updatePlayerInput() {
    var currentAnimation = deflector.getAnimationLabel();
    if (gameActivity) {
        //Key W || Up Arrow
        if (keyIsDown(87) || keyIsDown(38)) {
            deflector.velocity.y = -deflectorSpeed;
            deflector.velocity.x = 0;
            if (currentAnimation == "idle" || currentAnimation == "motion") {
                deflector.changeAnimation("motion");
                deflector.mirrorY(1);
            }
        }
        //Key S || Down Arrow
        else if (keyIsDown(83) || keyIsDown(40)) {
            deflector.velocity.y = deflectorSpeed;
            deflector.velocity.x = 0;
            if (currentAnimation == "idle" || currentAnimation == "motion") {
                deflector.changeAnimation("motion");
                deflector.mirrorY(-1);
            }
        }
        //Key A || Left Arrow
        else if (keyIsDown(65) || keyIsDown(37)) {
            deflector.velocity.x = -deflectorSpeed;
            deflector.velocity.y = 0;
        }
        //Key D || Right Arrow
        else if (keyIsDown(68) || keyIsDown(39)) {
            deflector.velocity.x = deflectorSpeed;
            deflector.velocity.y = 0;
        } 
        else {
            var speed = deflector.getSpeed()-2;
            if(speed < 0){
                speed = 0;
            }
            deflector.setSpeed(speed, deflector.getDirection());
            if (currentAnimation == "idle" || currentAnimation == "motion") {
                deflector.changeAnimation("idle");
            }
        }
    }
}

function keyPressed() {
    /*if(keyCode == 32){
    console.log(allSprites);
    }*/
    // F Key
    if (keyCode == 70) {
        fullscreen(!fullscreen());
    } 
    // I Key
    else if (keyCode == 73) {
        instructionDisplay = !instructionDisplay;
    } 
    else if (startScreen) {
        startScreen = false;
        gameActivity = true;
        frameCount = 1;
    }
    // R Key
    else if (keyCode == 82) {
        restartScreen = true;
        gameActivity = false;
        for (var i = 0, length = ballGroup.length; i < length; i++) {
            var current = ballGroup[i];
            current.wallBounce = false;
        }
    }
}

function windowResized() {
    var offsetX = 0;
    var offsetY = 0;
    if (windowWidth > width) {
        offsetX = (windowWidth - width) / 2;
    }
    if (windowHeight > height) {
        offsetY = (windowHeight - height) / 2;
    }
    canvas.position(offsetX, offsetY);
}
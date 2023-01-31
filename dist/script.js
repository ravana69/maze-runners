window.addEventListener("resize", resize);
window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
var DEBUG = false;
var canvas;
var width;
var height;
var stats = new Stats();
var gui;
var showFPS = false;
var showControls = true;

var Params = function(){
  this.cellSize = 20;
  this.numRunners = 5;
  this.runnerSize = 1;
  this.runnerSteps = 4;
  this.trailLength = 96;
  this.recreate = reseedGrid;
  this.paused = false;
  this.showMaze = true;
  this.hueBase = 0;
  this.hueRange = 60;
  this.hueChange = 0;
  this.saturation = 80;
  this.balance = 100;
  this.step = step;
}

var MazeRunner = function(x, y, hue){
  this.x = x;
  this.y = y;
  this.hue = hue;
  this.moveX = 0;
  this.moveY = 0;
  this.direction = 0;
  this.movement = 0;
  this.step = function(){
    if (this.x < 0) this.x += gridWidth-1;
    if (this.x == gridWidth) this.x = 0;
    if (this.y < 0) this.y += gridHeight-1;
    if (this.y == gridHeight) this.y = 0;
    
    if (DEBUG) console.log(this.movement);
    if (this.movement == 0){
      updateDirection(this);
    } else {
      this.movement++;
    }
    if (this.direction == 0) this.moveX = -1*(this.movement/params.runnerSteps);
    if (this.direction == 1) this.moveY = -1*(this.movement/params.runnerSteps);
    if (this.direction == 2) this.moveX = this.movement/params.runnerSteps;
    if (this.direction == 3) this.moveY = this.movement/params.runnerSteps;

    if (this.movement >= params.runnerSteps){
      this.movement = 0;

      if (this.direction == 0) this.x--; //left
      if (this.direction == 1) this.y--; //up
      if (this.direction == 2) this.x++; //right
      if (this.direction == 3) this.y++; //down
      this.moveX = 0;
      this.moveY = 0;
    }
  }
}

var params;
var grid;
var mazeRunner;
var runners;
var gridWidth;
var gridHeight;
var stepCount;

function setup(){
  createCanvas();
  colorMode(HSB, 360, 100, 100, 100);
  ellipseMode(CENTER);
  rectMode(CENTER);
  width = 0;
  height = 0;
  grid = [];
  params = new Params();
  resize();
  runners = [];
  createRunners();
  stepCount = 0;
  
  if (showFPS){
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
  }
  
  if (showControls){
    gui = new dat.GUI({});
    gui.remember(params);
    var maze = gui.addFolder("Maze Options");
    var sizeController = maze.add(params, "cellSize", 5, 100);
    maze.add(params, "showMaze")
    
    var runnerOps = gui.addFolder("Runner Options");
    var runController = runnerOps.add(params, "numRunners", 0, 1000, 1);
    runnerOps.add(params, "runnerSize", 0, 1, .01);
    runnerOps.add(params, "runnerSteps", 1, 20, 1);
    runnerOps.add(params, "trailLength", 0, 100);
    
    var colors = gui.addFolder("Color Options");
    colors.add(params, "hueBase", 0, 360, 1);
    colors.add(params, "hueRange", 0, 360, 1);
    colors.add(params, "hueChange", 0, 5, .01);
    colors.add(params, "saturation", 0, 100);
    colors.add(params, "balance", 0, 100);
    
    gui.add(params, "paused");
    gui.add(params, "recreate");
    if (DEBUG) gui.add(params, "step");
    
    sizeController.onChange(function(value){
      createGrid();
    })
    
    runController.onChange(function(value){
      createRunners();
    })
  }
  
  background(0);
}

function createRunners(){
  for (var i = runners.length; i < params.numRunners; i++){
    var x = Math.floor(Math.random()*gridWidth)
    var y = Math.floor(Math.random()*gridHeight);
    var runner = new MazeRunner(x, y, Math.random());
    runners.push(runner);
  }
  for (var i = runners.length; i > params.numRunners; i--){
    runners.pop();
  }
}

function createGrid(){
  background(0);
  gridWidth = Math.floor(width/params.cellSize);
  gridHeight = Math.floor(height/params.cellSize);
  
  if (runners != undefined){
    for (var i = 0; i < runners.length; i++){
      var runner = runners[i];
      if (runner.x >= gridWidth) runner.x = gridWidth-1;
      if (runner.y >= gridHeight) runner.y = gridHeight-1;
    }
  }
  
  
  for (var i = grid.length; i > gridWidth; i--){
    grid.pop();
  }
  
  for (var i = 0; i < grid.length; i++){
    for (var j = grid[0].length; j > gridHeight; j--){
      grid[i].pop();
    }
  }
  
  for (var i = grid.length; i < gridWidth; i++){
    grid.push([]);
    
  }
  
  for (var i = 0; i < gridWidth; i++){
    for (var j = grid[i].length; j < gridHeight; j++){
      if (i == 0) grid[i].push(0);
      else if (j == 0) grid[i].push(1);
      else if (i == gridWidth-1) grid[i].push(0);
      else if (j == gridHeight-1) grid[i].push(1);
      else grid[i].push(Math.floor(Math.random()*2));
    }
  }
}

function reseedGrid(){
  background(0);
  for (var i = 0; i < gridWidth; i++){
    for (var j = 0; j < gridHeight; j++){
      if (i == 0) grid[i][j] = 0;
      else if (j == 0) grid[i][j] = 1;
      else if (i == gridWidth-1) grid[i][j] = 0;
      else if (j == gridHeight-1) grid[i][j] = 1;
      else grid[i][j] = (Math.floor(Math.random()*2));
    }
  }
}

function draw(){
  if (stats != undefined) stats.begin();
  if (!params.paused){
    step();
  }
  
  if (stats != undefined) stats.end();
}

function step(){
  stepCount++;
  if (grid != undefined && runners != undefined){ 
    background(0, (100 - params.trailLength));
    renderGrid();
    params.hueBase += params.hueChange;
    if (params.hueBase > 360) params.hueBase -= 360;
  }
}

function renderGrid(){
  noStroke();
  var size = params.cellSize*params.runnerSize;
  for (var i = 0; i < params.numRunners; i++){
    var runner = runners[i];
    var hue = runner.hue*params.hueRange - params.hueRange/2 + params.hueBase;
    if (hue < 0) hue += 360;
    if (hue > 360) hue -= 360;
    fill(hue, params.saturation, params.balance);
    x = (runner.x + runner.moveX + .5)*params.cellSize;
    y = (runner.y + runner.moveY + .5)*params.cellSize;
    rect(x, y, size, size);
    if (x < 0) rect(x + gridWidth*params.cellSize, y, size, size);
    if (y < 0) rect(x, y + gridHeight*params.cellSize, size, size);
    if ((x + params.cellSize/2) > gridWidth*params.cellSize){
      rect(x - gridWidth*params.cellSize, y, size, size);
    }
    if ((y + params.cellSize/2) > gridHeight*params.cellSize){
      rect(x, y - gridHeight*params.cellSize, size, size);
    }
    runner.step();
  }
  
  stroke(255)
  strokeWeight(.01*params.cellSize);
  if (params.showMaze){
    var x, y;
    for (var i = 0; i < gridWidth; i++){
      for (var j = 0; j < gridHeight; j++){
        x = i*params.cellSize;
        y = j*params.cellSize;
        if (grid[i][j] == 0) line(x, y, x, y+ params.cellSize);
        else line(x, y, x + params.cellSize, y);
      }
    }
  }
}

function updateDirection(runner){
  if (DEBUG) console.log("updating runner direction");
  var foundDirection = false;
  var x = runner.x;
  var y = runner.y;
  
  var dirMod = [1, 0, -1, 2];
  var dir = runner.direction;
  
  for (var i = 0; i < 4; i++){
    // console.log(i);
    if (isOpen(runner.x, runner.y, (dir+dirMod[i])%4)){
      runner.direction = (dir+dirMod[i])%4;
      runner.movement++;
      return;
    }
  }
}

function isOpen(x, y, dir){
  if (dir == 0){
    if (DEBUG) console.log("checking left");
    return (grid[x][y] == 1);
  }
  else if (dir == 1){
    if (DEBUG) console.log("checking up");
    return (grid[x][y] == 0);
  }
  else if (dir == 2){
    if (DEBUG) console.log("checking right");
    x++;
    if (x == gridWidth) x = 0;
    return (grid[x][y] == 1);
  }
  else if (dir == 3){
    if (DEBUG) console.log("checking down");
    y++;
    if (y == gridHeight) y = 0;
    return (grid[x][y] == 0);
  }
}

function resize(){
  width = window.innerWidth;
  height = window.innerHeight;
  resizeCanvas(width, height);
  createGrid();
}
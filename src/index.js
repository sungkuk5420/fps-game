var p5 = require('p5');
class Vec2 {
  /**
   * @param {number} x 백터의x성분
   * @param {number} y 백터의y성분
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  /**
   * @param {Vec2} b 부족한 백터
   */
  add(b) {
    let a = this;
    return new Vec2(a.x+b.x, a.y+b.y);
  }
  /**
   * @param {Vec2} b 빼고 싶은백터
   */
  sub(b) {
    let a = this;
    return new Vec2(a.x-b.x, a.y-b.y);
  }
  /**
   * 이 백터의 복사를 반환
   */
  copy() {
    return new Vec2(this.x, this.y);
  }
  /**
   * 이 백터의 실수 s배를 구함。
   * @param {number} s 몇배로 할지
   */
  mult(s) {
    return new Vec2(s*this.x, s*this.y);
  }
  /**
   * 이 백터의 크기를 구함
   */
  mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}


class Ray2 {
  /**
   * @param{Vec2}pos 이 레이의 시작점의 위치 벡터.
   * @param{Vec2} way 이 레이의 시작점으로부터 늘어나는 방향 벡터.
   */
  constructor(pos, way) {
    this.pos = pos;
    this.way = way;
  }
  /**
   * 위치 벡터와 방향 벡터가 아니라 시작점과 끝점에서 레이를 만든다.
   * ※staticについて: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes/static
   * @param {Vec2} begin 
   * @param {Vec2} end 
   */
  static with2p(begin, end) {
    return new Ray2(begin, end.sub(begin));
  }
  /**
   * 이 레이의 첫점을 구함
   * ※get을 붙이면 계산할때 r.begin() 이 아닌 r.begin로 쓸수 있으므로 더 나음.
   */
  get begin() {
    return this.pos;
  }
  /**
   * 이 레이의 마지막점을 구함
   */
  get end() {
    return this.pos.add(this.way);
  }
  /**
   * このレイと、r2の交点을 구함。
   * @param {Ray2} r2
   */
  intersection(r2) {
    let r1 = this;
    // Y축 병행의 선분은 이 코드로는 취급할 수 없으므로 병행의 경우는 미묘하게 늦추게 한다.
    if (Math.abs(r1.way.x) < 0.01) r1.way.x = 0.01;
    if (Math.abs(r2.way.x) < 0.01) r2.way.x = 0.01;

    // r1,r2를 직선으로 보고 그 교점을 구하다.
    let t1 = r1.way.y / r1.way.x;
    let t2 = r2.way.y / r2.way.x;
    let x1 = r1.pos.x;
    let x2 = r2.pos.x;
    let y1 = r1.pos.y;
    let y2 = r2.pos.y;
    let sx = (t1*x1 - t2*x2 - y1 + y2) / (t1 - t2);
    let sy = t1 * (sx - x1) + y1;

    // 교점이 선분상에 없을 때는 null을 반환한다
    if (
      sx > Math.min(r1.begin.x, r1.end.x)
      && sx < Math.max(r1.begin.x, r1.end.x)
      && sx > Math.min(r2.begin.x, r2.end.x)
      && sx < Math.max(r2.begin.x, r2.end.x)
    ){
      return new Vec2(sx, sy);
    }else{
      return null;
    }
  }
}


class Player {
  constructor() {
    this.pos = new Vec2(0, 0);
    this.angle = 0;
  }
}

class Level {
  constructor() {
    this.walls = [];
    this.tilemap = '';
    this.tileSize = 35;
    this.mapWidth = 0;
    this.mapHeight = 0;
  }
  tileAt(x, y) {
    return this.tilemap[this.mapWidth*y + x];
  }
  addWorldEdges() {
    let s = this.tileSize;
    let w = this.mapWidth;
    let h = this.mapHeight;
    this.walls.push(new Ray2(new Vec2(0,0), new Vec2(s*w, 0)));
    this.walls.push(new Ray2(new Vec2(0,0), new Vec2(0, s*h)));
    this.walls.push(new Ray2(new Vec2(s*w,s*h), new Vec2(-s*w, 0)));
    this.walls.push(new Ray2(new Vec2(s*w,s*h), new Vec2(0, -s*h)));
  }
  /**
   * @param {string} tilemap 
   * @param {number} width 
   * @param {number} height 
   * @param {number} size 
   */
  addTilemap({tilemap, width, height, size}) {
    this.tilemap = tilemap;
    this.mapWidth = width;
    this.mapHeight = height;
    this.tileSize = size;
    let s = size;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let tile = this.tileAt(x, y);
        if (tile === 'O' || tile === 'X') {
          this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(s, 0)));
          this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(0, s)));
          if (this.tileAt(x, y + 1) === '.') {
            this.walls.push(new Ray2(new Vec2(s * x, s * y + s), new Vec2(s, 0)));
          }
          if (this.tileAt(x + 1, y) === '.') {
            this.walls.push(new Ray2(new Vec2(s * x + s, s * y), new Vec2(0, s)));
          }
          if (tile === 'X') {
            this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(s, s)));
            this.walls.push(new Ray2(new Vec2(s * x + s, s * y), new Vec2(-s, s)));
          }
        }
      }
    }
  }
}

class Game {
  constructor() {
    this.player = new Player();
    this.level = new Level();
  }
  reset(p) {
    this.player.pos = new Vec2(118, 201);
    this.player.angle = -p.PI/2;
  }
}

// グローバル変数 Global variables
let game;

/** @type {Player} */
let player;

const windowWidth  = document.body.clientWidth-40;
const windowHeight  = windowWidth/16*9;

const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const MAP_SIZE = document.body.clientWidth/120;

const s = (p) => {
  p.setup = () => {
   //화면의 비율은 일반적인 스마트폰 사이즈나 PC랑 같은 16:9비율로 함.

   
   p.createCanvas(windowWidth, windowHeight);
  
   game = new Game();
   game.reset(p);
 
   game.level.addTilemap({
    tilemap:(
      "..O.............O...OO....O...........O."+
      ".OO....O......O.....O..................."+
      ".................O.OO.....O............."+
      "...O...................OO........O..O..."+
      "...OO.............O....................."+
      ".O....O.....O..........................."+
      "....O............O.....O..O............."+
      "......O......O..O..............O..O....O"+
      "..O...O......O........O............O..OO"+
      "....O...O...OO..................O...O..."+
      "...........O.........O....O.O.........O."+
      ".............................O...O....O."+
      "O........OO.O..........................O"+
      "...O.....O.......O..................O..."+
      "..........O........O.O......O........O.."+
      "....OO....O.O..............O............"+
      "..O.......................OO............"+
      "O..O...................................O"+
      "...O.OO.....O.......................O..."+
      "...O...................................."+
      "....O...........................O....O.."+
      "...................O.O..O.......O......."+
      "...........................O...........O"+
      ".O.....O...............O.O.............."+
      ".................O..O..................."+
      "..........O............................."+
      "OO............O........................."+
      "...O......O....O................O......."+
      "O...........O...............O..........."+
      "..........O.........O..OO.......O......."+
      "................................OO....OO"+
      "......O.........O.......O.............O."+
      ".....O......O........O...........O......"+
      ".......O................O......O.O......"+
      ".................O........OO..O.O.....O."+
      "...O...................................."+
      "..............O.O......................."+
      "...O..........O...O....................."+
      "......................OO.......O...O...."
     ),
     width:MAP_WIDTH,
     height:MAP_HEIGHT,
     size:MAP_SIZE
    });
   game.level.addWorldEdges();
  };

  p.draw = () => {
    p.noSmooth();
    // 배경이 밝으면 노란색이나 녹색의 표현이 어려우므로 어둡게함.
    // 배경
    p.background(60);

    // 벽을 그린다 
    p.strokeWeight(4);
    p.stroke(224);
    let walls = game.level.walls;
    for(let wall of walls) {
      p.line(wall.begin.x, wall.begin.y, wall.end.x, wall.end.y);
    }



    // プレイヤーを描画. Draw the player
    p.stroke(224, 224, 0);
    p.strokeWeight(24);
    player = game.player;
    p.point(player.pos.x, player.pos.y);

    // プレイヤーを描画
    p.stroke('yellow');
    p.strokeWeight(20);
    p.point(player.pos.x, player.pos.y);

    // キー入力
    // ※ a-=b は、a=a-b と同じ。同様に、a+=b は、a=a+b と同じ。
    if (p.keyIsDown(p.LEFT_ARROW)) player.angle -= p.PI / 60;
    if (p.keyIsDown(p.RIGHT_ARROW)) player.angle += p.PI / 60;
    if (p.keyIsDown(p.UP_ARROW)) {
      player.pos.x += new Vec2(p.cos(player.angle), p.sin(player.angle)).mult(360).x/360
      player.pos.y += new Vec2(p.cos(player.angle), p.sin(player.angle)).mult(360).y/360
    };
    if (p.keyIsDown(p.DOWN_ARROW)){
      player.pos.x -= new Vec2(p.cos(player.angle), p.sin(player.angle)).mult(360).x/360
      player.pos.y -= new Vec2(p.cos(player.angle), p.sin(player.angle)).mult(360).y/360
    }

   // 3Dビューを描画. Draw the 3d view.
  {
//     MAP_WIDTH
// MAP_HEIGHT
// MAP_SIZE
console.log(MAP_WIDTH*MAP_SIZE)
    let viewRect = new Ray2(new Vec2(MAP_WIDTH*MAP_SIZE+20, 0), new Vec2(windowWidth-(MAP_WIDTH*MAP_SIZE+20),MAP_HEIGHT*MAP_SIZE));

    let fov = p.PI / 2;
    let centerAngle = player.angle;
    let leftAngle = centerAngle - fov/2;
    let rightAngle = centerAngle + fov/2;
    let beamTotal = 32;
    let beamIndex = -1;
    for(let angle=leftAngle; angle<rightAngle-0.01; angle+=fov/beamTotal) {
      beamIndex++;
      let beam = new Ray2(
        player.pos.copy(),
        new Vec2(p.cos(angle), p.sin(angle)).mult(120)
      );
      p.stroke('yellow');
      p.strokeWeight(1);
      p.line(beam.begin.x, beam.begin.y, beam.end.x, beam.end.y);

      // 光線が2枚以上の壁にあたっていたら、一番近いものを採用する。
      // Adapt the nearest beam.
      let allHitBeamWays = walls.map(wall => beam.intersection(wall))
        .filter(pos => pos !== null)
        .map(pos => pos.sub(beam.begin));
      if (allHitBeamWays.length === 0) continue;
      let hitBeam = allHitBeamWays.reduce((a, b) => a.mag() < b.mag() ? a : b);

      p.stroke('yellow');
      p.strokeWeight(8);
      let hitPos = hitBeam.add(beam.begin);
      p.point(hitPos.x, hitPos.y);

      let wallDist = hitBeam.mag();
      let wallPerpDist = wallDist * p.cos(angle - centerAngle);
      let lineHeight = p.constrain(2800 / wallPerpDist, 0, viewRect.way.y);
      let lineBegin = viewRect.begin.add(
        new Vec2(
          viewRect.way.x/beamTotal*beamIndex,
          viewRect.way.y/2-lineHeight/2
        )
      );
      let lightness = 224;
      p.strokeWeight(0);
      p.fill(lightness);
      p.rect(lineBegin.x, lineBegin.y, 7, lineHeight);
    }

    // 3Dビューの枠を描画. Draw border lines of the 3d view.
    p.noFill();
    p.stroke('cyan');
    p.strokeWeight(4);
    p.rect(viewRect.pos.x, viewRect.pos.y, viewRect.way.x, viewRect.way.y);
  }
  };

  p.touchMoved  = (event) =>{
    player.pos.x = event.clientX;
    player.pos.y = event.clientY;
  };
}

const myp5 = new p5(s);

//===============================================
// dotgame.js v1.0.0 - 12/12/19
// Technical Assesment For Konica Minolta
// Author: Tom Gilligan
// gilligan.tom@gmail.com
// View This Project On Code Pen:
// https://codepen.io/Tom-Gilligan/pen/MWYjRqx 
// View This Project On Git Hub: 
//===============================================
// INITIALIZE
let startNode = {};
let endNode = {};
let gameState = '';
let vStarts = []; // Valid Starting Nodes
let uNodes = []; // Used Nodes
let uLines = []; // Used Lines
let lineToCheck = [];
var firstTurn;
const req = 'REQUEST: ';
const res = 'RESPONSE: ';
let currentPlayer = {
  heading: "Player 1"
};
//RESPONSES
const init = {
  msg: 'INITALIZE',
  body: {
    newLine: null,
    heading: 'Player 1',
    message: "Awaiting Player 1's Move"
  }
};
const invalidStart = {
  msg: "INVALID_START_NODE",
  body: {
    newLine: null,
    heading: currentPlayer.heading,
    message: "Not a valid starting position! Try Again."
  }
};
const validStart = {
  msg: "VALID_START_NODE",
  body: {
    newLine: null,
    heading: currentPlayer.heading,
    message: "Select a second node to complete the line."
  }
};
const invalidEnd = {
  msg: "INVALID_END_NODE",
  body: {
    newLine: null,
    heading: currentPlayer.heading,
    message: "Invalid Move! Try Again."
  }
};
const validEnd = {
  msg: "VALID_END_NODE",
  body: {
    newLine: {
      start: startNode,
      end: endNode,
    },
    heading: currentPlayer.heading,
    message: "Select a node to start a line"
  }
};
const gameOver = {
  msg: "GAME_OVER",
  body: {
    newLine: {
      start: startNode,
      end: endNode
    },
    heading: "Game Over",
    message: currentPlayer.heading + " Wins!"
  }
};
//LOG CLIENT REQUESTS
const logRequest = (r, m) => {
  console.log(r, m);
};
// SEND MESSAGE TO CLIENT
const sendMessage = (m) => {
  app.ports.response.send(m);
  console.log(res, m);
};
// GAME LOOP
app.ports.request.subscribe((message) => {
  message = JSON.parse(message);
  logRequest(req, message);
  // CLIENT SENDS INIT REQUEST AT PAGE LOAD.
  if (message.msg === 'INITIALIZE') {
    sendMessage(init);
    firstTurn = true;
    gameState = 'firstMoveStart';
  } else if ((message.msg === 'NODE_CLICKED') && (gameState === 'firstMoveStart')) {
    startNode = message.body;
    validStart.body.heading = currentPlayer.heading;
    invalidStart.body.heading = currentPlayer.heading;
    if (firstTurn) {
      sendMessage(validStart);
      gameState = 'secondClick';
    } else {
      if (getNodeIndex(startNode, vStarts) != 'NOT IN ARRAY') {
        sendMessage(validStart);
        gameState = 'secondClick'
      } else {
        sendMessage(invalidStart);
        return;
      }
    }
  } else if ((message.msg === 'NODE_CLICKED') && (gameState === 'secondClick')) {
    endNode = message.body;
    if (lineIsValid(startNode, endNode)) {
      changePlayer(currentPlayer);
      let newLineA = [startNode.x, startNode.y, endNode.x, endNode.y];
      uLines.push(newLineA); // SAVE LINE
      validEnd.body.heading = currentPlayer.heading;
      validEnd.body.newLine.start = startNode;
      validEnd.body.newLine.end = endNode;
      if (firstTurn) {
        vStarts = [startNode, endNode];
        firstTurn = false;
        gameState = "firstMoveStart";
        pushLinePoints(startNode.x, startNode.y, endNode.x, endNode.y, uNodes);
        sendMessage(validEnd);
        return;
      } else if (!firstTurn) {
        vStarts.push(endNode);
        // Remove StartNode from Vstarts
        vStarts.splice(getNodeIndex(startNode, vStarts), 1);
        pushLinePoints(startNode.x, startNode.y, endNode.x, endNode.y, uNodes);
        //CHECK IF LINE WILL END THE GAME
        if (gameIsOver(vStarts)) {
          gameOver.body.newLine.start = startNode;
          gameOver.body.newLine.end = endNode;
          gameOver.body.message = currentPlayer.heading + " Wins!";
          sendMessage(gameOver);
        } else {
          // VALID END NODE
          sendMessage(validEnd);
          gameState = "firstMoveStart";
          return;
        };
      }
    } else {
      //INVALID END NODE
      invalidEnd.body.heading = currentPlayer.heading;
      sendMessage(invalidEnd);
      gameState = "firstMoveStart";
    }
  }
});
//
// FUNCTIONS
//
// CHANGE CURRENT PLAYER
const changePlayer = (player) => {
  if (player.heading === "Player 1") {
    player.heading = "Player 2";
  } else {
    player.heading = "Player 1";
  };
}
// CHECK IF GAME IS OVER
function gameIsOver(vStarts) {
  return ((checkAroundN(vStarts[1].x, vStarts[1].y) == false) && 
          (checkAroundN(vStarts[0].x, vStarts[0].y) == false));
}
// CHECK IF LINE IS VALID
function lineIsValid(s, e) {
  return (!pointsEqual(s, e)) && 
    (getNodeIndex(e, uNodes) === 'NOT IN ARRAY') && 
    (lineDegree(s.x, s.y, e.x, e.y)) && 
    (!chkIntersections(s.x, s.y, e.x, e.y)) && 
    (checkMiddlePoints(s.x, s.y, e.x, e.y))
}
// RETURNS A NODES INDEX IF IN ARRAY, RETURNS STRING IF NOT
const getNodeIndex = (p, arr) => {
  for (var i = 0; i < arr.length; i++) {
    if (pointsEqual(arr[i], p) === true) {
      return i;
    }
  }
  return 'NOT IN ARRAY';
}
// COMPARES TWO POINTS
const pointsEqual = (o1, o2) => {
  if (Object.keys(o1).every(p => o1[p] === o2[p])) {
    return true;
  } else {
    return false;
  }
}
// CHECK FOR VALID LINE DEGREE
function lineDegree(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  var lDegree = theta;
  if ((lDegree === 45) || (lDegree === -45) || 
      (lDegree === 0) || (lDegree === 180) || 
      (lDegree === 90) || (lDegree === -90) || 
      (lDegree === 135) || (lDegree === -135)) {
    return true;
  }
  return false;
}
//GET POINTS OF LINE AND PUSH INTO ARRAY
const pushLinePoints = (x1, y1, x2, y2, array) => {
  let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
  // line deltas
  dx = x2 - x1;
  dy = y2 - y1;
  // positive copy of deltas
  dx1 = Math.abs(dx);
  dy1 = Math.abs(dy);
  // Calculate error intervals for both axis
  px = 2 * dy1 - dx1;
  py = 2 * dx1 - dy1;
  // The line is X-axis dominant
  if (dy1 <= dx1) {
    // Line is drawn left to right
    if (dx >= 0) {
      x = x1;
      y = y1;
      xe = x2;
    } else { // Line is drawn right to left
      x = x2;
      y = y2;
      xe = x1;
    }
    let stPoint = {
      'x': x,
      'y': y
    };
    //PUSH POINT
    array.push(stPoint);
    // Rasterize the line
    for (i = 0; x < xe; i++) {
      x = x + 1;
      // Deal with octants
      if (px < 0) {
        px = px + 2 * dy1;
      } else {
        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
          y = y + 1;
        } else {
          y = y - 1;
        }
        px = px + 2 * (dy1 - dx1);
      }
      // PUSH POINT 
      array.push({
        'x': x,
        'y': y
      });
    }
  } else { // The line is Y-axis dominant
    // Line is drawn bottom to top
    if (dy >= 0) {
      x = x1;
      y = y1;
      ye = y2;
    } else { // Line is drawn top to bottom
      x = x2;
      y = y2;
      ye = y1;
    }
    array.push({
      'x': x,
      'y': y
    });
    // Rasterize the line
    for (i = 0; y < ye; i++) {
      y = y + 1;
      // Deal with octants
      if (py <= 0) {
        py = py + 2 * dx1;
      } else {
        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
          x = x + 1;
        } else {
          x = x - 1;
        }
        py = py + 2 * (dx1 - dy1);
      }
      array.push({
        'x': x,
        'y': y
      });
    }
  }
}
// CHECK IF POINTS OF LINE ARE VALID
function checkMiddlePoints(x1, y1, x2, y2) {
  pushLinePoints(x1, y1, x2, y2, lineToCheck);
  // REMOVE startNode
  lineToCheck.splice(getNodeIndex(startNode, lineToCheck), 1);
  for (var i = 0; i < lineToCheck.length; i++) {
    if (typeof getNodeIndex(lineToCheck[i], uNodes) === 'number') {
      //A NODE IS USED RETURN FALSE
      lineToCheck = [];
      return false;
    }
  }
  lineToCheck = [];
  return true;
}
// CHECK SURROUNDING NODES FOR AN OPEN NODE THAT WONT INTERSECT
const checkAroundN = (x, y) => {
  if ((checkN(x + 1, y)) && (!chkIntersections(x, y, x + 1, y))) {
    return true;
  } else if ((checkN(x + 1, y - 1)) && (!chkIntersections(x, y, x + 1, y - 1))) {
    return true;
  } else if ((checkN(x + 1, y + 1)) && (!chkIntersections(x, y, x + 1, y + 1))) {
    return true;
  } else if ((checkN(x, y - 1)) && (!chkIntersections(x, y, x, y - 1))) {
    return true;
  } else if ((checkN(x, y + 1)) && (!chkIntersections(x, y, x, y + 1))) {
    return true;
  } else if ((checkN(x - 1, y)) && (!chkIntersections(x, y, x - 1, y))) {
    return true;
  } else if ((checkN(x - 1, y - 1)) && (!chkIntersections(x, y, x - 1, y - 1))) {
    return true;
  } else if ((checkN(x - 1, y + 1)) && (!chkIntersections(x, y, x - 1, y + 1))) {
    return true;
  } else {
    return false;
  }
}
//CHECK A SINGLE NODE IF IN BOUNDS OF THE GRID AND NOT USED
const checkN = (x, y) => {
  if (x >= 0 && x <= 3 && y >= 0 && y <= 3) {
    for (let i = 0; i < uNodes.length; i++) {
      if (uNodes[i].x === x && uNodes[i].y === y) {
        return false;
      }
    }
    return true;
  }
  return false;
}
// CHECK IF LINE WILL INTERSECT WITH ANY CURRENT LINES
function chkIntersections(sx, sy, ex, ey) {
  for (let v = 0; v < uLines.length; v++) {
    if (intersects(sx, sy, ex, ey, uLines[v][0], uLines[v][1], uLines[v][2], uLines[v][3])) {
      return true;
    }
  }
  return false;
}
// DETERMINE IF TWO LINES INTERSECT
function intersects(a, b, c, d, p, q, r, s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}

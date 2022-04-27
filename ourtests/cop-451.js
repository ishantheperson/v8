/** Queue contains a linked list of Subqueue */
class Subqueue {
  constructor() {
    this.index = 0;
    this.array = [];
    this.next = null;
  }
  full() {
    return this.array.length >= 1000;
  }
  get size() {
    return this.array.length - this.index;
  }
  peek() {
    return this.array[this.index];
  }
  last() {
    return this.array[this.array.length - 1];
  }
  dequeue() {
    return this.array[this.index++];
  }
  enqueue(elem) {
    this.array.push(elem);
  }
}
class Queue {
  constructor() {
    this.top = new Subqueue();
    this.bottom = this.top;
    this._size = 0;
  }
  get length() {
    return this._size;
  }
  push(...elems) {
    for (let elem of elems) {
      if (this.bottom.full()) {
        this.bottom = this.bottom.next = new Subqueue();
      }
      this.bottom.enqueue(elem);
    }
    this._size += elems.length;
  }
  shift() {
    if (this._size === 0) {
      return undefined;
    }
    const val = this.top.dequeue();
    this._size--;
    if (this._size > 0 && this.top.size === 0 && this.top.full()) {
      // Discard current subqueue and point top to the one after
      this.top = this.top.next;
    }
    return val;
  }
  peek() {
    return this.top.peek();
  }
  last() {
    return this.bottom.last();
  }
  clear() {
    this.bottom = this.top = new Subqueue();
    this._size = 0;
  }
}

class BiGraph {
  #graph;

  constructor(n) {
    this.#graph = Array(n).fill(0).map(_ => new Set());
  }

  addEdge(i, j) {
    this.#graph[i].add(j);
    this.#graph[j].add(i);
  }

  neighbors(i) {
    return this.#graph[i].values();
  }

  bfs(init, dist, action) {
    let working = new Queue();
    let tempDists = Array(n).fill(-1);
    for (let initNode of init) {
      tempDists[initNode] = 0;
      working.push(initNode);
    }

    while (working.length > 0) {
      let curr = working.peek();
      if (tempDists[curr] > dist) break;
      action(curr);
      working.shift();

      for (let neighbor of graph.neighbors(curr)) {
        if (tempDists[neighbor] >= 0) continue;
        tempDists[neighbor] = tempDists[curr] + 1;
        working.push(neighbor);
      }
    }

    let frontier = [];
    while (working.length > 0) {
      frontier.push(working.shift());
    }
    return frontier;
  }
}

class SimplexSolver {
  #matrix;

  constructor() {
    this.#matrix = [];
  }

  get #N() {
    return this.#matrix[0].length - 1;
  }

  get #M() {
    return this.#matrix.length - 1;
  }

  addConstraint(coefficients, limit) {
    console.assert(this.#matrix.length == 0 || this.#N == coefficients.length)
    this.#matrix.push(coefficients.concat([limit]));
  }

  #pivot(r, c) {
    this.#matrix[r][c] = 1 / this.#matrix[r][c];
    for (let j = 0; j <= this.#N; j++) if (j != c) this.#matrix[r][j] *= this.#matrix[r][c];
    for (let i = 0; i <= this.#M; i++) {
      if (i != r) {
        for (let j = 0; j <= this.#N; j++) if (j != c) this.#matrix[i][j] -= this.#matrix[i][c] * this.#matrix[r][j];
        this.#matrix[i][c] = -this.#matrix[i][c] * this.#matrix[r][c];
      }
    }
  }

  solve(objective) {
    console.assert(this.#matrix.length == 0 || this.#N == objective.length)
    this.#matrix.push(objective.concat([0]));

    while (true) {
      let r = 0, c = 0;
      let p = 0.0;
      for (let i = 0; i < this.#N; i++) if (this.#matrix[this.#M][i] > p) p = this.#matrix[this.#M][c = i];
      if (p < 1e-9) break;
      p = 1e100;
      for (let i = 0; i < this.#M; i++) {
        if (this.#matrix[i][c] > 1e-9) {
          let v = this.#matrix[i][this.#N] / this.#matrix[i][c];
          if (v < p) { p = v; r = i; }
        }
      }
      this.#pivot(r, c);
    }

    return -this.#matrix[this.#M][this.#N];
  }
}

let input = arguments.map(numStr => parseInt(numStr));
let [n, m, r, c] = input.slice(0, 4);

// construct graph
let graph = new BiGraph(n);
let edges = input.slice(4, 4 + 2 * m);
for (let i = 0; i < 2 * m; i += 2) {
  graph.addEdge(edges[i], edges[i + 1]);
}

// construct reward matrix by computing escapability for all pairs
// of cop and robber starting nodes
let solver = new SimplexSolver();
for (let copStart = 0; copStart < n; ++copStart) {
  let coefficients = Array(n + 1).fill(-1);
  coefficients[n] = 1;

  let frontier = graph.bfs([copStart], c, x => coefficients[x] = 0);
  graph.bfs(frontier, r, x => coefficients[x] = -1);

  solver.addConstraint(coefficients, 0);
}

// probability distribution constraint
let coefficients = Array(n + 1).fill(1);
coefficients[n] = 0;
solver.addConstraint(coefficients, 1);

// solve for value of game using LP simplex
let objective = Array(n + 1).fill(0);
objective[n] = 1
let solution = solver.solve(objective);

console.log(solution);

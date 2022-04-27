/*
 * Sample input: 
 * 400 15 90 142 116 149 228 167 316 246 297 151 386 228 178 19 251 66 323 230 395 288 202 273 277 350 97 139 174 199 316 335 375 357 283 148 291 192 290 105 335 115 110 0 137 34 88 256 156 304 241 78 316 164 162 285 246 287
 */


// https://stackoverflow.com/a/49902604/303795
class Subqueue<T> {
  public full() {
    return this.array.length >= 8;
  }

  public get size() {
    return this.array.length - this.index;
  }

  public peek(): T {
    return this.array[this.index];
  }

  public last(): T {
    return this.array[this.array.length - 1];
  }

  public dequeue(): T {
    return this.array[this.index++];
  }

  public enqueue(elem: T) {
    this.array.push(elem);
  }

  private index: number = 0;
  private array: T[] = [];

  public next: Subqueue<T> = null;
}

class Queue<T> {
  get length() {
    return this._size;
  }

  public push(...elems: T[]) {
    for (let elem of elems) {
      if (this.bottom.full()) {
        this.bottom = this.bottom.next = new Subqueue<T>();
      }
      this.bottom.enqueue(elem);
    }

    this._size += elems.length;
  }

  public shift(): T {
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

  public peek(): T {
    return this.top.peek();
  }

  public last(): T {
    return this.bottom.last();
  }

  public clear() {
    this.bottom = this.top = new Subqueue();
    this._size = 0;
  }

  private top: Subqueue<T> = new Subqueue();
  private bottom: Subqueue<T> = this.top;
  private _size: number = 0;
}

type Rectangle = [number, number, number, number];

enum VertexType {
  Source,
  Row,
  Rectangle,
  Column,
  Sink
};

type Vertex =
  { type: VertexType.Source }
  | { type: VertexType.Row, row: number }
  | { type: VertexType.Rectangle, rect: number }
  | { type: VertexType.Column, col: number }
  | { type: VertexType.Sink };

type Edge = { to: Vertex, capacity: number };

function binarySearch<T>(elems: T[], pred: (elem: T) => boolean): number {
  let high = elems.length;
  let low = 0;

  while (high > 0) {
    const half = Math.floor(high / 2)
    const mid = low + half;
    console.assert(0 <= mid && mid < elems.length, mid, elems.length);
    if (pred(elems[mid])) {
      high = half;
    } else {
      low = mid + 1;
      high -= half + 1;
    }
  }

  return low;
}

class RookGraph {
  private adjacencyLists: Edge[][]
  private sideLength: number

  constructor(sideLength: number, rectangles: Rectangle[]) {
    this.sideLength = sideLength;
    this.adjacencyLists = Array(2 + 2 * sideLength + rectangles.length).fill(null).map(() => Array());

    for (let i = 0; i < sideLength; ++i) {
      this.addEdge({ type: VertexType.Source }, { type: VertexType.Row, row: i });
      this.addEdge({ type: VertexType.Column, col: i }, { type: VertexType.Sink });
    }

    for (let i = 0; i < rectangles.length; ++i) {
      const [r0, c0, r1, c1] = rectangles[i];
      for (let r = r0; r <= r1; ++r) {
        this.addEdge({ type: VertexType.Row, row: r }, { type: VertexType.Rectangle, rect: i });
      }

      for (let c = c0; c <= c1; ++c) {
        this.addEdge({ type: VertexType.Rectangle, rect: i }, { type: VertexType.Column, col: c });
      }
    }
  }

  vertexIndex(vertex: Vertex): number {
    switch (vertex.type) {
      case VertexType.Source:
        return this.sideLength * 2;
      case VertexType.Row:
        return vertex.row;
      case VertexType.Rectangle:
        return this.sideLength * 2 + 2 + vertex.rect;
      case VertexType.Column:
        return this.sideLength + vertex.col;
      case VertexType.Sink:
        return this.sideLength * 2 + 1;
    }
  }

  addEdge(from: Vertex, to: Vertex) {
    this.adjacencyLists[this.vertexIndex(from)].push({ to, capacity: 1 });
    this.adjacencyLists[this.vertexIndex(to)].push({ to: from, capacity: 0 });
  }

  edgeIndices(from: Vertex, to: Vertex): [number, number] {
    switch (from.type) {
      case VertexType.Source:
        if (to.type === VertexType.Row) {
          return [this.vertexIndex(from), to.row];
        }
        else {
          console.assert(false);
        }

      case VertexType.Sink:
        if (to.type === VertexType.Column) {
          return [this.vertexIndex(from), to.col];
        } else {
          console.assert(false);
        }

      default:
        const uIdx = this.vertexIndex(from);
        const vIdx = this.vertexIndex(to);

        const idx = binarySearch(this.adjacencyLists[uIdx], edge => this.vertexIndex(edge.to) >= vIdx);
        return [uIdx, idx];
    }
  }

  modifyCapacity(from: Vertex, to: Vertex, delta: number) {
    const [uIdx, vIdx] = this.edgeIndices(from, to);
    this.adjacencyLists[uIdx][vIdx].capacity += delta;
  }

  computeVertexLevels(): number[] {
    const levels = Array<number>(this.adjacencyLists.length).fill(-1);
    const queue = new Queue<[Vertex, number]>();
    
    queue.push([{ type: VertexType.Source }, 0]);
    levels[this.vertexIndex({ type: VertexType.Source })] = 0;

    while (queue.length != 0) {
      const [v, i] = queue.shift();
      if (v.type === VertexType.Sink) {
        continue;
      }

      for (const { to: w, capacity: e } of this.adjacencyLists[this.vertexIndex(v)]) {
        if (e <= 0) continue;

        const idx = this.vertexIndex(w);
        if (levels[idx] != -1) continue;

        queue.push([w, i + 1]);
        levels[idx] = i + 1;
      }
    }

    return levels;
  }

  dinitzSearch(from: Vertex, nextNeighbors: Array<IterableIterator<Edge> | null>, levels: number[]): [Vertex[], number] | null {
    if (from.type === VertexType.Sink) {
      return [[from], Number.MAX_SAFE_INTEGER];
    }

    const idx = this.vertexIndex(from);
    const level = levels[idx];

    // Take the iterator out
    const neighbors = nextNeighbors[idx];
    if (neighbors == null) {
      return null;
    }

    nextNeighbors[idx] = null;

    while (true) {
      const { done, value } = neighbors.next();
      if (done) {
        return null;
      }

      const { to: w, capacity } = <Edge>value;

      if (capacity <= 0) continue;
      if (level >= levels[this.vertexIndex(w)]) continue;

      const searchResult = this.dinitzSearch(w, nextNeighbors, levels);
      if (searchResult == null) continue;

      const [path, flow] = searchResult;
      path.push(from);
      nextNeighbors[idx] = neighbors;

      return [path, Math.min(flow, capacity)];
    }
  }

  augmentPath(path: Vertex[], flow: number) {
    for (let i = 1; i < path.length; ++i) {
      const u = path[i - 1];
      const v = path[i];

      this.modifyCapacity(u, v, -flow);
      this.modifyCapacity(v, u, flow);
    }
  }

  dinitzBlockingFlow(): number {
    const levels = this.computeVertexLevels();
    let totalFlow = 0;
    const nextNeighbors = this.adjacencyLists.map((list) => list.values());

    while (true) {
      const searchResult = this.dinitzSearch({ type: VertexType.Source }, nextNeighbors, levels);
      if (searchResult == null) break;
      const [path, flow] = searchResult;

      path.reverse();
      totalFlow += flow;
      this.augmentPath(path, flow);
    }

    return totalFlow;
  }

  dinitzMaxFlow(): number {
    let totalFlow = 0;

    while (true) {
      const flow = this.dinitzBlockingFlow();
      if (flow == 0) return totalFlow;
      totalFlow += flow;
    }
  }
}

function parseInput(input: string): [number, Rectangle[]] {
  const numbers = input.split(' ').map(Number);
  const sideLength = numbers[0];

  // Iterate over 'numbers' in groups of 4
  const rectangles = [];
  for (let i = 2; i < numbers.length; i += 4) {
    rectangles.push([
       numbers[i],
       numbers[i + 1],
       numbers[i + 2],
       numbers[i + 3]
    ]);
  } 

  return [sideLength, rectangles];
}

declare var arguments: string[];
const input = arguments[0]
const [sideLength, rectangles] = parseInput(input);

const start = performance.now();

const graph = new RookGraph(sideLength, rectangles);
const flow = graph.dinitzMaxFlow();

const end = performance.now();

console.log(flow);
console.log(end - start);


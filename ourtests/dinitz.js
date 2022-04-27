// https://stackoverflow.com/a/49902604/303795
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
var VertexType;
(function (VertexType) {
    VertexType[VertexType["Source"] = 0] = "Source";
    VertexType[VertexType["Row"] = 1] = "Row";
    VertexType[VertexType["Rectangle"] = 2] = "Rectangle";
    VertexType[VertexType["Column"] = 3] = "Column";
    VertexType[VertexType["Sink"] = 4] = "Sink";
})(VertexType || (VertexType = {}));
;
function binarySearch(elems, pred) {
    let high = elems.length;
    let low = 0;
    while (high > 0) {
        const half = Math.floor(high / 2);
        const mid = low + half;
        console.assert(0 <= mid && mid < elems.length, mid, elems.length);
        if (pred(elems[mid])) {
            high = half;
        }
        else {
            low = mid + 1;
            high -= half + 1;
        }
    }
    return low;
}
class RookGraph {
    constructor(sideLength, rectangles) {
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
    vertexIndex(vertex) {
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
    addEdge(from, to) {
        this.adjacencyLists[this.vertexIndex(from)].push({ to, capacity: 1 });
        this.adjacencyLists[this.vertexIndex(to)].push({ to: from, capacity: 0 });
    }
    edgeIndices(from, to) {
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
                }
                else {
                    console.assert(false);
                }
            default:
                const uIdx = this.vertexIndex(from);
                const vIdx = this.vertexIndex(to);
                const idx = binarySearch(this.adjacencyLists[uIdx], edge => this.vertexIndex(edge.to) >= vIdx);
                return [uIdx, idx];
        }
    }
    modifyCapacity(from, to, delta) {
        const [uIdx, vIdx] = this.edgeIndices(from, to);
        this.adjacencyLists[uIdx][vIdx].capacity += delta;
    }
    computeVertexLevels() {
        const levels = Array(this.adjacencyLists.length).fill(-1);
        const queue = new Queue();
        queue.push([{ type: VertexType.Source }, 0]);
        levels[this.vertexIndex({ type: VertexType.Source })] = 0;
        while (queue.length != 0) {
            const [v, i] = queue.shift();
            if (v.type === VertexType.Sink) {
                continue;
            }
            for (const { to: w, capacity: e } of this.adjacencyLists[this.vertexIndex(v)]) {
                if (e <= 0)
                    continue;
                const idx = this.vertexIndex(w);
                if (levels[idx] != -1)
                    continue;
                queue.push([w, i + 1]);
                levels[idx] = i + 1;
            }
        }
        return levels;
    }
    dinitzSearch(from, nextNeighbors, levels) {
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
            const { to: w, capacity } = value;
            if (capacity <= 0)
                continue;
            if (level >= levels[this.vertexIndex(w)])
                continue;
            const searchResult = this.dinitzSearch(w, nextNeighbors, levels);
            if (searchResult == null)
                continue;
            const [path, flow] = searchResult;
            path.push(from);
            nextNeighbors[idx] = neighbors;
            return [path, Math.min(flow, capacity)];
        }
    }
    augmentPath(path, flow) {
        for (let i = 1; i < path.length; ++i) {
            const u = path[i - 1];
            const v = path[i];
            this.modifyCapacity(u, v, -flow);
            this.modifyCapacity(v, u, flow);
        }
    }
    dinitzBlockingFlow() {
        const levels = this.computeVertexLevels();
        let totalFlow = 0;
        const nextNeighbors = this.adjacencyLists.map((list) => list.values());
        while (true) {
            const searchResult = this.dinitzSearch({ type: VertexType.Source }, nextNeighbors, levels);
            if (searchResult == null)
                break;
            const [path, flow] = searchResult;
            path.reverse();
            totalFlow += flow;
            this.augmentPath(path, flow);
        }
        return totalFlow;
    }
    dinitzMaxFlow() {
        let totalFlow = 0;
        while (true) {
            const flow = this.dinitzBlockingFlow();
            if (flow == 0)
                return totalFlow;
            totalFlow += flow;
        }
    }
}
function parseInput(input) {
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
const input = arguments[0];
const [sideLength, rectangles] = parseInput(input);
const start = performance.now();
const graph = new RookGraph(sideLength, rectangles);
const flow = graph.dinitzMaxFlow();
const end = performance.now();
console.log(flow);
console.log(end - start);

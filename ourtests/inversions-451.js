class FenwickTree {
  #tree;

  constructor(n) {
    this.#tree = Array(2 * n + 1).fill(0);
  }

  static #offset(j) {
    return j & -j;
  }

  sumLeft(i) {
    let sum = 0;
    for (let j = i; j > 0; j -= FenwickTree.#offset(j))
      sum += this.#tree[j];
    return sum;
  }

  // inclusive
  sumRange(i, j) {
    return this.sumLeft(j) - this.sumLeft(i - 1);
  }

  increment(i, delta) {
    for (let j = i; j <= this.#tree.length; j += FenwickTree.#offset(j))
      this.#tree[j] += delta;
  }
}

let input = arguments.map(numStr => parseInt(numStr));
let m = input.length

let countTree = new FenwickTree(m);
let sumTree = new FenwickTree(m);

let finalCount = 0;
let finalSum = 0;

for (let k of input) {
  finalCount += countTree.sumRange(k, m);
  finalSum = (finalSum + (k * sumTree.sumRange(k, m))) % (1e9 + 7);

  countTree.increment(k, 1);
  sumTree.increment(k, k);
}

console.log(finalCount, finalSum)

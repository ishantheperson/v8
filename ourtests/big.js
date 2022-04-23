/*
function dontInlineMe(x, y) {
    var A = [];
    A.push(x);
    for (let i = 0; i < 10 + ((x / y) / y); i++) {
        A.push(i);
    }

    var sum = 0;
    for (var x of A) {
        sum += x;
    }

    return sum;
}
*/

function dontInlineMe(x, y) {
  // if (x >= y) {
  var i = x + 1;
  var i2 = i * 3;
  var i3 = i2 + i;
  var i4 = i + i2 + i3 + 1;
  var i5 = x * i3;
  var i6 = i4 - y;
  var i7 = i2 / i4;
  var i8 = i6 + i7;
  var i9 = y - 3;
  return i + i2 + i3 + i4 + i5 + i6 + i7 + i8 + i9;
  // } else {
  //     return dontInlineMe(y, x);
  // }
}

function mult(x, y) { return x * y + dontInlineMe(x, y); }
function add(x, y) { return x + mult(y, y); }

let sum = 0;

let start = performance.now();

for (let i = 0; i < 1000; ++i) {
  for (let j = 0; j < 1000; ++j) {
    sum += add(i, j);
  }
}

let end = performance.now();

print(sum);
print(end - start);


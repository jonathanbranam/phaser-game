var x = 1;
function doAdd(x, y) {
    return x + y;
}

function logAdd(x, y) {
    console.log(x + y);
}

var result = doAdd(4, 6);
console.log(result);

logAdd(8, 4);

var doMultiply = function (x, y) {
    return x * y;
};

console.log("do multiply = " + doMultiply(8, 4));

var objectA = {
    x: 10,
    y: 20,
    doSubtract: function (a, b) {
        return a - b;
    },

    getValueOfX: function () {
        return this.x;
    }
};

console.log("objectA.x = " + objectA.x);
objectA.x = 30;
console.log("objectA.x = " + objectA.x);

console.log("do subtract = " + objectA.doSubtract(5, 12));

var objectB = objectA;
objectA = {};
console.log("getValueOfX = " + objectB.getValueOfX());


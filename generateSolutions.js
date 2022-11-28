var data2 = data
var solutions = [];

var answers = new Set();
debugger;
while ( data2.length > 0) {
    var i = Math.floor((Math.random()*data2.length));
    var solution = data2[i];
    solutions.push(solution);
    data2.splice(i, 1);

    answers.add(solution.title + " - They Might Be Giants")
}

JSON.stringify(answers)



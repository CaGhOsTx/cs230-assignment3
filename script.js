const [, ...students] = document.getElementsByTagName("tbody")[0].children

let studentValues = [[],[],[],[],[],[],[],[],[],[]];

const table = {
    range: [
        (x) => x > 92, 
        (x) => x > 89 && x < 93, 
        (x) => x > 86 && x < 90, 
        (x) => x > 82 && x < 87, 
        (x) =>  x > 79 && x < 83, 
        (x) =>  x > 76 && x < 80, 
        (x) =>  x > 72 && x < 77,
        (x) =>  x > 69 && x < 73,
        (x) =>  x > 66 && x < 70,
        (x) =>  x > 62 && x < 67,
        (x) =>  x > 59 && x < 63,
        (x) =>  x < 61
    ],
    letter: ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
    gpa: ["4.0", "3.7", "3.3", "3.0", "2.7", "2.3", "2.0", "1.7", "1.3", "1.0", "0.7", "0.0"]
}
function initKeyboardListeners () { 
    let selected = undefined
    let row, column
    for(let i = 0; i < students.length; i++) {
        for(let j = 0; j < students[i].children.length; j++) {
            if(students[i].children[j].classList.contains("input")) {
                students[i].children[j].onclick = (e) => {
                    selected && selected.classList.toggle("selected")
                    selected = students[i].children[j];
                    selected.classList.toggle("selected")
                    row = i;
                    column = j;
                }
            }
        }
    }      
    window.onkeydown = (e) => {
        let text = selected.innerText
        let key = e.key
        let n = NaN
        if(key == "Backspace")
            selected && (selected.innerText = text.substring(0, text.length - 2) + "%") 
        else if(key.match(/\d/)) {
            n = parseInt(text + key)
            if(text == "-")
                selected && (selected.innerText = key + "%")
            else if(n >= 0 && n <= 100)
                selected && (selected.innerText = text.substring(0, text.length - 1) + key + "%")
        }
        text = selected.innerText
        if (parseInt(text) > 100)
            selected.innerText = "100%"
        if (text.length == 1)
            selected.innerText = "-"  
            console.log(studentValues) 
        studentValues[row][column] = selected.innerText
        console.log(studentValues) 
    }  
}


let currentView = "range"
function changeView(pressed) {
    for(let i = 0; i < students.length; i++) {
        for(let j = 0; j < students[i].children.length; j++) {
            for(let z = 0; z < table["range"].length; z++) {
                if(pressed == "range" && studentValues[i][j])
                    students[i].children[j].innerText = studentValues[i][j]
                else if(table["range"][z](parseInt(studentValues[i][j])))
                    students[i].children[j].innerText = table[pressed][z]
            }
        }
    }      
    currentView = pressed
}

initKeyboardListeners();
Array.from(document.getElementsByTagName("button"))
    .forEach(b => b.onclick = () => changeView(b.id))
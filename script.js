const [header, ...students] = document.getElementsByTagName("tbody")[0].children

let studentValues = []

const gradeType = {
    percent: [
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
    american: ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
    gpa: ["4.0", "3.7", "3.3", "3.0", "2.7", "2.3", "2.0", "1.7", "1.3", "1.0", "0.7", "0.0"]
}

let currentView = "percent"

const changeView = (pressed) => {
    header.lastElementChild.innerHTML = `Final grade<br/>(${pressed})`
    for(let i = 0; i < students.length; i++) {
        for(let j = 0; j < gradeType["percent"].length; j++) {
            let gradeCell = students[i].lastElementChild
            if(pressed == "percent" && studentValues[i])
                gradeCell.innerText = studentValues[i]
            else if(gradeType["percent"][j](parseInt(studentValues[i])))
                gradeCell.innerText = gradeType[pressed][j]
        }
    }    
    currentView = pressed
}

function initGradeTypeIterator () {
    let states = ["percent", "american", "gpa"], i = 0
    header.lastElementChild.onclick = (e) => changeView(states[i = i < states.length - 1 ? i + 1 : 0])
}

function initInputs () { 
    let selected, row

    setGlobalOnKeyPress = () => {
        window.onkeydown = (e) => {
            let text = selected.innerText
            let key = e.key
            if (isBackspace(key))
                removeLastNumber(selected, text)
            else if (isDigitAndCurrentNot0(key, text)) {
                selected.classList.replace("initial", "number")
                let number = parseInt(text + key)
                if (isDash(text))
                    replaceDashWithNumber(selected, key)
                else if (isInRange(number))
                    appendNumber(selected, text, key)
            }
            text = selected.innerText
            if (parseInt(text) > 100)
                selected.innerText = "100%"
            if (text == "%") {
                selected.classList.replace("number", "initial")
                selected.innerText = "-"
            }
            updateAvg(row)
            changeView(currentView)
        }
    }

    setOnClickForAllInputs = () => {
        for (let i = 0; i < students.length; i++) {
            for (let cell of students[i].children) {
                if (isInput(cell)) {
                    cell.onclick = (e) => {
                        selected && selected.classList.remove("selected")
                        if (selected != cell) {
                            selected = cell
                            selected.classList.add("selected")
                            row = i
                        }
                    }
                }
            }
        }
    }

    isInput = (cell) => cell.classList.contains("input")
    
    isBackspace = (key) => key == "Backspace"
    
    isDash = (text) => text == "-"
    
    isDigitAndCurrentNot0 = (key, text) => key.match(/\d/) && text.slice(0,1) != 0
    
    removeLastNumber = (selected, text) =>
        selected && (selected.innerText = text.substring(0, text.length - 2) + "%")
    
    replaceDashWithNumber = (selected, key) => 
        selected && (selected.innerText = key + "%")
    
    appendNumber = (selected, text, key) =>
        selected && (selected.innerText = text.substring(0, text.length - 1) + key + "%")
    
    isInRange = (n) => n >= 0 && n <= 100
    
    updateAvg = (row) => {
        let sum = 0, count = 0
        const finalRow = students[row].lastElementChild
        for(let i = 0; i < students[row].children.length; i++) {
            if(students[row].children[i].innerText != "-" && students[row].children[i].classList.contains("input")) {
                const n = parseInt(students[row].children[i].innerText);
                if(n >= 0) {
                    sum += n
                    count++
                }
            }
        }
        const avg = Math.round(sum / count);
        if(avg < 60)
            finalRow.classList.add("fail")
        else finalRow.classList.remove("fail")
        studentValues[row] = finalRow.innerText = avg >= 0 ? avg + "%" : "-";
        if(finalRow.innerText != "-")
            finalRow.classList.replace("initial", "number")
        else
            finalRow.classList.replace("number", "initial")
    }
    //EXECUTION
    setOnClickForAllInputs()      
    setGlobalOnKeyPress()
}

initGradeTypeIterator()
initInputs()

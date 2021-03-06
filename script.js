let [header, ...students] = document.getElementsByTagName("tbody")[0].children

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
let assessmentNo = 5
let id = 10

document.getElementById("row").onclick = () => {
    let table = document.getElementsByTagName("tbody")[0]
    table.innerHTML += 
    `
    <tr>
        <td class="name">-</td>
        <td class="id">${++id}</td>
        ${`<td class="initial input">-</td>`.repeat(assessmentNo)}
        <td class="initial final">-</td>
    </tr>
    `;
    [header, ...students] = document.getElementsByTagName("tbody")[0].children
    initGradeTypeIterator()
    initInputs()
}

document.getElementById("col").onclick = () => {
    let parts = header.innerHTML.split(/(?=<th>Final)/)
    header.innerHTML = `${parts[0]}<th>Assessment ${++assessmentNo}</th>${parts[1]}`
    let first = true
    for(let student of students) {
        first && console.log(student.innerHTML)
        parts = student.innerHTML.split(/(?=<td.*?final)/)
        student.innerHTML = 
        `${parts[0]}<td class="initial input">-</td>
        ${parts[1]}
        ` 
        first && console.log(student.innerHTML)
        first = false
    }
    [header, ...students] = document.getElementsByTagName("tbody")[0].children
    initGradeTypeIterator()
    initInputs()
}
const changeView = (pressed) => {
    header.lastElementChild.innerHTML = `Final grade<br/>(${pressed})`
    for(let i = 0; i < students.length; i++) {
        for(let j = 0; j < gradeType["percent"].length; j++) {
            let gradeCell = students[i].lastElementChild
            if(pressed == "percent" && studentValues[i])
                gradeCell.textContent = studentValues[i]
            else if(gradeType["percent"][j](parseInt(studentValues[i])))
                gradeCell.textContent = gradeType[pressed][j]
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
            let text = selected && selected.textContent
            let key = e.key
            if (isBackspace(key)) {
                if(isInput(selected))
                    removeLastNumber(selected, text)
                else
                    selected.textContent = selected.textContent.substring(0, selected.textContent.length - 1)
            }
            else if (isInput(selected) && isDigitAndCurrentNot0(key, text)) {
                selected.classList.replace("initial", "number")
                let number = parseInt(text + key)
                if (isDash(text))
                    replaceDashWithNumber(selected, key)
                else if (isInRange(number))
                    appendNumber(selected, text, key)
            }
            else if(isName(selected) && isLetterOrWhiteSpace(key)) {
                if(isDash(text))
                    selected.textContent = key
                else
                    selected.textContent += key
            }
                
            text = selected && selected.textContent
            if (parseInt(text) > 100)
                selected.textContent = "100%"
            if (text == "%") {
                selected.classList.replace("number", "initial")
                selected.textContent = "-"
            }
            updateAvg(row)
            changeView(currentView)
        }
    }

    setOnClickForAllInputs = () => {
        for (let i = 0; i < students.length; i++) {
            for (let cell of students[i].children) {
                if (isInput(cell) || isName(cell)) {
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

    isInput = (cell) => cell && cell.classList.contains("input")
    isName = (cell) => cell && cell.classList.contains("name")
    
    isBackspace = (key) => key == "Backspace"
    
    isDash = (text) => text == "-"
    
    isDigitAndCurrentNot0 = (key, text) => key.match(/\d/) && text.slice(0,1) != 0
    
    removeLastNumber = (selected, text) =>
        selected && (selected.textContent = text.substring(0, text.length - 2) + "%")
    
    replaceDashWithNumber = (selected, key) => 
        selected && (selected.textContent = key + "%")
    
    appendNumber = (selected, text, key) =>
        selected && (selected.textContent = text.substring(0, text.length - 1) + key + "%")
    
    isInRange = (n) => n >= 0 && n <= 100
    
    updateAvg = (row) => {
        let sum = 0, count = 0
        const finalRow = students[row].lastElementChild
        for(let i = 0; i < students[row].children.length; i++) {
            if(students[row].children[i].textContent != "-" && students[row].children[i].classList.contains("input")) {
                const n = parseInt(students[row].children[i].textContent);
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
        studentValues[row] = finalRow.textContent = avg >= 0 ? avg + "%" : "-";
        if(finalRow.textContent != "-")
            finalRow.classList.replace("initial", "number")
        else
            finalRow.classList.replace("number", "initial")
    }
    //EXECUTION
    setOnClickForAllInputs()      
    setGlobalOnKeyPress()

    function isLetterOrWhiteSpace(key) {
        return key.match(/^[A-Za-z ]$/)
    }
}

initGradeTypeIterator()
initInputs()

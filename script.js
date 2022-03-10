const gradeType = {
    inRange: [
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

function createCell(classes, text) {
    let cell = document.createElement("td")
    classes && cell.classList.add(classes)
    text && (cell.textContent = text)
    return cell
}

let avgView = "percent"
let selected = null

window.onkeydown = (e) => {
    console.log("here")
    let text = selected && selected.textContent
    let key = e.key
    if(key === "Enter") {
        console.log(selected.cellIndex)
        if(selected.classList.contains("number"))
            selected.setGrade(selected.cellIndex, text)
        else selected.setName(selected.textContent)
    }
    else if (key === "Backspace") {
        if(isName(selected))
            removeLastLetter(text)   
        else
            removeLastNumber(text)
    }
    else if(isName(selected) && isLetterOrWhiteSpace(key)) {
        if(isDash(text))
            selected.textContent = key
        else
            selected.textContent += key
    }
    else if (isDigitAndCurrentNot0(key, text)) {
        selected.classList.replace("centered", "number")
        let number = parseInt(text + key)
        console.log(number)
        if (text === "-")
            replaceDashWithNumber(key)
        else if (isInRange(number)) {
            appendNumber(text, key)
        }
    }
    text = selected && selected.textContent
    if (parseInt(text) > 100)
        selected.textContent = "100%"
    if (text === "%") {
        selected.classList.replace("number", "centered")
        selected.textContent = "-"
    }
}

function removeLastLetter(text) {
    selected.textContent = text.substring(0, text.length - 1)
}

function isName (cell) { 
    return cell && cell.classList.contains("name")
}

function isDigitAndCurrentNot0 (key, text) {
    return /\d/.test(key) && text.slice(0,1) != 0
}

function replaceDashWithNumber (key) {
    console.log(key + "%")
    selected && (selected.textContent = key + "%")
}

function appendNumber (text, key) {
    
    selected && (selected.textContent = text.substring(0, text.length - 1) + key + "%")
}

function isInRange (n) {
    return n >= 0 && n <= 100
}

function removeLastNumber(text) {
    console.log(text)
    return selected && (selected.textContent = text.substring(0, text.length - 2) + "%")
}

class StudentManager {

    static assignmentID = 0
    constructor() {
        this.header = ["Name", "id", "FinalGrade"]
        this.students = []
        this.studentHistory = []
        this.headerHistory = []   
    }

    insertStudent(index, student) {
        if(index == undefined) throw new Error("index is null")
        const st = student || new Student()
        st.setNumberOfAssignments(this.header.length - 3)
        this.students.splice(index, 0, st)
        if(this.table) {
            st.html = this.toDynamicHTML(st)
            this.table.appendChild(st.html)
        }
    }

    addStudent(student) {
        this.insertStudent(this.students.length, student)
    }

    removeLastStudent() {
        this.removeStudent(this.students.length)
    }

    removeStudent(index) {
        this.studentHistory.push(this.students.splice(index, 1))
        if(this.studentHistory.length > 100)
            this.studentHistory.shift();
    }

    removeLastAssignment() {
        this.removeAssignment(this.header.length)
    }

    removeAssignment(index) {
        this.studentHistory.push(this.header.splice(index, 1))
        if(this.headerHistory.length > 100)
            this.headerHistory.shift();
    }

    addAssignment(assignmentName) {
        this.insertAssignment(this.header.length - 1, assignmentName)
    }

    insertAssignment(index, assignmentName) {
        this.assertIndexExistsAndIsInRange(index)
        const name = assignmentName || "Assignment " + ++StudentManager.assignmentID
        this.header.splice(index, 0, name)
        this.updateHeaderHTML(name, index)
        this.insertAllStudentsAssignmentAndUpdateHTML(index)
    }

    insertAllStudentsAssignmentAndUpdateHTML(index) {
        this.students.forEach(student => {
            student.insertAssignmentGrade(index)
            student.html && student.html.insertBefore(
                this.createGradeCell(student.assignments[index - 2]), student.html.children[index])
        })
    }

    updateHeaderHTML(name, index) {
        this.headerHTML &&
            this.headerHTML.insertBefore(this.createHeader(name), this.headerHTML.children[index])
    }

    assertIndexExistsAndIsInRange(index) {
        if (index < 2 || index >= this.header.length)
            throw new Error("positions 0,1 and last occupied")
        if (index == undefined)
            throw new Error("index is null")
    }

    asTable() {
        this.table = document.createElement("table")
        this.table.appendChild(this.headerHTML = this.appendTableHeaders())
        this.students.forEach(s => this.table.appendChild(this.toDynamicHTML(s)))
        return this.table
    }

    appendTableHeaders() {
        let node = document.createElement("tr")
        this.header.forEach(a => node.appendChild(this.createHeader(a)))
        return node
    }

    createHeader(title) {
        let header = document.createElement("th")
        header.textContent = title
        return header
    }

    toDynamicHTML(student) {
        let tableRow = student.html = document.createElement("tr")
        this.appendNameAndID(student, tableRow)
        this.appendGradeCells(student, tableRow)
        this.appendAvgCell(student, tableRow)
        return tableRow
    }

    appendNameAndID(student, node) {
        const name = createCell("name", student.name)
        name.onclick = (e) => this.select(name, e)
        const id = createCell("", student.id)
        node.appendChild(name)
        node.appendChild(id)
    }

    appendAvgCell(student, node) {
        let avgNode = document.createElement("td")
        let avg = student.getAvg()
        avgNode.classList.add(avg === "-" ? "centered" : "number")
        avgNode.textContent = avg
        node.appendChild(avgNode)
    }

    appendGradeCells(student, node) {
        student.assignments.forEach(grade => node.appendChild(this.createGradeCell(grade)))
    }

    createGradeCell(grade) {
        console.log(grade)
        const cell = document.createElement("td")
        if (grade != -1) {
            cell.textContent = grade + "%"
            cell.classList.add("number")
        }
        else {
            cell.textContent = "-"
            cell.classList.add("centered")
        }
        cell.onclick = (e) => this.select(cell, e)
        return cell
    }

    select(cell, e) {
        if (selected) {
            selected.classList.remove("selected")
        }
        selected = cell
        selected.classList.add("selected")
        e.stopPropagation()
    }
}

class Student {
    static id = 0
    constructor() {
        this.name = "-"
        this.assignments = []
        this.id = ++Student.id
        this.avg
    }

    setGrade(assignmentNumber, grade) {
        this.assignments[assignmentNumber] = grade
        this.calculateAvg()
    }

    setName (name) {
        this.name = name
        this.html && (this.html.firstChild.textContent = name)
    }

    setNumberOfAssignments(n) {
        this.assignments = Array(n).fill(-1)
    }

    insertAssignmentGrade (index, grade) {
        if(index == undefined) throw new Error("index is null")
        this.assignments.splice(index, 0, grade || -1)
    }

    removeAssignmentGrade (index) {
        if(index == undefined) throw new Error("index is null")
        this.assignments.splice(index, 1)
    }

    calculateAvg() {
        console.log("avg for:")
        console.log(this)
        return this.assignments.reduce((a, b) => a + b) / this.assignments.length
    }

    getAvg() {
        if(this.avg === -1) return "-"
        if(avgView === "percent") 
        return this.avg + "%"
        else 
            for(let i = 0; i < gradeType["inRange"].length; i++)
                if(gradeType["inRange"][i](this.avg))
                    return gradeType[avgView][i]
        throw new Error("student grade could not be calculated")
    }
}

window.onclick = (e) => {
    mngr.selected && mngr.selected.classList.remove("selected")
}

const column = document.createElement("button")
column.textContent = "column"
column.onclick = () => {
    mngr.addAssignment()
}
document.body.appendChild(column)

const row = document.createElement("button")
row.textContent = "row"
row.onclick = () => {
    mngr.addStudent()
}
document.body.appendChild(row)

let mngr = new StudentManager()
const karl = new Student()
document.body.appendChild(mngr.asTable())
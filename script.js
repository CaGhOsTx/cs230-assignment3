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

function select(wrapper, e) {
    console.log(wrapper)
    if (selected) 
        selected.element.classList.remove("selected")
    selected = wrapper
    selected.element.classList.add("selected")
    e.stopPropagation()
}

let avgView = "percent"
let selected = null

function initKeyListener() {
    const KEY_ACTIONS = {
        "Enter": () => {
            const cell = selected.element
            if(cell.classList.contains("number"))
                selected.student.setGrade(cell.cellIndex - 2, cell.textContent)
            else 
                selected.student.setName(cell.textContent)
            cell.classList.remove("unsubmitted")
            console.log(selected)
            },
        "Backspace": () => {
            if(selected.element.classList.contains("name"))
                removeLastLetter(selected.element.textContent)   
            else
                removeLastNumber(selected.element.textContent)
        },
        "Letter": (key, predicate) => {
            if(predicate()) {
                if(selected.element.textContent === "-")
                selected.element.textContent = key
                else
                    selected.element.textContent += key
                selected.element.classList.remove("centered")
            }
        },
        "Number": (key, predicate) => {
            if(predicate()) {
                selected.element.classList.replace("centered", "number")
                let number = parseInt(selected.element.textContent + key)
                if (selected.element.textContent === "-")
                    replaceDashWithNumber(key)
                else if (isInRange(number)) {
                    appendNumber(selected.element.textContent, key)
                }
            }
        },
        apply: (key) => {
            if(isLetterOrWhiteSpace(key))
                KEY_ACTIONS["Letter"](key, () => selected.element.classList.contains("name"))
            else if(isDigitAndCurrentNot0(key))
                KEY_ACTIONS["Number"](key, () => !selected.element.classList.contains("name"))
            else
                KEY_ACTIONS[key] && KEY_ACTIONS[key](key)
        }
    }
    window.onkeydown = (e) => {
        KEY_ACTIONS.apply(e.key)
        if (parseInt(selected.element.textContent) > 100)
            selected.element.textContent = "100%"
        if (isEmpty(selected.element.textContent))
            updateCSSAndSetBlank()
    }

    //HELPER FUNCTIONS

    function updateCSSAndSetBlank() {
        selected.element.classList.remove("number")
        selected.element.classList.add("centered")
        selected.element.textContent = "-"
    }

    function isEmpty(text) {
        return text === "%" || text === ""
    }
    
    function removeLastLetter(text) {
        selected.element.textContent = text.substring(0, text.length - 1)
    }
    
    function isDigitAndCurrentNot0 (key) {
        return /\d/.test(key) && selected.element.textContent.slice(0,1) != 0
    }
    
    function replaceDashWithNumber (key) {
        selected.element.textContent = key + "%"
    }
    
    function isLetterOrWhiteSpace(key) {
        return /^[A-Za-z ]$/.test(key)
    }
    
    function appendNumber (text, key) {   
        selected.element.textContent = text.substring(0, text.length - 1) + key + "%"
    }
    
    function isInRange (n) {
        return n >= 0 && n <= 100
    }
    
    function removeLastNumber(text) {
        return selected.element.textContent = text.substring(0, text.length - 2) + "%"
    }
}

class StudentManager {

    static assignmentID = 0
    constructor() {
        this.header = ["Name", "id", "FinalGrade"]
        this.students = []
        this.studentHistory = []
        this.headerHistory = []
        this.HTML = new StudentManagerHTML(this);
    }

    insertStudent(index, student = new Student()) {
        if(index == undefined) throw new Error("index is null")
        student.setNumberOfAssignments(this.header.length - 3)
        this.students.splice(index, 0, student)
        this.HTML.addStudentHTML(student)
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
        this.HTML.updateHeader(name, index)
        this.allocateAssignmentToAllStudents(index)
    }

    allocateAssignmentToAllStudents(index) {
        this.students.forEach(student => {
            student.insertAssignmentGrade(index)
            student.HTML.addAssignments(index)
        })
    }

    assertIndexExistsAndIsInRange(index) {
        if (index < 2 || index >= this.header.length)
            throw new Error("positions 0,1 and last occupied")
        if (index == undefined)
            throw new Error("index is null")
    }
}

class StudentManagerHTML {
    constructor(manager) {
        this.manager = manager
    }

    updateHeader(name, index) {
        this.headerHTML && this.headerHTML.insertBefore(this.createHeader(name), this.headerHTML.children[index])
    }

    addStudentHTML(student) {
        this.get() && this.HTML.appendChild(student.HTML.get())
    }

    get() {
        return this.HTML || (this.HTML = this.createTable())
    }

    createTable() {
        let table = document.createElement("table")
        table.appendChild(this.headerHTML = this.appendTableHeaders())
        this.manager.students.forEach(student => table.appendChild(student.HTML.get()))
        return table
    }

    appendTableHeaders() {
        let node = document.createElement("tr")
        this.manager.header.forEach(title => node.appendChild(this.createHeader(title)))
        return node
    }

    createHeader(title) {
        let header = document.createElement("th")
        header.textContent = title
        return header
    }
}

class Student {
    static id = 0
    constructor() {
        this.name = "-"
        this.assignments = []
        this.id = ++Student.id
        this.HTML = new StudentHTML(this)
    }

    setGrade(assignmentNumber, grade) {
        this.assignments[assignmentNumber] = grade
        this.avg = this.calculateAvg()
        this.HTML.updateAverage()
    }

    setName (name) {
        this.name = name
        this.HTML.updateName(name)
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
        let sum = 0
        for(let i = 0; i < this.assignments.length; i++) {
                sum += (this.assignments[i] != -1) ? parseInt(this.assignments[i]) : 0
        }
        console.log(sum)
        return Math.round(sum / this.assignments.length)
    }

    getAvgType() {
        if(this.avg === -1) return "-"
        if(avgView === "percent") 
        return this.avg? this.avg + "%" : "-"
        else 
            for(let i = 0; i < gradeType["inRange"].length; i++)
                if(gradeType["inRange"][i](this.avg))
                    return gradeType[avgView][i] || "-"
        throw new Error("student grade could not be calculated")
    }
}

class StudentHTML {
    constructor(student) {
        this.student = student
    }

    get() {
        return this.HTML || (this.HTML = this.getStudentAsTableRow())
    }

    updateName(name) {
        if(!this.HTML) this.get()
        this.HTML.firstChild.textContent = name
    }

    updateAverage() {
        const avg = this.student.getAvgType()
        if(this.student.avg < 50)
            this.HTML.lastChild.classList.add("fail")
        else
            this.HTML.lastChild.classList.remove("fail")
        if(avg === "-")
            this.HTML.lastChild.classList.replace("number", "centered")
        else
            this.HTML.lastChild.classList.replace("centered", "number")
        this.HTML.lastChild.textContent = avg
    }

    addAssignments(index) {
        if(!this.HTML) this.get()
        const cell = this.createGradeCell(this.student.assignments[index - 2])
        this.HTML.insertBefore(cell, this.HTML.children[index])
    }

    getStudentAsTableRow() {
        let row = document.createElement("tr")
        this.appendNameAndID(row)
        this.appendGradeCells(row)
        this.appendAvgCell(row)
        return row
    }

    appendNameAndID(row) {
        const name = this.createCell(this.student.name, "name", "centered")
        name.onclick = (e) => select({student: this.student, element: name}, e)
        const id = this.createCell(this.student.id)
        row.appendChild(name)
        row.appendChild(id)
    }

    createCell(text, ...classes) {
        let cell = document.createElement("td")
        classes.length && cell.classList.add(...classes)
        text && (cell.textContent = text)
        return cell
    }

    appendAvgCell(row) {
        const cell = document.createElement("td")
        let avg = this.student.getAvgType()
        cell.classList.add(avg === "-" ? "centered" : "number")
        cell.textContent = avg
        row.appendChild(cell)
    }

    appendGradeCells(row) {
        this.student.assignments.forEach(grade => row.appendChild(this.createGradeCell(grade)))
    }

    createGradeCell(grade) {
        let cell = document.createElement("td")
        if (grade != -1)
            cell = this.asFilledCell(cell, grade)
        else
            cell = this.asEmptyCell(cell)
        cell.onclick = (e) => select({student:this.student, element:cell}, e)
        return cell
    }

    asFilledCell(cell, grade) {
        cell.textContent = grade + "%"
        cell.classList.add("number")
        return cell
    }

    asEmptyCell(cell) {
        cell.textContent = "-"
        cell.classList.add("centered", "unsubmitted")
        return cell
    }
}

//TEMP
function main () {
    initKeyListener()
    window.onclick = (e) => {
        mngr.selected && mngr.selected.element.classList.remove("selected")
    }
    
    const column = document.createElement("button")
    column.textContent = "column"
    column.onclick = () => mngr.addAssignment()
    document.body.appendChild(column)
    
    const row = document.createElement("button")
    row.textContent = "row"
    row.onclick = () => mngr.addStudent()
    
    document.body.appendChild(row)
    
    let mngr = new StudentManager()

    for(let i = 0; i < 10; i++) {
        mngr.addAssignment();
        mngr.addStudent();  
    }
    console.log(mngr)
    document.body.appendChild(mngr.HTML.get())
}

main()

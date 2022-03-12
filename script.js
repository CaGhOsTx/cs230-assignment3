let selected = null


function select(wrapper, e) {
    if(selected) {
        selected.element.classList.remove("selected")
        selected.parent && selected.parent.classList.remove("selected")
    }
    selected = wrapper
    if(selected) {
        selected.element.classList.add("selected")
        selected.parent && selected.parent.classList.add("selected")
    }
    e && e.stopPropagation()
}

window.onclick = (e) => {
    select(null)
}

function isEmpty(text) {
    return text === "-"
}

function initKeyListener(manager) {
    const KEY_ACTIONS = {
        "Enter": () => {
            const cell = selected.element
            if(cell.classList.contains("header")) 
                manager.setAssignmentName(cell.textContent, cell.cellIndex)
            else {
                if(cell.classList.contains("number"))
                    selected.student.setGrade(cell.cellIndex - 2, cell.textContent)
                else 
                    selected.student.setName(cell.textContent)
                if(isEmpty(cell.textContent))  {
                    cell.classList.remove("number")
                    cell.classList.add("centered", "unsubmitted")
                    cell.textContent = "-"
                    manager.updateUnsubmitted(1)
                    select(null);
                }
                else {
                    cell.classList.remove("unsubmitted")
                    manager.updateUnsubmitted(-1)
                    if (parseInt(cell.textContent) > 100)
                        cell.textContent = "100%"
                }
            }
        },
        "Backspace": () => {
            const isHeader = selected.element.classList.contains("header")
            const cell = isHeader? selected.element.firstChild : selected.element
            
            if(isHeader || cell.classList.contains("name"))
                removeLastLetter(cell, cell.textContent)   
            else
                removeLastNumber(cell, cell.textContent)
        },
        "Letter": (key, predicate) => {
            if(predicate()) {
                let el = selected.element.classList.contains("header") ? 
                    selected.element.firstChild : selected.element
                if(el.textContent === "-")
                el.textContent = key
                else
                    el.textContent += key
                el.classList.remove("centered")
            }
        },
        "Number": (key, predicate) => {
            if(predicate()) {
                let el = selected.element
                if(el.classList.contains("header"))
                    el.firstChild.textContent += key
                else {
                    el.classList.replace("centered", "number")
                    if (el.textContent === "-")
                        replaceDashWithNumber(key)
                    else 
                        appendNumber(el.textContent, key)
                }
            }
        },
        apply: (key) => {
            if(selected) {
                if(isLetterOrWhiteSpace(key))
                    KEY_ACTIONS["Letter"](key, () => selected.element.classList.contains("name") || selected.element.classList.contains("header"))
                else if(isDigitAndCurrentNot0(key))
                    KEY_ACTIONS["Number"](key, () => !selected.element.classList.contains("name"))
                else
                    KEY_ACTIONS[key] && KEY_ACTIONS[key](key)
            }
        }
    }
    window.onkeydown = (e) => {
        KEY_ACTIONS.apply(e.key)
    }
    
    function removeLastLetter(el, text) {
        if(text.length == 1)
            el.textContent = "-"
        else
        el.textContent = text.substring(0, text.length - 1)
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
        
        if(parseInt(selected.element.textContent) + key > 100) 
            selected.element.textContent = "100%"
        else
            selected.element.textContent = text.substring(0, text.length - 1) + key + "%"
    }
    
    function removeLastNumber(el, text) {
        if(text.length <= 2)
            el.textContent = "-"
        else
            el.textContent = text.substring(0, text.length - 2) + "%"
    }
}

class ButtonGroup {
    constructor(buttons, cssClass) {
        this.GROUP = document.createElement("div")
        buttons.forEach(b => this.GROUP.appendChild(b.get()))
        cssClass && this.GROUP.classList.add(cssClass)
        this.GROUP.classList.add("group")
    }

    get() {
        return this.GROUP
    }
}

class Button {
    constructor(onClickfn, text) {
        this.BUTTON = document.createElement("div")
        this.BUTTON.classList.add("button")
        text && (this.BUTTON.textContent = text)
        this.BUTTON.onclick = onClickfn
    }

    get() {
        return this.BUTTON
    }
}

class StudentManager {

    static assignmentID = 0
    constructor() {
        this.header = ["Name", "id", "Final Grade"]
        this.unsubmittedCount = 0
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
        this.updateUnsubmitted(this.header.length - 3)
    }

    setAssignmentName(name, index) {
        this.header[index] = name
    }

    updateUnsubmitted(value) {
        console.log("updating " + this.students.length + " " + (this.header.length - 3))
        this.unsubmittedCount += value
        this.unsubmittedCount = Math.max(0, this.unsubmittedCount)
        const maxVal = (this.header.length - 3) * this.students.length
        this.unsubmittedCount = Math.min(this.unsubmittedCount, maxVal)
        console.log(this.unsubmittedCount)
        this.HTML.updateUnsubmitted()
    }
    addStudent(student) {
        this.insertStudent(this.students.length, student)
    }

    removeLastStudent() {
        this.removeStudent(this.students.length)
    }

    removeStudent(index) {
        this.HTML.updateUnsubmitted()
        this.studentHistory.push(this.students.splice(index, 1))
        if(this.studentHistory.length > 100)
            this.studentHistory.shift();
        this.updateUnsubmitted(-(this.header.length - 3))
    }

    removeLastAssignment() {
        this.removeAssignment(this.header.length)
    }

    removeAssignment(index) {
        this.HTML.updateUnsubmitted()
        this.studentHistory.push(this.header.splice(index, 1))
        if(this.headerHistory.length > 100)
            this.headerHistory.shift();
        this.updateUnsubmitted(-this.students.length)
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
        this.updateUnsubmitted(this.students.length)
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
        this.get() && this.HTML.firstChild.appendChild(student.HTML.get())
    }

    get() {
        return this.HTML || (this.HTML = this.createManagerView())
    }

    createManagerView() {
        let div = document.createElement("div")
        let table = document.createElement("table")
        table.appendChild(this.headerHTML = this.appendTableHeaders())
        this.manager.students.forEach(student => table.appendChild(student.HTML.get()))
        let unsubmittedAssignments = document.createElement("p")
        unsubmittedAssignments.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`
        div.appendChild(table)
        div.appendChild(unsubmittedAssignments)
        return div
    }

    updateUnsubmitted() {
        this.HTML && (this.HTML.lastChild.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`)
    }

    appendTableHeaders() {
        let node = document.createElement("tr")
        this.manager.header.forEach(title => node.appendChild(this.createHeader(title)))
        const GENERATOR = formatGenerator()
        node.lastElementChild.onclick = () => {
            Student.CURRENT_GRADE_FORMAT = GENERATOR.next().value
            this.manager.students.forEach(student => student.HTML.updateAverage())
        }
        return node

        function* formatGenerator () {
            let i = 0
            const GRADE_FORMATS = ["percent", "american", "gpa"]
            while(true)
                yield GRADE_FORMATS[i = i < GRADE_FORMATS.length - 1 ? i + 1 : 0]
        }
    }

    createHeader(title) {
        let header = document.createElement("th")
        header.classList.add("header")
        let p = document.createElement("p")
        p.textContent = title
        header.appendChild(p)
        if(this.isAssignment(title)) {
            header.classList.add("assignment")
            
            header.appendChild(this.createButtons())
            
        }
        header.onclick = (e) => select({element: header}, e)
        return header
    }

    isAssignment(title) {
        return title != "Name" && title != "id" && title != "Final Grade"
    }

    createButtons() {
        return new ButtonGroup(
            [
                new Button((e) => {
                    
                    this.manager.insertAssignment(selected.element.cellIndex)
                }, "+"),
                new Button((e) => {
                    this.manager.removeAssignment(selected.element.cellIndex)
                }, "-"),
                new Button((e) => {
                    this.manager.insertAssignment(selected.element.cellIndex + 1)
                }, "+")
            ], "horizontal").get()
    }
}

class Student {
    static id = 0
    static CURRENT_GRADE_FORMAT = "percent"
    static GRADE_FORMAT = {
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
    constructor() {
        this.name = "-"
        this.assignments = []
        this.id = ++Student.id
        this.HTML = new StudentHTML(this)
    }

    setGrade(assignmentNumber, grade) {
        this.assignments[assignmentNumber] = grade === "-"? -1 : grade
        this.updateAverage()
    }

    setName (name) {
        this.name = name
        this.HTML.updateName(name)
    }

    updateAverage() {
        
        this.avg = this.calculateAvg()
        this.HTML.updateAverage()
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
        let unsubmitted = 0
        for(let i = 0; i < this.assignments.length; i++) {
            if(this.assignments[i] === -1) 
                unsubmitted++
            else
                sum += parseInt(this.assignments[i])
        }
        
        if(unsubmitted === this.assignments.length) return undefined
        return Math.round(sum / this.assignments.length)
    }

    getGradeFormat() {
        if(this.avg === undefined)
            return "-"
        if(Student.CURRENT_GRADE_FORMAT === "percent") 
        return this.avg + "%"
        else
            for(let i = 0; i < Student.GRADE_FORMAT["inRange"].length; i++)
                if(Student.GRADE_FORMAT["inRange"][i](this.avg))
                    return Student.GRADE_FORMAT[Student.CURRENT_GRADE_FORMAT][i] || "-"
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
        const avg = this.student.getGradeFormat()
        
        const avgCell = this.HTML.children[this.HTML.children.length - 2]
        if(this.student.avg < 50)
            avgCell.classList.add("fail")
        else
            avgCell.classList.remove("fail")
        if(avg === "-")
            avgCell.classList.replace("number", "centered")
        else
            avgCell.classList.replace("centered", "number")
        avgCell.textContent = avg
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
        row.appendChild(new ButtonGroup(
            [
                new Button((e) => {
                    
                }, "+"),
                new Button((e) => {

                }, "-"),
                new Button((e) => {

                }, "+")
            ], "vertical").get())
        return row
    }

    appendNameAndID(row) {
        const name = this.createCell(this.student.name, "name", "centered")
        name.onclick = (e) => select({student: this.student, element: name, parent: row}, e)
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
        cell.classList.add("avg")
        let avg = this.student.getGradeFormat()
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
    let manager = new StudentManager()
    initKeyListener(manager)
    window.onclick = (e) => {
        selected && selected.element.classList.remove("selected")
    }
    buttons(manager)
    for(let i = 0; i < 5; i++) {
        manager.addAssignment();
        manager.addStudent();  
    }
    document.body.insertBefore(manager.HTML.get(), document.body.firstChild)
}

main()

function buttons(mngr) {
    const column = document.createElement("button")
    column.textContent = "column"
    column.onclick = () => mngr.addAssignment()
    document.body.appendChild(column)

    const row = document.createElement("button")
    row.textContent = "row"
    row.onclick = () => mngr.addStudent()
    document.body.appendChild(row)
}
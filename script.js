/**
 * Selected element state variable, could be moved 
 * into the StudentManager class with some refactoring
 */
let selected = null

/**
 * Global polymorphic function used to select a table element on user click
 * @param {*} wrapper mediator which contains data required to apply classList 
 *                    operations on the selected element polymorphically.
 * used fields: {
 *      student<Student>:,
 *      element<HTMLElement>:, 
 *      parent<Array<HTMLElement>>:, 
 *      clazz<String>:, 
 *      lastClazz<String>:
 * }
 * @param {MouseEvent} e 
 */
function select(wrapper = null, e) {
    //unselect previously selected element
    selected && applyClassListOperationOnAll((list, c) => list.remove(c))
    //switch state
    selected = wrapper
    //select new element
    selected && applyClassListOperationOnAll((list, c) => list.add(c))
    e && e.stopPropagation()

    /**
     * applies the classList function specified to selected 
     * element's siblings (optionally) further modifying the last element.
     * First parameter is the classList key of an HTMLElement
     * Second parameter is the class String
     * @param {BiConsumer<ClassList, String>} classListBiConsumer defines classList operation
     */
    function applyClassListOperationOnAll(classListBiConsumer) {
        const parent = selected.parent
        //apply operation on element
        classListBiConsumer(selected.element.classList, selected.clazz)
        //if parent exists
        if(parent) {
            //apply operation on all siblings
            parent.forEach(e => classListBiConsumer(e.classList, selected.clazz))
            //optionally apply operation on the last sibling
            selected.lastClazz && classListBiConsumer(parent[parent.length - 1].classList, selected.lastClazz)
        }
    }
}
/**
 * Initialises the user controller (keyboard event functionality)
 * @param {StudentManager} manager Model instance
 */
function initUserController(manager) {
    /**
     * Enum like object describing key press identities and their respective functionality
     */
    const KEY_ACTIONS = {
        //readable
        "Enter": () => {
            const cell = selected.element
            if(cell.classList.contains("header")) 
                manager.setAssignmentName(cell.textContent, cell.cellIndex)
            else {
                if(cell.classList.contains("number")) {
                    selected.student.setGrade(cell.cellIndex - 2, cell.textContent)
                    isEmpty(cell.textContent) && reset(cell) || submit(cell)
                } 
                //else if its a name cell
                else {
                    selected.student.setName(cell.textContent)
                    isEmpty(cell.textContent) && cell.classList.add("centered")
                }
            }
            //deselect element
            select(null)

            /**
             * removes the unsubmitted class (changing background color of cell) if present
             * and decreases unsubmited count
             * @param {HTMLElement} cell 
             */
            function submit(cell) {
                cell.classList.remove("unSubmitted")
                manager.updateUnsubmitted(-1)
            }

            /**
             * Reverts cell into unsubmitted state and increases unsubmitted count
             * @param {HTMLElement} cell 
             */
            function reset(cell) {
                cell.classList.replace("right", "centered")
                cell.classList.add("unSubmitted")
                manager.updateUnsubmitted(1)
            }
        },
        "Backspace": () => {
            const isHeader = selected.element.classList.contains("header")
            //Slight View issue,
            //The required selected.element differs between th and td.name elements
            //Implemented buttongroup is directly attached to th, 
            //but not td.name (it is attached to parent tr)
            //this applies to all enum constants here
            const cell = isHeader? selected.element.firstChild : selected.element
            if(isHeader || cell.classList.contains("name"))
                removeLastCharacter(cell, cell.textContent)   
            else
                removeLastNumberKeepingPercent(cell, cell.textContent)

            function removeLastCharacter(el, text) {
                if(text.length === 1)
                    el.textContent = "-"
                else
                el.textContent = text.substring(0, text.length - 1)
            }

            function removeLastNumberKeepingPercent(el, text) {
                if(text.length <= 2)
                    el.textContent = "-"
                else
                    el.textContent = text.substring(0, text.length - 2) + "%"
            }
        },
        "Letter": (key, predicate) => {
            if(predicate()) {
                let el = selected.element.classList.contains("header") ? 
                    selected.element.firstChild : selected.element
                if(isEmpty(el.textContent))
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
                    if (isEmpty(el.textContent))
                        replaceDashWithPercentage(key)
                    else 
                        appendNumber(el.textContent, key)
                }
            }

            function replaceDashWithPercentage (key) {
                el.classList.replace("centered", "right")
                selected.element.textContent = key + "%"
            }

            function appendNumber (number, input) {
                let element = selected.element
                if(isGreaterThan100(number)) 
                    element.textContent = "100%"
                else
                    element.textContent = number.substring(0, number.length - 1) + input + "%"
        
                function isGreaterThan100(number) {
                    return parseInt(number) + input > 100
                }
            }
        },
        /**
         * Executes the appropriate action for the input key if the key is defined
         * @param {KeyEvent} key 
         * @returns undefined
         */
        apply: (key) => {
            //if element is selected
            if(selected) {
                const element = selected.element
                //if not an assignment header, do not edit
                if(element.classList.contains("header") && !element.classList.contains("assignment"))
                    return
                if(isLetterOrWhiteSpace(key))
                    //append letter to non number cells
                    KEY_ACTIONS["Letter"](key, () => !element.classList.contains("number"))
                else if(isDigitAndCurrentNot0(key))
                    //append number to non name cells
                    KEY_ACTIONS["Number"](key, () => !element.classList.contains("name"))
                else
                    //resolve key event on selected element if an action for this key event is defined
                    KEY_ACTIONS[key] && KEY_ACTIONS[key](key)
                
                function isDigitAndCurrentNot0 (key) {
                    return /\d/.test(key) && selected.element.textContent.slice(0,1) != 0
                }
                
                function isLetterOrWhiteSpace(key) {
                    return /^[A-Za-z ]$/.test(key)
                }
            }
        }
    }
    //set window key listener 
    window.onkeydown = (e) => KEY_ACTIONS.apply(e.key)
    //this doesnt do anything for some reason
    window.onclick = () => select(null)
    
    /**
     * @param {String} text 
     * @returns true if the selected HTMLElement text content is "-", false otherwise
     */
    function isEmpty(text) {
        return text === "-"
    }
}

/**
 * Button group object which encapsulates the row/column edit options
 */
class ButtonGroup {
    /**
     * Creates a new button group, initialising buttons 
     * inside of a div with classList specified by {@link cssClasses} + .group
     * @param {Array<Button>} buttons array of buttons to be added to this group
     * @param  {...String} cssClasses css classes to be added to this group's classList
     */
    constructor(buttons, ...cssClasses) {
        this.GROUP = document.createElement("div")
        buttons.forEach(button => this.GROUP.appendChild(button.get()))
        cssClasses && cssClasses.forEach(c => this.GROUP.classList.add(c))
        this.GROUP.classList.add("group")
    }

    /**
     * @returns this group's div container
     */
    get() {
        return this.GROUP
    }
}

/**
 * Simple button class used with {@link ButtonGroup} to create row/column edit options
 */
class Button {
    /**
     * Creates a new Button with specified on click functionality, text content and classList + .button
     * @param {Consumer<MouseEvent>>} onClickfn on click consumer function
     * @param {String} text text content of the button
     * @param  {...String} cssClasses classList of the button
     */
    constructor(onClickFn, text, ...cssClasses) {
        this.BUTTON = document.createElement("span")
        this.BUTTON.classList.add("button")
        text && (this.BUTTON.textContent = text)
        cssClasses && cssClasses.forEach(c => this.BUTTON.classList.add(c))
        this.BUTTON.onclick = onClickFn
    }

    /**
     * 
     * @returns this buttons span element
     */
    get() {
        return this.BUTTON
    }
}

/**
 * Main class that is a sort of half model half view..
 * Don't like it too much in the end, cyclic dependencies here make it so less code is written
 * however, it is impossible to stringify {@link StudentManager} or {@link Student}.
 * This would be a problem if database functionality was required.
 */
class StudentManager {
    constructor() {
        this.header = ["Name", "id", "Final Grade"]
        this.unsubmittedCount = 0
        this.students = []
        this.studentHistory = []
        this.headerHistory = []
        //this here is the problem
        this.TABLE = new Table(this);
    }

    insertStudent(index, student = new Student()) {
        if(index === undefined) throw new Error("index is null")
        student.setNumberOfAssignments(this.header.length - 3)
        this.students.splice(index, 0, student)
        this.TABLE.insertStudentHTML(student, index)
        this.updateUnsubmitted(this.header.length - 3)
    }

    setAssignmentName(name, index) {
        this.header[index] = name
    }

    updateUnsubmitted(value) {
        this.unsubmittedCount += value
        this.unsubmittedCount = Math.max(0, this.unsubmittedCount)
        const maxVal = (this.header.length - 3) * this.students.length
        this.unsubmittedCount = Math.min(this.unsubmittedCount, maxVal)
        this.TABLE.updateUnsubmitted()
    }
    addStudent(student) {
        this.insertStudent(this.students.length, student)
    }

    removeLastStudent() {
        this.removeStudent(this.students.length)
    }

    removeStudent(index) {
        this.TABLE.updateUnsubmitted()
        this.studentHistory.push(this.students.splice(index, 1))
        if(this.studentHistory.length > 100)
            this.studentHistory.shift();
        this.updateUnsubmitted(-(this.header.length - 3))
    }

    removeLastAssignment() {
        this.removeAssignment(this.header.length)
    }

    removeAssignment(index) {
        this.TABLE.updateUnsubmitted()
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
        const name = assignmentName || "Assignment"
        this.header.splice(index, 0, name)
        this.TABLE.updateHeader(name, index)
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
        if (index === undefined)
            throw new Error("index is null")
    }
}

class Table {
    constructor(manager) {
        this.manager = manager
        this.rows = []
    }

    updateHeader(name, index) {
        this.headerHTML && this.headerHTML.insertBefore(this.createHeader(name, this.headerHTML), this.headerHTML.children[index])
    }

    insertStudentHTML(student, index = this.manager.students.length) {
        this.get() && this.insertStudent(student, this.HTML.firstChild, index)
    }

    get() {
        return this.HTML || (this.HTML = this.createManagerView())
    }

    createManagerView() {
        let div = document.createElement("div")
        let table = document.createElement("table")
        table.appendChild(this.headerHTML = this.appendTableHeaders())
        //this.manager.students.forEach(student => this.insertStudent(student, table))
        let unsubmittedAssignments = document.createElement("p")
        unsubmittedAssignments.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`
        div.appendChild(table)
        div.appendChild(unsubmittedAssignments)
        return div
    }

    insertStudent(student, table, index) {
        console.log(index)
        const row = student.HTML.get()
        table.insertBefore(row, table.children[index + 1])
        console.log(this.setAVGColumnListener.rowIndex)
        row.appendChild(new ButtonGroup(
            [
                new Button(() => this.manager.insertStudent(row.rowIndex - 1), "+", "green"),
                new Button(() => {
                    console.log("before: " + this.manager)
                    this.manager.removeStudent(row.rowIndex)
                    console.log("after: " + this.manager)
                }, "-", "red"),
                new Button(() => this.manager.insertStudent(row.rowIndex), "+", "green")
            ], "vertical").get())
    }

    updateUnsubmitted() {
        this.HTML && (this.HTML.lastChild.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`)
    }

    appendTableHeaders() {
        let node = document.createElement("tr")
        this.manager.header.forEach(title => this.createHeader(title, node))
        this.setAVGColumnListener(node)
        return node
    }

    setAVGColumnListener(node) {
        const GENERATOR = formatGenerator()
        node.lastElementChild.onclick = () => {
            Student.CURRENT_GRADE_FORMAT = GENERATOR.next().value
            this.manager.students.forEach(student => student.HTML.updateAverage())
        }
        
        function* formatGenerator () {
            let i = 0
            const GRADE_FORMATS = ["percent", "american", "gpa"]
            while(true)
                yield GRADE_FORMATS[i = i < GRADE_FORMATS.length - 1 ? i + 1 : 0]
        }
    }

    createHeader(title, node) {
        if(!node) throw new Error("parent element not defined!")
        let header = document.createElement("th")
        node && node.appendChild(header)
        header.classList.add("header")
        let p = document.createElement("p")
        p.textContent = title
        header.appendChild(p)
        if(isAssignment(title)) {
            header.classList.add("assignment")
            header.appendChild(createButtons())
        }
        header.onclick = (e) => select({
            element: header, 
            parent: this.manager.students
            .map(s => s.HTML.get().children[Array.from(node.children).indexOf(header)]),
            clazz: "selectedColumn",
            lastClazz: "last"
        }, e)
        return header

        function createButtons() {
            return new ButtonGroup(
                [
                    new Button(() => {
                        
                        this.manager.insertAssignment(selected.element.cellIndex)
                    }, "+", "green"),
                    new Button(() => {
                        console.log("before: " + this.manager)
                        this.manager.removeAssignment(selected.element.cellIndex)
                        console.log("after: " + this.manager)
                    }, "-", "red"),
                    new Button(() => {
                        this.manager.insertAssignment(selected.element.cellIndex + 1)
                    }, "+", "green")
                ], "horizontal", "green").get()
        }

        function isAssignment(title) {
            return title !== "Name" && title !== "id" && title !== "Final Grade"
        }
    }
}

class Student {
    static ID = 0
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
        this.id = ++Student.ID
        this.HTML = new TableRow(this)
    }

    setGrade(assignmentNumber, grade) {
        this.assignments[assignmentNumber] = grade === "-"? -1 : parseInt(grade)
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
        if(index === undefined) throw new Error("index is null")
        this.assignments.splice(index, 0, grade || -1)
    }

    removeAssignmentGrade (index) {
        if(index === undefined) throw new Error("index is null")
        this.assignments.splice(index, 1)
    }

    calculateAvg() {
        let submitted = this.assignments.filter(i => i !== -1)
        return submitted.length !== 0 ? 
        Math.round(submitted.reduce((a, b) => a + b, 0) / this.assignments.length) : undefined
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

class TableRow {
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
            avgCell.classList.replace("right", "centered")
        else
            avgCell.classList.replace("centered", "right")
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
        return row
    }

    appendNameAndID(row) {
        const name = this.createCell(this.student.name, "name", "centered")
        name.onclick = (e) => select({
            student: this.student, 
            element: name,
            parent: [row], 
            clazz: "selected"}, e)
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
        cell.classList.add(avg === "-" ? "centered" : "right")
        cell.textContent = avg
        row.appendChild(cell)
    }

    appendGradeCells(row) {
        this.student.assignments.forEach(grade => row.appendChild(this.createGradeCell(grade)))
    }

    createGradeCell(grade) {
        let cell = document.createElement("td")
        cell.classList.add("number")
        if (grade !== -1)
            cell = this.asFilledCell(cell, grade)
        else
            cell = this.asEmptyCell(cell)
        cell.onclick = (e) => select({
            student:this.student, 
            element:cell, 
            clazz: "selected"}, e)
        return cell
    }

    asFilledCell(cell, grade) {
        cell.textContent = grade + "%"
        cell.classList.add("number")
        return cell
    }

    asEmptyCell(cell) {
        cell.textContent = "-"
        cell.classList.add("centered", "unSubmitted")
        return cell
    }
}


//TEMP
function main () {
    let manager = new StudentManager()
    initUserController(manager)
    window.onclick = () => {
        selected && selected.element.classList.remove("selected")
    }
    buttons(manager)
    for(let i = 0; i < 5; i++) {
        manager.addAssignment();
        manager.addStudent();  
    }
    document.body.insertBefore(manager.TABLE.get(), document.body.firstChild)
}

main()

function buttons(mngr) {
    const column = new Button(
        () => mngr.addAssignment(), "add column", "green", "side"
    ).get()

    const row = new Button(
        () => mngr.addStudent(), "add row", "green", "side"
    ).get()
    document.body.appendChild(column)
    document.body.appendChild(row)
}
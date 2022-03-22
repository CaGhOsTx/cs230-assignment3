let back = document.createElement("button")
back.classList.add("empty")
back.disabled = true
back.textContent = "back"


/**
 * Selected element state variable, could be moved 
 * into the StudentManager class with some refactoring
 */
let selected = null
/**
 * Stack which holds objects of the following type:
 * {
 * data: data and functions required to revert the removed (added items), their position and contents etc..
 * event: what type of action was it (did the user remove a row, add a row before another, etc..)
 *        -this property holds one of the CONTRA_EVENT properties which define counter behaviour
 *         to any action done by the user
 * }
 */
let history = []

/**
 * Enum which holds "contra" events to what happened.
 * If a student was removed, we want to add him back etc...
 */
const CONTRA_EVENT = {
    ADD_STUDENT: (manager, data) => {
        manager.removeStudent(data.index())
    },
    ADD_ASSIGNMENT: (manager, data) => {
        manager.removeAssignment(data.index())
    },
    REMOVE_STUDENT: (manager, data) => {
        manager.insertStudent(data.index(), data.student)
    },
    REMOVE_ASSIGNMENT: (manager, data) => {
        manager.revertAssignment(data)
    }
}

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
            parent.filter(e => e).forEach(e => classListBiConsumer(e.classList, selected.clazz))
            //optionally apply operation on the last sibling
            let lastSibling = parent[parent.length - 1]
            lastSibling && selected.lastClazz && classListBiConsumer(lastSibling.classList, selected.lastClazz)
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
                manager.setAssignmentName(cell.firstChild.textContent, cell.cellIndex)
            else {
                if(cell.classList.contains("number")) 
                    manager.updateUnsubmitted(selected.student.setGrade(cell.cellIndex - 2, cell.textContent))
                else {
                    selected.student.setName(cell.textContent)
                    isEmpty(cell.textContent) && cell.classList.add("centered")
                }
            }
            //deselect element
            select(null)
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
                selected.element.classList.replace("centered", "right")
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
 * Model class for the table
 */
class StudentManager {
    constructor() {
        this.header = ["Name", "id", "Average[percent]"]
        this.unsubmittedCount = 0
        this.students = []
        //this here is the problem
        this.TABLE = new Table(this);
    }
    /**
     * Inserts a student (much like inserting a row to a table) at the specified index.
     * @param {Number} index position at which to insert the student
     * @param {Student} student student to be added (empty by default)
     * @throws NullPointerException if index is null
     * @returns Student view / <tr> element
     */
    insertStudent(index, student = new Student()) {
        if(index === undefined) throw new Error("index is null")
        //header.length - 3 is beacuse the header includes #assignments + name, id, avg cell (3 extra)
        student.setNumberOfAssignments(this.header.length - 3)
        //add student at index
        this.students.splice(index, 0, student)
        //add table row to table
        this.TABLE.insertStudentHTML(student, index)
        //update number of unsubmitted assignments (+ number of unfilled cells for current student)
        this.updateUnsubmitted(student.assignments.filter(i => i === -1).length)
        return student.HTML.get()
    }
    /**
     * Sets the name of a header title to the specified name
     * @param {String} name name to replace the current with
     * @param {Number} index position of the header in the array
     * @throws NullPointerException if index is null
     * @throws OutOfBoundsException if index is out of bounds of the header array
     */
    setAssignmentName(name, index) {
        if(!index) throw new Error("index is null")
        if(index < 0 && index > this.header.length) throw new Error("index " + index + " is out of bounds for length 0-" + this.header.length)
        this.header[index] = name
    }
    /**
     * updates the unsubmitted count by adding the specified value
     * @param {Number} value number to be added to the unsubmitted count
     */
    updateUnsubmitted(value) {
        this.unsubmittedCount += value
        //keep unsubmitted count in range 0 to max unsubmitted assignments
        //since this method is used so the whole table is not scanned each time, 
        //this ensures that even if an empty assignment is submitted many times it only changes the value once
        this.unsubmittedCount = Math.max(0, this.unsubmittedCount)
        const maxVal = (this.header.length - 3) * this.students.length
        this.unsubmittedCount = Math.min(this.unsubmittedCount, maxVal)
        //update the unsubmitted <p> element to display the new value
        this.TABLE.updateUnsubmitted()
    }
    /**
     * Adds the student to the end of the students array
     * @param {Student} student 
     */
    addStudent(student = new Student()) {
        this.insertStudent(this.students.length, student)
    }

    /**
     * removes last student from the students array
     */
    removeLastStudent() {
        this.removeStudent(this.students.length)
    }

    /**
     * Removes the student at the specified index
     * @param {Number} index position from which to remove the student
     * @returns the student removed
     */
    removeStudent(index) {
        let student = this.students.splice(index - 1, 1)[0]
        this.updateUnsubmitted(-student.assignments.filter(i => i === -1).length)
        this.TABLE.removeStudent(index)
        return student
    }

    /**
     * Removes the last assignment from the header array
     */
    removeLastAssignment() {
        this.removeAssignment(this.header.length)
    }

    /**
     * Removes the assignment at the specified position in the header array
     * @param {Number} index position of the assignment in the array
     */
    removeAssignment(index) {
        this.header.splice(index, 1)
        //the reason for index - 2 is because the assignments array in the student object only 
        //holds the assignments while the table has the name and id field before assignments (hence index - 2)
        this.updateUnsubmitted(-this.students.filter(s => s.assignments[index - 2] === -1).length)
        this.students.forEach(s => s.removeAssignmentGrade(index - 2))
        this.TABLE.removeAssignment(index) 
    }

    /**
     * Adds an assignment to the length - 1 of the header array (last position is the average)
     * @param {String} assignmentName name of the assignment to be added ("Assignment" by default)
     */
    addAssignment(assignmentName) {
        this.insertAssignment(this.header.length - 1, assignmentName)
    }

    /**
     * Inserts an assignment at the specified index
     * @param {Number} index position of the assignment in the header array
     * @param {String} assignmentName name of the assignment
     * @returns the <th> element accompanied with the assignmen
     */
    insertAssignment(index, assignmentName) {
        let h = this.updateHeader(index, assignmentName)
        this.allocateAssignmentToAllStudents(index)
        this.updateUnsubmitted(this.students.filter(s => s.assignments[index - 2] === -1).length)
        return h
    }

    /**
     * Adds an assignment to each student in the table at the specified position
     * @param {Number} index 
     */
    allocateAssignmentToAllStudents(index) {
        this.students.forEach(s => {
            s.insertAssignmentGrade(index - 2, -1)
            //update the student html representation
            s.HTML.addAssignments(index)
        })
    }

    /**
     * Puts back the removed assignment when the user presses the back button (if this action is at the top of the stack)
     * @param {Object} removed wrapper object containing:
     *  index() function which calculates what position it should be inserted to
     *  grades array which holds the grades for all of the students present at removal of this assignment
     *  title of the assignment
     */
    revertAssignment(removed) {
        let index = removed.index()
        let grades = removed.grades
        //add title to the header
        this.updateHeader(index, removed.title)
        for(let i = 0; i < grades.length; i++) {
            //add assignment and corespondant grade back to each student
            //index is offset by two because assignments start after name and id title
            let student = this.students[i]
            student.insertAssignmentGrade(index - 2, grades[i] || -1)
            student.HTML.addAssignments(index)
            student.setGrade(index - 2, grades[i] === -1 ? "-" : grades[i] + "%")
        }
        //explained at line 314 
        this.updateUnsubmitted(this.students.filter(s => s.assignments[index - 2] === -1).length)
    }
    
    /**
     * Add the title at the specified position to the header
     * @param {Number} index 
     * @param {String} title 
     * @returns 
     */
    updateHeader(index, title) {
        this.assertIndexExistsAndIsInRange(index)
        const name = title || "Assignment"
        this.header.splice(index, 0, name)
        return this.TABLE.updateHeader(name, index)
    }

    /**
     * Tests if the index at which the assignment should be inserted at is valid (not 0th first or very last position)
     * @param {Number} index 
     */
    assertIndexExistsAndIsInRange(index) {
        if (index < 1 || index >= this.header.length)
            throw new Error("positions 0,1 and last occupied")
        if (index === undefined)
            throw new Error("index is null")
    }
}
/**
 * HTML table representation
 */
class Table {
    /**
     * Creates a new table based on the {@link StudentManager} provided
     * @param {StudentManager} manager 
     * @throws NullPointerException if manager is null
     */
    constructor(manager) {
        if(!manager) throw new Error("manager provided is null")
        this.manager = manager
        this.rows = []
    }

    /**
     * Inserts the table header title at the specified index
     * @param {String} name 
     * @param {Number} index 
     * @returns 
     */
    updateHeader(name, index) {
        if(this.headerHTML) {
        let header = this.createHeader(name, this.headerHTML);
        this.headerHTML.insertBefore(header, this.headerHTML.children[index])
        return header
        }
    }

    /**
     * Inserts the student <tr> at the specified position (last by default)
     * @param {Student} student 
     * @param {Number} index 
     */
    insertStudentHTML(student, index = this.manager.students.length) {
        this.get() && this.insertStudent(student, this.HTML.firstChild, index)
    }

    /**
     * Returns the <div> containing the table and other associated elements with the manager object provided in the constructor.
     * Creation only happens once, if this method is called multiple times, the previous reference is returned 
    */
    get() {
        return this.HTML || (this.HTML = this.createManagerView())
    }

    /** Initialises the HTML view of the manager
     * @returns the div containing the <table>, unsubmitted <p> and buttons
     */
    createManagerView() {
        let div = document.createElement("div")
        div.classList.add("table-container")
        let table = document.createElement("table")
        table.appendChild(this.headerHTML = this.appendTableHeaders())
        let unsubmittedAssignments = document.createElement("p")
        unsubmittedAssignments.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`
        div.appendChild(table)
        addSideButtons(div)
        div.appendChild(unsubmittedAssignments)
        return div
        /**
         * Creates side buttons and appends them to the div
         * @param {StudentManager} manager 
         * @param {HTMLElement} div 
         */
        function addSideButtons(div) {
            const column = new Button(
                () => this.manager.addAssignment(), "+", "green", "side", "col"
            ).get()
        
            const row = new Button(
                () => this.manager.addStudent(), "+", "green", "side", "row"
            ).get()
            div.appendChild(column)
            div.appendChild(row)
        }
    }
    /**
     * Inserts the student at the specified position
     * @param {Student} student student to be added
     * @param {HTMLelement} table the <table> element on which to add
     * @param {Number} index position at which to insert to the <table>
     */
    insertStudent(student, table, index) {
        const row = student.HTML.get()
        //+ 1 is beacuse insert before inserts before the element, 
        //so adding 1 makes it so the student <tr> gets added at the index
        table.insertBefore(row, table.children[index + 1])
        if(doesntContainButtonGroup(row))
            //add side buttons to the student <tr> (ui used to insert and remove rows)
            row.appendChild(new ButtonGroup(
                [
                    new Button(() => {
                        //remove the empty class from the back button (as now there is something to revert)
                        back.classList.remove("empty")
                        //re-enable the back button
                        back.disabled = false;
                        //add student before current one
                        this.manager.insertStudent(row.rowIndex - 1)
                        //add wrapper object to history stack 
                        //(which contains information what button was pressed, and how to revert state later in time)
                        history.push({
                            data: {
                                index: () => row.rowIndex - 1
                            }, event:CONTRA_EVENT.ADD_STUDENT
                        })
                        }, "+", "green"),
                    new Button(() => {
                        //same as above
                        back.classList.remove("empty")
                        back.disabled = false;
                        //remove current student
                        let student = this.manager.removeStudent(row.rowIndex)
                        history.push({
                            data:{
                                student: student, 
                                //a function instead of an index number on its own is required because the table might shrink, so the indices shift, 
                                //a new index must be calculated to fix this, it does this by checking the id's of students currently in the table (inserting the removed student back so that the id-s are sorted)
                                index: () => index - history.map(h => h.data.student)
                                            .filter(s => s && s.id < student.id).length
                            }, event:CONTRA_EVENT.REMOVE_STUDENT
                        })
                    }, "-", "red"),
                    new Button(() => {
                        //same as above
                        back.classList.remove("empty")
                        back.disabled = false;
                        this.manager.insertStudent(row.rowIndex)
                        history.push({
                            data: {
                                index: () => row.rowIndex + 1
                            }, event:CONTRA_EVENT.ADD_STUDENT
                        })
                    }, "+", "green")
                ], "vertical").get())

        function doesntContainButtonGroup(row) {
            return !row.lastChild.classList.contains("group")
        }
    }

    /**
     * Removes the student at the specified index from the <table> element which is the first child of the <div> containing everything
     */
    removeStudent(index) {
        this.get().firstChild.children[index].remove()
    }

    /**
     * Removes the assignment at the specified index from the <table> element which is the first child of the <div> containing everything
     */
    removeAssignment(index) {
        Array.from(this.get().firstChild.children).forEach(r => r.children[index].remove())
    }

    /**
     * updates the unsubmitted <p> to refresh the unsubmitted counter
     */
    updateUnsubmitted() {
        this.HTML && (this.HTML.lastChild.textContent = `Unsubmitted: ${this.manager.unsubmittedCount}`)
    }

    /**
     * Creates a row which holds the table headers
     * @returns the <tr> element containing the titles (<th>)
     */
    appendTableHeaders() {
        let node = document.createElement("tr")
        this.manager.header.forEach(title => this.createHeader(title, node))
        this.setAVGColumnListener(node)
        return node
    }

    /**
     * Sets a specific onclick listener for the avg column (not selectable but swaps avg views for %, american, letter)
     * @param {HTMLElement} node 
     */
    setAVGColumnListener(node) {
        node.lastElementChild.classList.replace("assignment", "avg")
        const GENERATOR = formatGenerator()
        node.lastElementChild.onclick = () => {
            Student.CURRENT_GRADE_FORMAT = GENERATOR.next().value
            this.manager.students.forEach(student => student.HTML.updateAverage())
            node.lastElementChild.textContent = `Average[${Student.CURRENT_GRADE_FORMAT}]`
        }
        
        /**
         * Generator which cycles through the views
         */
        function* formatGenerator () {
            let i = 0
            const GRADE_FORMATS = ["percent", "american", "gpa"]
            while(true)
                yield GRADE_FORMATS[i = i < GRADE_FORMATS.length - 1 ? i + 1 : 0]
        }
    }

    /**
     * Creates a new header with the specified title
     * @param {String} title title of the header element
     * @param {HTMLElement} node should be this.get().firstChild.firstChild (first row of the table)
     * @returns the <tr> containing the headers
     */
    createHeader(title, node) {
        if(!node) throw new Error("parent element not defined!")
        let header = document.createElement("th")
        node && node.appendChild(header)
        header.classList.add("header")
        //the reason for the <th> containing a <p> and a <div> is that the assignment headers contain both the title and the side buttons
        //because of this, a simple change to element.textConent deletes the buttons, so an extra layer had to be added to separate 
        //header text and the side buttons
        this.appendTitleParagraph(title, header)
        if(isAssignment(title)) {
            header.classList.add("assignment")
            //add header buttons to the <th> element if it is an assignment header
            header.appendChild(createButtons(this))
        }
        //sets the onclick function of the header (so it becomes selected, the select function takes care of the rest)
        header.onclick = (e) => select({
            element: header,
            parent: this.manager.students
            .map(s => s.HTML.get().children[Array.from(node.children).indexOf(header)]),
            clazz: "selectedColumn",
            lastClazz: "last"
        }, e)
        return header

        //creates the side button group for each assignment (much like the side buttons for the students above)
        //this follows the same principle
        //apply the funcitonality (say removing an element)
        //add the counter functionality, alongside relevant data to the history stack so that it gets reverted.
        function createButtons(me) {
            return new ButtonGroup(
                [
                    new Button(() => {
                        back.classList.remove("empty")
                        back.disabled = false;
                        let header = me.manager.insertAssignment(selected.element.cellIndex)
                        console.log("indexes " + header.cellIndex + " vs " + selected.element.cellIndex)
                        history.push({
                            data: {
                                index: () => header.cellIndex
                            },
                            event:CONTRA_EVENT.ADD_ASSIGNMENT
                        })
                    }, "+", "green"),
                    new Button(() => {
                        back.classList.remove("empty")
                        back.disabled = false;
                        let index = selected.element.cellIndex
                        history.push({
                            data:{
                                title: me.manager.header[index],
                                grades: me.manager.students.map(s => s.assignments[index - 2]),
                                index: () => index
                            }, 
                            event: CONTRA_EVENT.REMOVE_ASSIGNMENT
                        })
                        me.manager.removeAssignment(index)
                    }, "-", "red"),
                    new Button(() => {
                        back.classList.remove("empty")
                        back.disabled = false;
                        let header = me.manager.insertAssignment(selected.element.cellIndex + 1)
                        history.push({
                            data: {
                                index: () => header.cellIndex
                            },
                            event:CONTRA_EVENT.ADD_ASSIGNMENT
                        })
                }, "+", "green")
                ], "horizontal", "green").get()
        }

        function isAssignment(title) {
            return title !== "Name" && title !== "id" && title !== "Final Grade"
        }
    }

    appendTitleParagraph(title, header) {
        let p = document.createElement("p")
        p.textContent = title
        header.appendChild(p)
    }
}

/**
 * Student class containing the student model data and its relevant view (bad choice in the end I know)
 */
class Student {
    /**
     * Static ID field keeping track of students and updating so each new one is unique
     */
    static ID = 0
    /**
     * Keeps track of the current format of the table (this idealy should have been in the manager as a non static field)
     */
    static CURRENT_GRADE_FORMAT = "percent"
    /**
     * Enum containing the functions checking the range of the grade, 
     * and american/gpa formats at same indexes for easy transition form one to the other
     */
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
    /**
     * Creates a new student with the specified name.
     * @param {String} name 
     */
    constructor(name) {
        this.name = name || "-"
        this.assignments = []
        this.id = ++Student.ID
        this.HTML = new TableRow(this)
    }

    /**
     * Sets the grade of for the specified assignment (index)
     * @param {Number} assignmentNumber 
     * @param {Number} grade 
     * @returns 
     */
    setGrade(assignmentNumber, grade) {
        this.assignments[assignmentNumber] = grade === "-"? -1 : parseInt(grade)
        this.updateAverage()
        return this.HTML.setGrade(assignmentNumber, grade)
    }

    /**
     * Sets the name of the student
     * @param {String} name 
     */
    setName (name) {
        this.name = name
        this.HTML.updateName(name)
    }

    /**
     * Updates the average field for the student (used on input verification 
     * when the user presses ENTER, so that the average gets updated live)
     */
    updateAverage() {
        this.avg = this.calculateAvg()
        this.HTML.updateAverage()
    }

    /**
     * Sets the number of assignments the student should have (use at initialisation only)!
     * @param {Number} n 
     */
    setNumberOfAssignments(n) {
        for(let i = this.assignments.length ; i < n; i++)
            this.assignments.push(-1)
    }

    /**
     * Inserts a grade for a new assignment at the specified index (used when inserting new columns)
     * @param {Number} index 
     * @param {Number} grade 
     */
    insertAssignmentGrade (index, grade) {
        if(index === undefined) throw new Error("index is null")
        this.assignments.splice(index, 0, grade || -1)
        this.updateAverage()
    }

    /**
     * Removes a grade for an assignment at the specified index (used when removing assignment columns)
     * @param {Number} index 
     * @param {Number} grade 
     */
    removeAssignmentGrade (index) {
        if(index === undefined) throw new Error("index is null")
        this.assignments.splice(index, 1)
        this.updateAverage()
    }

    /**
     * Calculates the average grade of the student
     * @returns the average
     */
    calculateAvg() {
        let submitted = this.assignments.filter(i => i !== -1)
        //this ? x : undefined might seem a bit confusing, but the getGradeFormat() function uses
        // this property to check if the average should be a number or empty("-")
        return submitted.length !== 0 ? 
        Math.round(submitted.reduce((a, b) => a + b, 0) / this.assignments.length) : undefined
    }

    /**
     * 
     * @returns the average grade format specified in the CURRENT_GRADE_FORMAT static field.
     */
    getGradeFormat() {
        if(this.avg === undefined)
            return "-"
        if(Student.CURRENT_GRADE_FORMAT === "percent") 
        return this.avg + "%"
        //this bit here might be a bit confusing, what is happening is:
            // the loop goes through the GRADE_FORMAT enum 
            //(all properties have array of same length so it doesnt matter which is accessed)
            // if the grade view is not a percentage it loops through all the functions specified in the inRange property
            // if the avg value lies in one of them it returns its index, which corresponds to the right american or gpa grade.
            // (indexes are deliberately correspondant to each other)
        else
            for(let i = 0; i < Student.GRADE_FORMAT["inRange"].length; i++)
                if(Student.GRADE_FORMAT["inRange"][i](this.avg))
                    return Student.GRADE_FORMAT[Student.CURRENT_GRADE_FORMAT][i] || "-"
    }
}

/**
 * View of the student as a table row
 */
class TableRow {
    /**
     * Creates a table row based on the specified student
     * @param {Student} student 
     */
    constructor(student) {
        this.student = student
    }

    /**
     * 
     * @returns <tr> representation of the student
     */
    get() {
        return this.HTML || (this.HTML = this.getStudentAsTableRow())
    }

    /**
     * Updates the name cell in the table row when the student name changes
     * @param {String} name 
     */
    updateName(name) {
        if(!this.HTML) this.get()
        this.HTML.firstChild.textContent = name
    }

    /**
     * Updates the average (setting css functionality based on the assignment requirements)
     */
    updateAverage() {
        const avg = this.student.getGradeFormat()
        //reason why length - 2 is beacuse avg cell is the second last child.
        //the last child is the button group which corresponds to each row
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

    /**
     * Sets the grade cell at the specified index.
     * @param {Number} index  relative to student assignments array
     * @param {Number} grade 
     * @returns 
     */
    setGrade(index, grade) {
        let isEmpty = grade === "-"
        //reason for index + 2 is that the table has 2 cells and the assignments,
        //while the student assignments array counts only assignments (this method is relative to student, not the actual table)
        let cell = this.get().children[index + 2]
        cell.textContent = isEmpty? "-" : grade
        if(isEmpty && !cell.classList.contains("unsubmitted")) {
            cell.classList.replace("right", "centered")
            cell.classList.add("unsubmitted")
            return 1
        }
        else if(!isEmpty) {
            cell.classList.remove("centered")
            cell.classList.add("right")
            cell.classList.remove("unsubmitted")
            return -1
        }
        return 0
    }

    /**
     * Adds an assignment to this <tr> student representation
     * @param {Number} index position at which to add the assignment
     */
    addAssignments(index) {
        if(!this.HTML) this.get()
        const cell = this.createGradeCell(this.student.assignments[index - 2])
        this.HTML.insertBefore(cell, this.HTML.children[index])
    }

    /**
     * @returns the <tr> HTMLElement representing the current state of the student 
     * */
    getStudentAsTableRow() {
        let row = document.createElement("tr")
        this.appendNameAndID(row)
        this.appendGradeCells(row)
        this.appendAvgCell(row)
        return row
    }

    /**
     * Appends the name and id cell to the <tr> element
     * @param {HTMLElement} row 
     */
    appendNameAndID(row) {
        const name = this.createCell(this.student.name, "name", "centered")
        //sets the onclick function of the name element to be selected
        name.onclick = (e) => select({
            student: this.student, 
            element: name,
            //used for selection of the whole row
            parent: [row], 
            //class to be added to each element in the parent.children[]
            clazz: "selected"}, e)
        //create id cell
        const id = this.createCell(this.student.id)
        row.appendChild(name)
        row.appendChild(id)
    }
    /**
     * Creates a cell with the specified textContent and css classes
     * @param {String} text text content of cell
     * @param  {...String} classes css classes to be added to the cell
     * @returns the created <td> element 
     */
    createCell(text, ...classes) {
        let cell = document.createElement("td")
        classes.length && cell.classList.add(...classes)
        text && (cell.textContent = text)
        return cell
    }

    /**
     * append the avg cell to the <tr> representing this.student
     * @param {HTMLElement} row 
     */
    appendAvgCell(row) {
        const cell = document.createElement("td")
        cell.classList.add("avg")
        let avg = this.student.getGradeFormat()
        cell.classList.add(avg === "-" ? "centered" : "right")
        cell.textContent = avg
        row.appendChild(cell)
    }

    /**
     * Appends the student grades/assignment grades cells to the table row
     * @param {HTMLElement} row 
     */
    appendGradeCells(row) {
        this.student.assignments.forEach(grade => row.appendChild(this.createGradeCell(grade)))
    }

    /**
     * Creates a grade cell with the specified grade as text content
     * Modifies the cell with different css classes depending whether the grade exists or not
     * @param {Number} grade 
     * @returns the created grade cell
     */
    createGradeCell(grade) {
        let cell = document.createElement("td")
        cell.classList.add("number")
        if (grade !== -1)
            cell = this.asFilledCell(cell, grade)
        else
            cell = this.asEmptyCell(cell)
        //sets the cell on click so that only this cell gets selected
        cell.onclick = (e) => select({
            student:this.student, 
            element:cell, 
            clazz: "selected"}, e)
        return cell
    }
    /**
     * sets the text content of the specified cell to the grade + "%" and adds the .number class to it
     * @param {HTMLElement} cell 
     * @param {Number} grade 
     * @returns modified cell
     */
    asFilledCell(cell, grade) {
        cell.textContent = grade + "%"
        cell.classList.add("number")
        return cell
    }
    /**
     * sets the text content of the cell to empty (-) and adds the .centered and .unsubmitted classes to it.
     * @param {HTMLelement} cell 
     * @returns 
     */
    asEmptyCell(cell) {
        cell.textContent = "-"
        cell.classList.add("centered", "unsubmitted")
        return cell
    }
}

//main function just to separate non-global code at initialisation
function main () {
    //create new manager instance
    let manager = new StudentManager()
    //set the onclick function of the back button so it reverts whatever the user did in reverse
    back.onclick = () => {
        //if history is not empty
        if(history.length > 0) {
            //pop the top historical action
            let hist = history.pop()
            //apply the counter event to the data contained in the hist action
            hist.event(manager, hist.data)
        }
        if(history.length === 0) {
            back.classList.add("empty")
            back.disabled = true
        }
    }

    let reset = document.createElement("button")
    reset.textContent = "reset"
    reset.onclick = () => {
        //reinitialise the page on reset
        history = []
        manager.TABLE.get().remove()
        manager = new StudentManager()
        initUserController(manager)
        initStandardManager()
    }

    //add reset and back buttons, lastly add the manager table to the body (initStandardManager function)
    document.body.appendChild(reset)
    document.body.appendChild(back)
    initUserController(manager)
    initStandardManager()

    //add 5 students with predefined names each having 5 assignments
    function initStandardManager() {
        let names = ["Alanna Mcnally","Sahara Pope", "Lucille Potter", "Nathanael Bowen","Danial Ware"]
        for (let i = 0; i < 5; i++) {
            manager.addAssignment()
            manager.addStudent(new Student(names[i]))
        }
        
        document.body.appendChild(manager.TABLE.get())
    }
}

main()
const [, ...students] = document.getElementsByTagName("tbody")[0].children

function initInputs () {
    let l = students.map(s => s.children
        .filter(child => child.classList.include("input")))
    console.log(l)
}

initInputs();
const [, ...students] = document.getElementsByTagName("tbody")[0].children

function initInputs () { 
    let selected = undefined
    students.flatMap(s => Array.from(s.children)
        .filter(child => child.classList.contains("input")))
        .forEach(input => { 
        input.onclick = (e) => {
            selected && selected.classList.toggle("selected")
            input.classList.toggle("selected")
            selected = input;
        }
    })
    window.onkeydown = (e) => {
        let text = selected.innerText
        let key = e.key;
        if(key == "Backspace") {
            if(text != "")
                selected && (selected.innerText = text.substring(0, text.length - 1))
            else
                selected.innerText = "-"
        }
        else if(key.match(/^\w$/)) {
            if(text == "-")
                selected && (selected.innerText = key)
            else
                selected && (selected.innerText += key)
        }
        console.log(key)
    }
}

initInputs();
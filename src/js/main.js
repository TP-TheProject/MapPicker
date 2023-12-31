const maps = {
    "maps": [
        {
            "map": "Ascent",
            "path": "./src/img/ascent.png"
        },
        {
            "map": "Bind",
            "path": "./src/img/bind.png"
        },
        {
            "map": "Breeze",
            "path": "./src/img/breeze.png"
        },
        {
            "map": "Fracture",
            "path": "./src/img/fracture.png"
        },
        {
            "map": "Haven",
            "path": "./src/img/haven.png"
        },
        {
            "map": "Icebox",
            "path": "./src/img/icebox.png"
        },
        {
            "map": "Lotus",
            "path": "./src/img/lotus.png"
        },
        {
            "map": "Pearl",
            "path": "./src/img/pearl.png"
        },
        {
            "map": "Split",
            "path": "./src/img/slit.png"
        },
        {
            "map": "Sunset",
            "path": "./src/img/sunset.png"
        }
    ]
};

const selected_maps = {
    "maps": [
        {
            "name": "Ascent",
            "path": "./src/img/ascent.png"
        },
        {
            "name": "Bind",
            "path": "./src/img/bind.png"
        },
        {
            "name": "Breeze",
            "path": "./src/img/breeze.png"
        },
        {
            "name": "Fracture",
            "path": "./src/img/fracture.png"
        },
        {
            "name": "Haven",
            "path": "./src/img/haven.png"
        },
        {
            "name": "Icebox",
            "path": "./src/img/icebox.png"
        },
        {
            "name": "Lotus",
            "path": "./src/img/lotus.png"
        },
        {
            "name": "Split",
            "path": "./src/img/split.png"
        },
        {
            "name": "Sunset",
            "path": "./src/img/sunset.png"
        }
    ]
};

let selectedCount = 0;

function toggleGray(element) {
    if (element.classList.contains("green")) {
        element.classList.toggle("green");
        selectedCount--;
        removeNumber(element);
    }
    element.classList.toggle("gray");
}

function toggleGreen(element) {
    if (element.classList.contains("gray")) {
        element.classList.toggle("gray");
    }
    element.classList.toggle("green");

    if (element.classList.contains("green")) {
        selectedCount++;
        addNumber(element, selectedCount);
    } else {
        selectedCount--;
        removeNumber(element);
    }
}

function addNumber(element, number) {
    const numberElement = document.createElement('div');
    numberElement.classList.add('number');
    numberElement.textContent = number;
    element.appendChild(numberElement);
}

function removeNumber(element) {
    const numberElement = element.querySelector('.number');
    if (numberElement) {
        element.removeChild(numberElement);
    }
}

function addMaps(){
    grids = document.getElementsByClassName("grid")[0];

    grids.innerHTML = ``;

    for(i in selected_maps.maps){

        grids.innerHTML += `
            <div class="grid-item" data-key="${parseInt(i)+1}" onclick="toggleGreen(this)">
                <h1>${selected_maps.maps[i].name}</h1>
                <img src="${selected_maps.maps[i].path}" alt="${selected_maps.maps[i].name}">
            </div>
        `;
    };

}

addMaps();

document.addEventListener('keydown', function(event) {
    const key = event.key;
    const gridItem = document.querySelector(`.grid-item[data-key="${key}"]`);
    
    if (gridItem) {
        toggleGray(gridItem);
    }
});
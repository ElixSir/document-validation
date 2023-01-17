let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('file-upload'); 

inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

// lancement de la fonction main lorsqu'une image est upload par l'user
imgElement.onload = function() {
    main();
}

async function main() {
    let button_valide = document.getElementById('valide');
    src = cv.imread(imgElement);

    try {
        image_output = contourDetection(src);
        await checkingParasitingObjects(image_output);
        scoring();
        
    } catch (error) {
        console.error("La photo n'est pas valide.");
        button_valide.textContent = "La photo n'est pas valide";
    }
}
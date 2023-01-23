let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('file-upload'); 
let button_valide = document.getElementById('valide');


inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

// lancement de la fonction main lorsqu'une image est upload par l'user
imgElement.onload = function() {
    main();
}

async function main() {
    src = cv.imread(imgElement);

    try {
        image_output = contourDetection(src);
    } catch (error) {
        console.error(error);
        console.error("La photo n'est pas valide. Erreur à l'étape de détection des contours.");
        button_valide.textContent = "La photo n'est pas valide";
    }
    try {
        await checkingParasitingObjects(image_output);
    } catch (error) {
        console.error(error);
        console.error("La photo n'est pas valide. Erreur à l'étape de détection des objets parasites.");
        button_valide.textContent = "La photo n'est pas valide";
    }
    try {
        scoring()
    } catch (error) {
        console.error(error);
        console.error("La photo n'est pas valide. Erreur à l'étape de scoring.");
        button_valide.textContent = "La photo n'est pas valide";
    }
    try {
        FaceDocumentDetection();
    } catch (error) {
        console.error(error);
        console.error("La photo n'est pas valide. Erreur à l'étape de détection du visage.");
        button_valide.textContent = "La photo n'est pas valide";
    }
    try {
        faceComparison();
    } catch (error) {
        console.error(error);
        console.error("La photo n'est pas valide. Erreur à l'étape de comparaison du visage.");
        button_valide.textContent = "La photo n'est pas valide";
    }
}
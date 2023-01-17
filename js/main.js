let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('file-upload'); 

inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

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
        console.error("la photo n'est pas valide");
        console.error(error);
        button_valide.textContent = "La photo n'est pas valide";
    }

}
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
    try {
        image_output = contourDetection();
        await checkingParasitingObjects(image_output);
        scoring();
        
    } catch (error) {
        console.error("La photo n'est pas valide.");
        button_valide.textContent = "La photo n'est pas valide";
    }
}

function scoring() {
    let process_sprint1 = pyodideGlobals.get('_processing'); // get main function 
    final_canvas = document.getElementById('canvasOutput12'); // get the canva 

    final_canvas.toBlob((blob) => { 
        let file = new File([blob], "image_processed_after_sprint2.jpg", { type: "image/jpeg" }); // convert canva to file
        process_sprint1(file);
    }, 'image/jpeg'); // convert canva to blob
}

function createObject(object, variableName) {
    // Bind a variable whose name is the string variableName
    // to the object called 'object'
    let execString = variableName + " = object"
    console.log("Running `" + execString + "`");
    eval(execString)
}

function resetOutput() {
    // Function used in python file
    // Clear the results of quality estimation 
    document.getElementById('output_estimation').innerHTML = "";
    document.getElementById('output_exec_time').innerHTML = "";
    document.getElementById('output_qualite').innerHTML = "";
    if (document.getElementById("output_upload").firstChild) {
        document.getElementById("output_upload").removeChild(document.getElementById("output_upload").firstChild);
    } 
}
const MODEL_URL = './models' //model directory
const SCOREMIN = 0.56;

const SELFIE_THRESHOLD_PC = 0.65;
const SELFIE_THRESHOLD_MOBILE = 0.7;
const LIMIT_DETECTION=3;
const RATIO_DISPLAY_MOBILE = 1.8;
const RATIO_DISPLAY_PC = 1.2;
const MSG1 = "Positionnez votre visage dans le cadre";
const MSG2 = "Le cercle sera entouré en vert, veuillez ne plus bouger pour effectuer la capture";
let faceImageVideoDetector;
let faceIDCardDetector
let faceImageInputDetector;


function FaceDocumentDetection() {
    let canvasFinal = document.getElementById('canvasSourceResized');
    let idImage = "image_face_recognition";
    let idCanvas = "canvas_face_recognition";
    let idDiv = "face_detection";

    var image = document.createElement("img");
    image.setAttribute("src", canvasFinal.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    image.setAttribute("id", idImage);
    document.getElementById(idDiv).appendChild(image);
    image.hidden = true;

    var canvas = document.createElement("CANVAS");
    canvas.setAttribute("id", idCanvas);
    document.getElementById(idDiv).appendChild(canvas);
    canvas.hidden = true;

    faceIDCardDetector = new FaceDocumentDetector({param1: idImage, param2: idCanvas}, idDiv);
}

function faceComparison() {
    let idDiv = "face_comparison";
    let idImage = "image_face_comparison_input";
    let idCanvas = "canvas_face_comparison_input";
    let idInput = "input_selfie";
    
    var image = document.createElement("img");
    image.setAttribute("id", idImage);
    document.getElementById(idDiv).appendChild(image);
    image.hidden = true;

    var canvas = document.createElement("CANVAS");
    canvas.setAttribute("id", idCanvas);
    document.getElementById(idDiv).appendChild(canvas);
    canvas.hidden = true;

    faceImageInputDetector = new FaceDocumentDetector({param1: idImage, param2: idCanvas, param3: idInput}, idDiv);

    faceImageVideoDetector = new FaceWebcamDetector(); 
};

function compareFaces() {
    let idCardFacedetection = faceIDCardDetector.faceDescriptor;
    let selfieVideodetection;
    if(faceImageVideoDetector.selfie != undefined)
    {
        selfieVideodetection = faceImageVideoDetector.selfie.faceDescriptor;
    }
    let selfieInputDetection = faceImageInputDetector.faceDescriptor;
    let threshold = 0.55;
    //Il faut mettre avant le cas où l'image est prise par l'input car la webcam a quasiment toujours une valeur faceDescriptor
    if(idCardFacedetection && selfieInputDetection) {
        const distance = faceapi.euclideanDistance(idCardFacedetection, selfieInputDetection);
        document.getElementById("score_comparaison").innerHTML = distance;
        faceImageVideoDetector.clearOutput();
        document.getElementById("video_selfie_text").innerHTML = "";
        if(distance > threshold) {
            document.getElementById("final-result").innerHTML = "Utilisateur non reconnu sur la photo d'identité ❌";
        }
        else {
            document.getElementById("final-result").innerHTML = "Utilisateur reconnu sur la photo d'identité ✅";
        }
    }
    else if(idCardFacedetection && selfieVideodetection) {
        const distance = faceapi.euclideanDistance(idCardFacedetection, selfieVideodetection);
        document.getElementById("score_comparaison").innerHTML = distance;
        faceImageVideoDetector.clearOutput();
        document.getElementById("input_selfie_text").innerHTML = "";
        if(distance > threshold) {
            document.getElementById("final-result").innerHTML = "Utilisateur non reconnu sur la photo d'identité ❌";
        }
        else {
            document.getElementById("final-result").innerHTML = "Utilisateur reconnu sur la photo d'identité ✅";
        }
    }
}
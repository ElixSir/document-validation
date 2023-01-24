//const MODEL_URL = './models' //model directory GIT
//const MODEL_URL = '/faceapi.js/models';

const SELFIE_THRESHOLD_PC = 0.65;
const SELFIE_THRESHOLD_MOBILE = 0.7;
const LIMIT_DETECTION=3;
const MSG1 = "Positionnez votre visage dans le cadre";
const MSG2 = "Le cercle sera entouré en vert, veuillez ne plus bouger pour effectuer la capture";
let faceImageDetector;

function faceComparison() {
    //document.querySelector('input[type="file"]').style.display ="none";
    faceImageDetector = new FaceWebcamDetector(); 
};

function compareFaces()
{
    let idCardFacedetection = faceIDCardDetector.faceDescriptor;
    let selfieFacedetection = faceImageDetector.faceDescriptor;
    if(idCardFacedetection && selfieFacedetection){
        // Using Euclidean distance to comapare face descriptions
        const distance = faceapi.euclideanDistance(idCardFacedetection, selfieFacedetection);
        document.getElementById("score_comparaison").innerHTML = "Score : " + distance;
      }
}

class FaceWebcamDetector{

    resolutionWidthWindow;
    resolutionHeightWindow;
    videoInput;
    videoTrack;
    detector;
    canvas;
    faceDescriptor;
    isValidate;


    detection;
    detectionArray;
    resizedDetections;

    idAnimationFrame; //Not canvas stream from webcam 
    idAnimationFrameStream = 0;

    selfie;

    isNavigatorMobile;


    constructor(){
        this.loadModels().then(this.captureSelfie.bind(this));
    };

    async loadModels(){
        //await faceapi.loadMtcnnModel(MODEL_URL);
        await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
        //await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL); // model to detect face landmark
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
    }

    async pretrainDetector(){
        const image = new Image();
        image.src = "/faceapi.js/images/1.jpg";
        const detection = await faceapi.detectSingleFace(image, this.detector);
        console.log("image");
        console.log(detection);
    }

    async captureSelfie(){

        this.detector = new faceapi.TinyFaceDetectorOptions();

        //this.pretrainDetector();

        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            // The user is on a mobile device
            this.isNavigatorMobile=true;
        } else {
            // The user is not on a mobile device
            this.isNavigatorMobile=false;
        }

        this.videoInput = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        
        console.log(navigator.mediaDevices.enumerateDevices());

        navigator.mediaDevices.getUserMedia(
            { video: {}, audio: false })
            .then( (stream) => {

                navigator.mediaDevices.enumerateDevices()
                    .then( function (devices) {

                        const videoDevices = devices.filter(device => device.kind === 'videoinput' && device.getCapabilities().facingMode[0]=="user");
                        
                        if(videoDevices.length>0){
                           
                            this.videoTrack = stream.getVideoTracks()[0];
                            // Get the webcam's resolution
                            this.resolutionWidthWindow = this.videoTrack.getSettings().width;
                            this.resolutionHeightWindow = this.videoTrack.getSettings().height;
                            
                            this.videoInput.width = this.videoTrack.getSettings().width;
                            this.videoInput.height = this.videoTrack.getSettings().height;
                            this.canvas.width = this.resolutionWidthWindow;
                            this.canvas.height = this.resolutionHeightWindow;

                            this.drawSomethingCanvas("Veuillez patienter, votre caméra est en cours de configuration");

                            this.videoInput.style.display ='none'
                            if ('srcObject' in video) {
                                this.videoInput.srcObject = stream;
                            } else {
                                this.videoInput.src = URL.createObjectURL(stream);
                            }
                            console.log(this.selfie);
                            this.pretrainDetector();
                            this.videoInput.onloadedmetadata = async () => {
                                
                                this.detectFaceSelfie();
                                this.videoInput.play();
                            }
                        }
                        else{
                            alert("Aucune caméra frontale détectée, veuillez déposer un selfie au format JPEG/PNG");
                            document.getElementById("input_selfie").style.display ="block";
                        }
                    }.bind(this));
                
                
            })
            .catch((error) =>  console.error(error));
    }

    
    validate(){
        console.log("validate");
        console.log(this.isNavigatorMobile);
        

        if( this.resizedDetections && this.resizedDetections.length==1 &&
            this.resizedDetections[0].landmarks.positions[0].x >= (this.videoInput.width/2-this.videoInput.height/3) &&
            this.resizedDetections[0].landmarks.positions[16].x <= (this.videoInput.width/2+this.videoInput.height/3) &&
            this.resizedDetections[0].landmarks.positions[8].y <= (this.videoInput.height/2+this.videoInput.width/3) &&
            this.resizedDetections[0].landmarks.positions[0].x <= (this.videoInput.width/2-this.videoInput.height/6) &&
            this.resizedDetections[0].landmarks.positions[16].x >= (this.videoInput.width/2+this.videoInput.height/6)
            //TODO : check eyes
            ){
            this.isValidate = true;
            return 1;
        } 
        this.isValidate = false;
        return 0;
    }
    
    async detectFaceSelfie(){
        
        document.querySelector("video").addEventListener('playing', async () => {

            this.detectionArray = new Array();

            let first=true;
            

            let interval = setInterval( async () => {

                let object1 = new Map();

                let displaySize = {
                    width: this.videoInput.width,
                    height: this.videoInput.height,
                };
                
                this.detection = await faceapi.detectAllFaces(this.videoInput, this.detector).withFaceLandmarks().withFaceDescriptors();
                console.log(this.detection);
                this.resizedDetections = faceapi.resizeResults(
                    this.detection,
                    displaySize
                );

                if(!first){
                    cancelAnimationFrame(this.idAnimationFrame);
                    this.drawVideoCanvas();
                }
                else{
                    first=false;
                }

                //console.log(resizedDetections);


                if(this.resizedDetections && this.resizedDetections.length==1){

                    let frame_height_selfie = this.resizedDetections[0].detection._box._height
                    let frame_width_selfie = this.resizedDetections[0].detection._box._width
                    let frame_x_selfie = this.resizedDetections[0].detection._box._x
                    let frame_y_selfie = this.resizedDetections[0].detection._box._y
                    let score_selfie = this.resizedDetections[0].detection._score;
                    this.faceDescriptor = this.resizedDetections[0].descriptor;
                    
                    let properties ={
                        x:frame_x_selfie,
                        y:frame_y_selfie,
                        width:frame_width_selfie,
                        height:frame_height_selfie
                    }
        
                        
                    if(score_selfie>= (this.isNavigatorMobile?SELFIE_THRESHOLD_MOBILE:SELFIE_THRESHOLD_PC) && await this.validate()){
                        //console.log(score_selfie);
                    
                        let base64   = await this.cropFace(properties);
                
                        object1.set("score", score_selfie);
                        object1.set("base64", base64);
                        this.detectionArray.push( Object.fromEntries(object1));
                        object1.clear();
        
                    }
                    else{
                        
                        this.detectionArray.splice(0,this.detectionArray.length);
                    }
                }
                else{
                   
                    this.detectionArray.splice(0,this.detectionArray.length);      
                }


                if(this.detectionArray.length==LIMIT_DETECTION){
                                               
                    clearInterval(interval);

                    console.log(this.detectionArray);
                                        
                    this.selfie = this.chooseSelfie();
                    console.log(this.selfie);   
                    
                    this.videoTrack.stop();
                    cancelAnimationFrame(this.idAnimationFrameStream);      
                    this.clearCanvas();
                    this.showSelfie();
                    
                }

            }, 2000);

        });
    }




    chooseSelfie(){
        let image = new Object();
        image.score = 0;
        for(let i=0; i<this.detectionArray.length; i++){
            if(this.detectionArray[i].score > image.score){
                image = this.detectionArray[i];
            }
        }
        return image;
    }

    showSelfie(){
        let htmlImg =document.createElement("img");
        htmlImg.src = this.selfie.base64;
        document.getElementById('div').appendChild(htmlImg);

        //ici exécuter comparaison avec la photo de l'identité
        compareFaces();
    }

    async drawVideoCanvas(){

        const loop = () => {
                
            let ctx = this.canvas.getContext('2d');
                
            const maskCanvas = document.createElement("canvas");
            const maskCtx = maskCanvas.getContext("2d");
                
            maskCanvas.width = this.videoInput.width;
            maskCanvas.height = this.videoInput.height;
                
            maskCtx.rect(0,0, this.canvas.width, this.canvas.height);
            maskCtx.fillStyle = 'rgba(0,0,0,0.5)';
            maskCtx.fill();

                    
            maskCtx.globalCompositeOperation = 'destination-out';

            let radiusX; let radiusY;
                 
            if(this.isNavigatorMobile){
                radiusX = this.videoInput.height;
                radiusY = this.videoInput.width;
            }
            else{
                radiusX = this.videoInput.width;
                radiusY = this.videoInput.height;
            }
                
            maskCtx.beginPath();
            maskCtx.ellipse(this.videoInput.width/2, this.videoInput.height/2, radiusY/3, radiusX/3, 0, 0, 2 * Math.PI);
            maskCtx.lineWidth = 2;
            maskCtx.fillStyle = 'red';
            maskCtx.fill();
            maskCtx.closePath();
                
            const maskCanvas2 = document.createElement("canvas");
            const maskCtx2 = maskCanvas2.getContext("2d");
                
            maskCanvas2.width = this.videoInput.width;
            maskCanvas2.height = this.videoInput.height;

                
                //maskCtx2.beginPath();
            maskCtx2.ellipse(this.videoInput.width/2, this.videoInput.height/2, radiusY/3, radiusX/3, 0, 0, 2 * Math.PI);
            maskCtx2.lineWidth = 2;
                
            if(this.isValidate && this.resizedDetections && this.resizedDetections.length>0){
                maskCtx2.strokeStyle = 'green';
            }
            else{
                maskCtx2.strokeStyle = 'white';
            }
            maskCtx2.stroke();

    
                
            ctx.drawImage(this.videoInput, 0, 0, this.videoInput.width, this.videoInput.height);
            ctx.drawImage(maskCanvas, 0, 0, this.videoInput.width, this.videoInput.height);
            ctx.drawImage(maskCanvas2, 0, 0, this.videoInput.width, this.videoInput.height);
                
            requestAnimationFrame(loop);
        };
        if(this.idAnimationFrameStream==0){
            this.idAnimationFrameStream= requestAnimationFrame(loop);
            console.log(this.idAnimationFrameStream);
        }
    }

    drawSomethingCanvas(text){
        console.log(text);
        let type="init";

        const loop = () => {

            console.log(text);
            let ctx = this.canvas.getContext('2d');

            if(type=="init"){
                ctx.rect(0, 0, this.videoInput.width, this.videoInput.height);
                ctx.fillStyle = 'black';
                //ctx.globalAlpha = 0.5;
                ctx.fill();
                ctx.fillText(text, 10, 10);
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.fillText(text, 50, 50);


          
                
                    
            }
            
            
            //
            //.drawImage(, 0, 0, this.videoInput.width, this.videoInput.height);
            this.idAnimationFrame = requestAnimationFrame(loop);
        };
        this.idAnimationFrame = requestAnimationFrame(loop);
    }

    clearCanvas(){
              
        this.canvas.getContext('2d').clearRect(0,0, this.resolutionWidthWindow, this.resolutionHeightWindow);
        this.canvas.style.display = "none";
    }

    async cropFace(properties){

        if(properties && properties.x && properties.y && properties.width && properties.height){
           
            let canvas2 = document.createElement('canvas');
            canvas2.height =properties.height;
            canvas2.width = properties.width;
            let ctx2 = canvas2.getContext('2d');
            ctx2.drawImage(this.videoInput, properties.x, properties.y, properties.width, properties.height, 0, 0, properties.width, properties.height);
            let base64 = canvas2.toDataURL('image/png');
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

            return base64;
        }
        return null;
    }
    
}
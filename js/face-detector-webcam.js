class FaceWebcamDetector {
    resolutionWidthWindow;  //taille de la fenêtre de diffusion utilisateur flux video longueur
    resolutionHeightWindow; //taille de la fenêtre de diffusion utilisateur flux video hauteur

    videoInput; //Flux pour la détection
    videoTrack; //Flux en sortie caméra

    detector; //Modèle ML de détection de visage
    canvas; //

    isValid; //Booleen indiquant succes/echec de la 
    isNavigatorMobile;

    detection; //Detection en sortie flux webcam
    resizedDetections; //

    detectionArray; //tableau contenant les selfies (intégrité)
    selfie; //selfie final 

    idAnimationFrame; //Not canvas stream from webcam 
    idAnimationFrameStream = 0;

    constructor() {
        this.loadModels().then(this.captureSelfie.bind(this));
    };

    async loadModels() {
        //await faceapi.loadMtcnnModel(MODEL_URL);
        await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
        //await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL); // model to detect face landmark
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
    }

    async pretrainDetector() {
        const image = new Image();
        image.src = "/faceapi.js/images/1.jpg";
        const detection = await faceapi.detectSingleFace(image, this.detector);
        console.log("image");
        console.log(detection);
    }

    async captureSelfie() {

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
                        
                        if(videoDevices.length>0) {
                            const ratio = (this.isNavigatorMobile)?RATIO_DISPLAY_MOBILE:RATIO_DISPLAY_PC;
                            //Si plusieurs caméra frontale, on choisit la première disponible
                            this.videoTrack = stream.getVideoTracks()[0];
                            // Get the webcam's resolution
                            this.resolutionWidthWindow = this.videoTrack.getSettings().width * ratio;
                            this.resolutionHeightWindow = this.videoTrack.getSettings().height * ratio;
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
                        else {
                            alert("Aucune caméra frontale détectée, veuillez déposer un selfie au format JPEG/PNG");
                            //document.getElementById("input_selfie").style.display ="block";
                        }
                    }.bind(this));
                
                
            })
            .catch((error) =>  console.error(error));
    }

    validate(){
        
        const score = (this.isNavigatorMobile)?SELFIE_THRESHOLD_MOBILE:SELFIE_THRESHOLD_PC;
        
        if( this.resizedDetections && this.resizedDetections.length==1)
        {
            
            let minX0 = this.resolutionWidthWindow/2-this.resolutionHeightWindow/3;
            let maxX0 = (this.resolutionWidthWindow/2-this.resolutionHeightWindow/8);
            
            let minX16 = this.resolutionWidthWindow/2+this.resolutionHeightWindow/8;
            let maxX16 = this.resolutionWidthWindow/2+this.resolutionHeightWindow/3;

            let minY8  = this.resolutionHeightWindow/2+this.resolutionWidthWindow/8;
            let maxY8 = this.resolutionHeightWindow/2+this.resolutionWidthWindow/3;
            

            if(
                this.resizedDetections[0].landmarks.positions[0].x >= minX0 &&
                this.resizedDetections[0].landmarks.positions[16].x <= maxX16 &&
                this.resizedDetections[0].landmarks.positions[8].y <= maxY8 &&
                this.resizedDetections[0].landmarks.positions[8].y >= minY8 &&
                this.resizedDetections[0].landmarks.positions[0].x <= maxX0 &&
                this.resizedDetections[0].landmarks.positions[16].x >= minX16 
                &&
                this.resizedDetections[0].detection.score >= score
            
                //More precision : check position eyes, nose, mouth
            ){
                this.isValid = true;
                return 1;
            }
        } 
        this.isValid = false;
        return 0;
    }
    
    async detectFaceSelfie() {
        document.querySelector("video").addEventListener('playing', async () => {
            this.detectionArray = new Array();
            let first=true;
            
            this.interval = setInterval( async () => {
                let object1 = new Map();
                //Détection visage flux vidéo et remise à l'échelle selon la taille de l'affichage utilisateur (canvas) 
                this.detection = await faceapi.detectAllFaces(this.videoInput, this.detector).withFaceLandmarks().withFaceDescriptors();
                 let displaySize = {
                    width: this.resolutionWidthWindow,
                    height: this.resolutionHeightWindow
                };
                this.resizedDetections = faceapi.resizeResults(
                    this.detection,
                    displaySize
                );

                if(!first) {
                    cancelAnimationFrame(this.idAnimationFrame);
                    this.drawVideoCanvas();

                    //console.log(resizedDetections);

                    if(this.resizedDetections && this.resizedDetections.length==1) {
                        let frame_height_selfie = this.detection[0].detection._box._height
                        let frame_width_selfie = this.detection[0].detection._box._width
                        let frame_x_selfie = this.detection[0].detection._box._x
                        let frame_y_selfie = this.detection[0].detection._box._y
                        let score_selfie = this.detection[0].detection._score;
                        
                        let properties = {
                            x:frame_x_selfie,
                            y:frame_y_selfie,
                            width:frame_width_selfie,
                            height:frame_height_selfie
                        }
            
                        if(await this.validate()) {
                            //console.log(score_selfie);
                        
                            let base64   = await this.cropFace(properties);
                            if(base64 != null) {
                                object1.set("score", score_selfie);
                                object1.set("base64", base64);
                                object1.set("faceDescriptor", this.resizedDetections[0].descriptor);
                                this.detectionArray.push( Object.fromEntries(object1));
                                object1.clear();
                            }
                        }
                        else {
                            this.detectionArray.splice(0,this.detectionArray.length);
                        }
                    }
                    else {
                        this.detectionArray.splice(0,this.detectionArray.length);      
                    }


                    if(this.detectionArray.length==LIMIT_DETECTION) {
                        //console.log(this.detectionArray);
                        this.selfie = this.chooseSelfie();
                        //console.log(this.selfie);     
                        this.showSelfie();         
                        this.clearOutput();
                        document.getElementById('input_selfie').style.display ="none";
                        
                    }
                }
                else {
                    first=false;
                }

                

            }, 2000);

        });
    }

    clearOutput() {
        clearInterval(this.interval);
        console.log('this.videoTrack', this.videoTrack)
        if(this.videoTrack != undefined) {
            console.log('hey');
            this.videoTrack.stop();
        }
        cancelAnimationFrame(this.idAnimationFrameStream);      
        this.clearCanvas();
    }

    //Choisir le selfie avec le score le plus élevé parmis ceux stockés
    chooseSelfie() {
        let image = new Object();
        image.score = 0;
        for(let i=0; i<this.detectionArray.length; i++) {
            if(this.detectionArray[i].score > image.score) {
                image = this.detectionArray[i];
            }
        }
        return image;
    }

    showSelfie() {
        let htmlImg =document.createElement("img");
        htmlImg.src = this.selfie.base64;
        document.getElementById('div').appendChild(htmlImg);

        //ici exécuter comparaison avec la photo de l'identité
        compareFaces();
    }

    async drawVideoCanvas(){

        const loop = () => {
            
            let ctx = this.canvas.getContext('2d');

            //Tracé de l'ellipse est inversé selon le type d'écran portrait/paysage
            let radiusX; let radiusY;
            if(this.isNavigatorMobile){
                radiusX = this.resolutionHeightWindow;
                radiusY = this.resolutionWidthWindow;
            }
            else{
                radiusX = this.resolutionWidthWindow;
                radiusY = this.resolutionHeightWindow;
            }

            //Dessin de l'ellipse de la zone de positionnement du visage
            const maskCanvas = document.createElement("canvas");
            const maskCtx = maskCanvas.getContext("2d");
                
            maskCanvas.width = this.resolutionWidthWindow;
            maskCanvas.height = this.resolutionHeightWindow;
                
            maskCtx.rect(0,0, this.canvas.width, this.canvas.height);
            maskCtx.fillStyle = 'rgba(0,0,0,0.5)';
            maskCtx.fill();

                    
            maskCtx.globalCompositeOperation = 'destination-out';

            maskCtx.beginPath();
            maskCtx.ellipse(this.resolutionWidthWindow/2, this.resolutionHeightWindow/2, radiusY/3, radiusX/3, 0, 0, 2 * Math.PI);
            maskCtx.lineWidth = 2;
            maskCtx.fillStyle = 'red';
            maskCtx.fill();
            maskCtx.closePath();


            //Dessin de l'elipse de validation (contour vert si visage valide)    
            const maskCanvas2 = document.createElement("canvas");
            const maskCtx2 = maskCanvas2.getContext("2d");
                
            maskCanvas2.width = this.resolutionWidthWindow;
            maskCanvas2.height = this.resolutionHeightWindow;

            maskCtx2.ellipse(this.resolutionWidthWindow/2, this.resolutionHeightWindow/2, radiusY/3, radiusX/3, 0, 0, 2 * Math.PI);
            maskCtx2.lineWidth = 2;
                
            if(this.isValid && this.resizedDetections && this.resizedDetections.length>0){
                maskCtx2.strokeStyle = 'green';
            }
            else{
                maskCtx2.strokeStyle = 'white';
            }
            maskCtx2.stroke();

            //Génération flux vidéo et des filtres sur le flux vidéo à l'écran
            ctx.drawImage(this.videoInput, 0, 0, this.resolutionWidthWindow, this.resolutionHeightWindow);
            ctx.drawImage(maskCanvas, 0, 0, this.resolutionWidthWindow, this.resolutionHeightWindow);
            ctx.drawImage(maskCanvas2, 0, 0, this.resolutionWidthWindow, this.resolutionHeightWindow);
                
            requestAnimationFrame(loop);
        };
        if(this.idAnimationFrameStream==0){
            this.idAnimationFrameStream= requestAnimationFrame(loop);
            console.log(this.idAnimationFrameStream);
        }
    }

    /**
     *  Dessiner sur l'écran d'affichage sans flux vidéo
     * */
    drawSomethingCanvas(text, type="init"){ 

        const loop = () => {

            let ctx = this.canvas.getContext('2d');

            if(type=="init"){

                //Fond
                ctx.rect(0, 0, this.resolutionWidthWindow, this.resolutionHeightWindow);
                ctx.fillStyle = 'black';
                ctx.fill();
    
                //Texte
                let textWidth = ctx.measureText(text).width;
                console.log(textWidth); 
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.fillText(text, (this.resolutionWidthWindow-textWidth)/2, (this.resolutionHeightWindow-20)/2);
            
     
            }
            
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
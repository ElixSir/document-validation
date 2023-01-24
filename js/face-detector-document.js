class FaceDocumentDetector {
    img; 
    canvas;
    result_id;
    faceDescriptor;
    imgCropped;
    imgCroppedLarge;

    constructor(options, resultat_id) {
        let img_id = options.param1 || 'default value';
        let canvas_id = options.param2 || 'default value';
        let input_id = options.param3 || 'default value';

        this.result_id = resultat_id;
        this.img = document.getElementById(img_id); 
        this.canvas = document.getElementById(canvas_id);
        if(input_id == 'default value') {

            this.loadModels().then( () => this.handleFileUpload());
        }
        else {
            let input = document.getElementById(input_id);
            input.addEventListener('change', this.handleFileUploadInput.bind(this));
            this.loadModels();
        }
    }

    handleFileUpload() {
        //this.clearCroppedFace();
        this.loadImage(this.img.src).then( () => this.detectFaces());
    }

    handleFileUploadInput(event) {
        if(event.target.files.length>0) {
            let file = event.target.files[0];
            //this.clearCroppedFace();
            this.loadImage(URL.createObjectURL(file)).then( () => this.detectFaces());
        }
    }

    async loadModels() {
        await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL); // model to detect face landmark
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
    }

    async loadImage(url) {
        const image = new Image();
        image.src = url;
        this.img.src = url;
        image.onload = async () => {
            this.img.width = image.width;
            this.img.height = image.height;
        };
    }

    async detectFaces() {
        /* Detection */
        let fullFaceDescriptions = await faceapi.detectAllFaces(this.img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

        if(fullFaceDescriptions && fullFaceDescriptions.length==1) {
            //this.showIdCardCanvas();

            //Check la qualité de la détection
            if(fullFaceDescriptions[0].detection._score && fullFaceDescriptions[0].detection._score >= SCOREMIN) {
                let faceIdX = fullFaceDescriptions[0].detection._box._x;
                let faceIdY = fullFaceDescriptions[0].detection._box._y;
                let faceIdWidth = fullFaceDescriptions[0].detection._box._width;
                let faceIdHeight = fullFaceDescriptions[0].detection._box._height;
                this.faceDescriptor = fullFaceDescriptions[0].descriptor;

                let properties = {
                    x: faceIdX,
                    y: faceIdY,
                    width: faceIdWidth,
                    height: faceIdHeight
                }
                this.imgCropped = await this.cropFace(properties);
                this.showCroppedFace(this.imgCropped);


                let ratioHW = faceIdHeight/faceIdWidth;
                let ratioWH = faceIdWidth/faceIdHeight;
                
                //TODO A recalibrer
                if(ratioHW<1 && ratioWH<1) {
                    properties.x = faceIdX*ratioWH;
                    properties.y = faceIdY*ratioWH;
                    properties.width = faceIdWidth*ratioHW;
                    properties.height =  faceIdHeight*ratioHW;
                
                    this.imgCroppedLarge = await this.cropFace(properties);
                    this.showCroppedFace(this.imgCroppedLarge);
                }

                //Affichage final
                let score = fullFaceDescriptions[0].detection._score;
                console.log(score);
                if(score>SCOREMIN) {
                    document.getElementById("score").textContent = score;
                    document.getElementById("resultat_face_detection").textContent = "Face detected";
                    console.log("Face detected");
                    compareFaces();
                    return;
                }
            }
        }
        document.getElementById("resultat_face_detection").textContent = "Face not detected";
        throw new Error("La photo n'est pas valide. Erreur à l'étape de détection du visage.");
    }

    async cropFace(properties) {
        if(properties && properties.x && properties.y && properties.width && properties.height) {
            let canvas2 = document.getElementById("canvas_face_recognition");
            canvas2.height =properties.height;
            canvas2.width = properties.width;
            let ctx2 = canvas2.getContext('2d');
            ctx2.drawImage(this.img, properties.x, properties.y, properties.width, properties.height, 0, 0, properties.width, properties.height);
            let base64 = canvas2.toDataURL('image/png');
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

            return base64;
        }
        return null;
    }

    async showIdCardCanvas() {
        console.log(this.img)
        const ctx = this.canvas.getContext('2d');
        this.canvas.width=this.img.width;
        this.canvas.height=this.img.height;
        ctx.drawImage(this.img, 0, 0 );
        console.log(this.canvas)
    }

    async showDetectionResults(fullFaceDescriptions) {
        let displaySize = {
            width: this.img.width,
            height: this.img.height,
        };
        let resizedDetections = faceapi.resizeResults(
            fullFaceDescriptions,
            displaySize
        );
        faceapi.draw.drawDetections(this.canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
    }


    async showCroppedFace(base64) {
        let imgViewer = document.createElement('img');
        imgViewer.className = "img-results";
        imgViewer.src = base64;
        document.getElementById(this.result_id).appendChild(imgViewer);
    }

    async clearCroppedFace() {
        const elements = document.getElementsByClassName("img-results");
        while (elements.length > 0) {
            elements[0].remove();
        }
    }
}
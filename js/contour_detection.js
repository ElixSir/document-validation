/* let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('file-upload'); */

let button_valide = document.getElementById('valide');

// temp img definition
let gray;
let bilateral;
let eq;
let edged;
let img;

// image original
let imgOriginal;
let dsizeOriginal;

let resizeCoef = 1;

let widthResized;
let heightResized;

// clone img
let img2;
let img3;
let img4;
let img5;

// contours
let contours;
let hierarchy;

let hull;

let biggestContourHulled;

let contourSelected;


let contours_poly;
let boundRect;

let green;

// Valeur à partir de laquelle on considère qu'il y a trop de contour
let contourRatioThreshold = 1.5;
let contourRatio;



function initMats() {
    gray = new cv.Mat();
    bilateral = new cv.Mat();
    eq = new cv.Mat();
    edged = new cv.Mat();
    img = new cv.Mat();
    imgOriginal = new cv.Mat();

    contours_poly = new cv.MatVector();
    boundRect = new cv.RectVector();

    green = new cv.Scalar(0,255,0);
}

function contourDetection() {
    initMats();

    src = cv.imread(imgElement);

    contourRatio = getContoursRatio(src);

    resizeImage();

    filterPreProcess();

    // apply filters
    filtersProcess();

    // Create convex hulls from different contours
    createRect();

    findLargestContourAndHullRect();

    image_output = findCorners();

    return image_output;
}

function resizeImage() {
    if(imgElement.width > imgElement.height){
        resizeCoef=500/imgElement.height;
    }
    else {
        resizeCoef=500/imgElement.width;
    }

    widthResized = imgElement.width*resizeCoef;
    heightResized = imgElement.height*resizeCoef;
}

/**
 * Reformat image and create a gray image
 * Process to run before applying filters
 */
function filterPreProcess() {
    // get original image
    dsizeOriginal = new cv.Size(widthResized/resizeCoef, heightResized/resizeCoef);
    cv.resize(src, imgOriginal, dsizeOriginal, 0, 0, cv.INTER_AREA);
    cv.cvtColor(imgOriginal, imgOriginal, cv.COLOR_RGB2BGR)

    // img size wanted
    let dsize = new cv.Size(widthResized, heightResized);

    // resize img
    cv.resize(src, img, dsize, 0, 0, cv.INTER_AREA);
    //cv.imshow('canvasOutput2', img);

    // RGB to BGR
    cv.cvtColor(img, img, cv.COLOR_RGB2BGR)

    img2 = img.clone();
    img3 = img.clone();
    img4 = img.clone();
    img5 = img.clone();

    // BGR to GRAY levels
    cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY)
    //cv.imshow('canvasOutput4', gray);
}

/**
 * Process of applying filters on the image
 */
function filtersProcess() {
    let ksize = new cv.Size(7, 7);
    
    if(contourRatio > contourRatioThreshold) {
        cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT)
        //cv.imshow('canvasOutput5', gray);
    }

    cv.Canny(gray, edged, 100, 0)
    //cv.imshow('canvasOutput7', edged);

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(edged, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
}

/**
 * Compute a ratio of the number of contours depending on the size of the image
 * @param {*} src image on which we must detect the contours
 * @returns ratio
 */
function getContoursRatio(src) {
    let mat = new cv.Mat();
    cv.cvtColor(src, mat, cv.COLOR_BGR2GRAY)
    cv.Canny(mat, mat, 255, 255)

    let c = new cv.MatVector();
    let h = new cv.Mat();
    cv.findContours(mat, c, h, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let ratio;
    if(imgElement.width > imgElement.height){
        ratio = c.size()/imgElement.width;
    }
    else {
        ratio = c.size()/imgElement.height;
    }

    mat.delete();
    c.delete();
    h.delete();

    return ratio;
}

/**
 * Create a rectangle for each contour
 * approxPolyDP() will allow to estimate a polygon from the contour
 * Then boundingRect() will allow to estimate a rectangle from the polygon
 */
function createRect() {
    if(contours_poly) { 
        contours_poly.delete();
        contours_poly = new cv.MatVector();
    }
    if(boundRect) {
        boundRect.delete();
        boundRect = new cv.RectVector();
    }
    for (let i = 0; i < contours.size(); i++) {
        let contour = contours.get(i);
        let contour_poly = new cv.Mat();
        cv.approxPolyDP(contour, contour_poly, 3, true);
        contours_poly.push_back(contour_poly);

        let rect = cv.boundingRect(contour_poly);
        boundRect.push_back(rect);

        contour_poly.delete();
    }
}

/**
 * Draw all hulls + the bigest hull alone on the image
 * Compare bounding rect area of all contours (instead of perim or area of the contour)
 */
function findLargestContourAndHullRect() {
    contourSelected = contours.get(0).clone(); 

    for (let i = 0; i < contours.size(); ++i) {
        let contourPoly = new cv.Mat();
        cv.convexHull(contours.get(i), contourPoly, false, true);
        contours_poly.push_back(contourPoly);
        let rect = cv.boundingRect(contourPoly);
        boundRect.push_back(rect);
        contourPoly.delete();

        let contourPolySelected = new cv.Mat();
        cv.convexHull(contourSelected, contourPolySelected, false, true);
        contours_poly.push_back(contourPolySelected);
        let rectSelected = cv.boundingRect(contourPolySelected);
        boundRect.push_back(rect);
        contourPolySelected.delete();

        let perimCurCtr = rect.width*rect.height;
        let perimBigCtr = rectSelected.width*rectSelected.height;

        if(perimCurCtr >= perimBigCtr){
            contourSelected=contours.get(i).clone();
        }
    }

    cv.cvtColor(img3, img3, cv.COLOR_BGR2RGB)
    //cv.imshow('canvasOutput9', img3);

    // Create an empty MatVector and put the bigest contour in it
    let contourVec = new cv.MatVector();
    contourVec.push_back(contourSelected);

    let hull2 = new cv.MatVector();
    biggestContourHulled = new cv.Mat()
    biggestContourHulled2 = new cv.Mat()
    
    cv.convexHull(contourSelected, biggestContourHulled, true, true);
    cv.approxPolyDP(biggestContourHulled, biggestContourHulled2, 100, true);
    hull2.push_back(biggestContourHulled2);

    // Draw the bigest contour hulled on the image
    cv.drawContours(img5, hull2, 0, green, 5, cv.LINE_8, hierarchy, 0);
    cv.cvtColor(img5, img5, cv.COLOR_BGR2RGB, 0);
    //cv.imshow('canvasOutput10', img5);
}

/**
 * Find the corners of the document + crop + homography + produce the cropped image in a new canvas
 */
function findCorners(){
    let contourVec = new cv.MatVector();
    contourVec.push_back(biggestContourHulled2);
    // Draw the bigest contour on the image
    cv.drawContours(img4, contourVec, 0, green, 3, cv.LINE_8, hierarchy, 0);
    cv.cvtColor(img4, img4, cv.COLOR_BGR2RGB)
    //cv.imshow('canvasOutput54', img4);

    if (biggestContourHulled2.rows == 4) {
        foundContour = biggestContourHulled2;
    }
    else{
        console.error("la photo n'est pas valide");
        button_valide.textContent = "La photo n'est pas valide";
        return;
    }

    // Find the corners
    let corner1 = new cv.Point(foundContour.data32S[0], foundContour.data32S[1]);
    let corner2 = new cv.Point(foundContour.data32S[2], foundContour.data32S[3]);
    let corner3 = new cv.Point(foundContour.data32S[4], foundContour.data32S[5]);
    let corner4 = new cv.Point(foundContour.data32S[6], foundContour.data32S[7]);

    // Order the corners
    let cornerArray = [{ corner: corner1 }, { corner: corner2 }, { corner: corner3 }, { corner: corner4 }];
    // Sort by Y position (to get top-down)
    cornerArray.sort((item1, item2) => { return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0; }).slice(0, 5);

    // Determine left/right based on x position of top and bottom 2
    let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
    let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
    let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
    let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

    // Calculate the max width/height
    let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
    let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
    let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
    let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
    let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
    let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;

    let finalDst = new cv.Mat();

    // row, col, type, array
    // For example, CV_8UC1 means a 8-bit single-channel array, CV_32FC2 means a 2-channel (complex) floating-point array.
    // let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]);
    // ?, ?, taille haut, ?, taille bas, taille droite, ?, taille gauche
    let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth/resizeCoef, 0, theWidth/resizeCoef, theHeight/resizeCoef, 0, theHeight/resizeCoef]);
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x/resizeCoef, tl.corner.y/resizeCoef, tr.corner.x/resizeCoef, tr.corner.y/resizeCoef, br.corner.x/resizeCoef, br.corner.y/resizeCoef, bl.corner.x/resizeCoef, bl.corner.y/resizeCoef]);
    let dsize = new cv.Size(theWidth/resizeCoef, theHeight/resizeCoef);
    
    // corners + dimentions = perspective
    let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords)
    
    // Apply perspective transformation
    cv.warpPerspective(imgOriginal, finalDst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    cv.cvtColor(finalDst, finalDst, cv.COLOR_BGR2RGB, 0);
    cv.imshow('canvasOutput11', finalDst);
    if(document.getElementById('canvasOutput11').height > document.getElementById('canvasOutput11').width) {
        cv.rotate(finalDst, finalDst, cv.ROTATE_90_COUNTERCLOCKWISE);
    }
    cv.imshow('canvasOutput12', finalDst);

    return finalDst;
    
    
}

function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
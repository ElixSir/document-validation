from js import document, console, Uint8Array, performance, createObject, resetOutput

import io
import display

from pyodide import ffi
import os
import cv2
import numpy as np
from PIL import Image

class DOM(object):

    def __init__(self):
        self.image = None
        self.Im = None
        self.edgex, self.edgey = None, None
    
    @staticmethod
    def load(img, blur=False, blurSize=(5,5)):
        if isinstance(img, str):
            if os.path.exists(img):
                # Load image as grayscale
                image = cv2.imread(img, cv2.IMREAD_GRAYSCALE)
            else:
                raise FileNotFoundError('Image is not found on your system')
        elif isinstance(img, np.ndarray):
            if len(img.shape) == 3:
                image = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            elif len(img.shape) == 2:
                image = img
            else:
                raise ValueError('Image is not in correct shape')
        else:
            raise ValueError('Only image can be passed to the constructor')
        
        # Add Gaussian Blur
        if blur:
            image = cv2.GaussianBlur(image, blurSize)
        
        # Perform median blur for removing Noise
        Im = cv2.medianBlur(image, 3, cv2.CV_64F).astype("double")/255.0
        return image, Im

    @staticmethod
    def dom(Im):
        median_shift_up = np.pad(Im, ((0,2), (0,0)), 'constant')[2:,:]
        median_shift_down = np.pad(Im, ((2,0), (0,0)), 'constant')[:-2,:]
        domx = np.abs(median_shift_up - 2*Im + median_shift_down)
        
        median_shift_left = np.pad(Im, ((0,0), (0,2)), 'constant')[:,2:]
        median_shift_right = np.pad(Im, ((0,0), (2,0)), 'constant')[:,:-2]
        domy = np.abs(median_shift_left - 2*Im + median_shift_right)
        
        return domx, domy

    @staticmethod
    def contrast(Im):
        Cx = np.abs(Im - np.pad(Im, ((1,0), (0,0)), 'constant')[:-1, :])
        Cy = np.abs(Im - np.pad(Im, ((0,0), (1,0)), 'constant')[:, :-1])
        return Cx, Cy

    @staticmethod
    def smoothenImage(image, transpose = False, epsilon = 1e-8):
        fil = np.array([0.5, 0, -0.5]) # Smoothing Filter

        # change image axis for column convolution
        if transpose:
            image = image.T

        # Convolve grayscale image with smoothing filter
        image_smoothed = np.array([np.convolve(image[i], fil, mode="same") for i in range(image.shape[0])])
        
        # change image axis after column convolution
        if transpose:
            image_smoothed = image_smoothed.T

        # Normalize smoothened grayscale image
        image_smoothed = np.abs(image_smoothed)/(np.max(image_smoothed) + epsilon)
        return image_smoothed

    def edges(self, image, edge_threshold=0.0001):
        smoothx = self.smoothenImage(image, transpose=True)
        smoothy = self.smoothenImage(image)
        self.edgex = smoothx > edge_threshold
        self.edgey = smoothy > edge_threshold

    def sharpness_matrix(self, Im, width=2, debug=False):
        # Compute dod measure on both axis 
        domx, domy = self.dom(Im)

        # Compute sharpness
        Cx, Cy = self.contrast(Im)
        
        # Filter out sharpness at pixels other than edges
        Cx = np.multiply(Cx, self.edgex)
        Cy = np.multiply(Cy, self.edgey)

        # initialize sharpness matriz with 0's
        Sx = np.zeros(domx.shape)
        Sy = np.zeros(domy.shape)
        
        # Compute Sx
        for i in range(width, domx.shape[0]-width):
            num = np.abs(domx[i-width:i+width, :]).sum(axis=0)
            dn = Cx[i-width:i+width, :].sum(axis=0)
            Sx[i] = [(num[k]/dn[k] if dn[k] > 1e-3 else 0) for k in range(Sx.shape[1])]
        
        # Compute Sy
        for j in range(width, domy.shape[1]-width):
            num = np.abs(domy[:, j-width: j+width]).sum(axis=1)
            dn = Cy[:, j-width:j+width].sum(axis=1)
            Sy[:, j] = [(num[k]/dn[k] if dn[k] > 1e-3 else 0) for k in range(Sy.shape[0])]
            
        if debug:
            print(f"domx {domx.shape}: {[(i,round(np.quantile(domx, i/100), 2)) for i in range(0, 101, 25)]}")
            print(f"domy {domy.shape}: {[(i,round(np.quantile(domy, i/100), 2)) for i in range(0, 101, 25)]}")
            print(f"Cx {Cx.shape}: {[(i,round(np.quantile(Cx, i/100),2)) for i in range(50, 101, 10)]}")
            print(f"Cy {Cy.shape}: {[(i,round(np.quantile(Cy, i/100),2)) for i in range(50, 101, 10)]}")
            print(f"Sx {Sx.shape}: {[(i,round(np.quantile(Sx, i/100),2)) for i in range(50, 101, 10)]}")
            print(f"Sy {Sy.shape}: {[(i,round(np.quantile(Sy, i/100),2)) for i in range(50, 101, 10)]}")
            
        return Sx, Sy

    def sharpness_measure(self, Im, width, sharpness_threshold, debug=False, epsilon = 1e-8):
        Sx, Sy = self.sharpness_matrix(Im, width=width, debug=debug)
        Sx = np.multiply(Sx, self.edgex)
        Sy = np.multiply(Sy, self.edgey)
        
        n_sharpx = np.sum(Sx >= sharpness_threshold)
        n_sharpy = np.sum(Sy >= sharpness_threshold)

        n_edgex = np.sum(self.edgex)
        n_edgey = np.sum(self.edgey)
        
        Rx = n_sharpx/(n_edgex + epsilon)
        Ry = n_sharpy/(n_edgey + epsilon)

        S = np.sqrt(Rx**2 + Ry**2)
        
        if debug:
            print(f"Sharpness: {S}")
            print(f"Rx: {Rx}, Ry: {Ry}")
            print(f"Sharpx: {n_sharpx}, Sharpy: {n_sharpy}, Edges: {n_edgex, n_edgey}")
        return S

    def get_sharpness(self, img, width=2, sharpness_threshold=2, edge_threshold=0.0001, debug=False):
        image, Im = self.load(img)
        # Initialize edge(x|y) matrices
        self.edges(image, edge_threshold=edge_threshold)
        score = self.sharpness_measure(Im, width=width, sharpness_threshold=sharpness_threshold)
        return score


def _estimate_result(sharpness_result, seuil_haut, seuil_moyen):
    if sharpness_result >= seuil_haut :
        level = 1 # GOOD
    elif sharpness_result >= seuil_moyen : 
        level = 2 # AVERAGE
    else :
        level = 3 # BAD
    return level


async def _get_sharpness_estimation(file):
    
    # start of the scoring part 
    start = performance.now()  

    iqa = DOM()

    # Get the data from the files arrayBuffer as an array of unsigned bytes
    # array_buf = Uint8Array.new(await first_item.arrayBuffer())
    array_buf = Uint8Array.new(await file.arrayBuffer())

    # BytesIO wants a bytes-like object, so convert to bytearray first
    bytes_list = bytearray(array_buf) 
    my_bytes = io.BytesIO(bytes_list) 

    # Create PIL image from np array
    my_image = Image.open(my_bytes)
    w, h = my_image.size
    console.log("image size = w: ", w, "- h: ", h)

    # Resize if button checked 
    if document.getElementById("resize").checked == True:
        # value of the resize defined here 
        resize_value = int(document.getElementById("resize_value").value)
        if w > h: 
            resizeCoef = resize_value/h
        else: 
            resizeCoef = resize_value/w
        new_w = int(w*resizeCoef)
        new_h = int(h*resizeCoef)
        console.log("new_w: ", new_w, "new_h: ", new_h)

        # with OpenCV or PIL 
        if document.getElementById("resize_OpenCV").checked == True:
            console.log("METHOD: OpenCV")
            my_image_data = np.array(my_image.convert())
            my_image_data = cv2.resize(my_image_data, dsize=(new_w, new_h), interpolation=cv2.INTER_CUBIC)
        else:
            console.log("METHOD: PIL")
            my_image = my_image.resize((new_w, new_h))
            my_image_data = np.array(my_image.convert())
    else: 
        my_image_data = np.array(my_image.convert())

    # calculation of sharpness
    estimation = iqa.get_sharpness(my_image_data)

    # end scoring  
    end = performance.now()
    elapsed = end - start
    exec_time = str(elapsed)

    seuil_haut = 1.05 # > good quality 
    seuil_moyen = 0.98 # > average quality
    
    quality_level = _estimate_result(estimation, seuil_haut, seuil_moyen) # 1 - 2 - 3 

    return estimation, quality_level, file, exec_time

    
async def _processing(file):
    resetOutput()
    estimation, quality_lvl, img_src, exec_time = await _get_sharpness_estimation(file)
    
    if document.getElementById("output").checked == True:
        display._display_output(estimation, quality_lvl, img_src, exec_time)


createObject(ffi.create_proxy(globals()), "pyodideGlobals")
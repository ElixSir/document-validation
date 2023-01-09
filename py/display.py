from js import document, window
from pyscript import Element

def _display_result(level):
    if level == 1 :
        Element('output_qualite').write("BONNE")
    elif level == 2 : 
        Element('output_qualite').write("MOYENNE")
    else :
        Element('output_qualite').write("ILLISIBLE")

def _display_output(estimation, quality_lvl, img_src, exec_time):
    _display_result(quality_lvl)
    Element('output_estimation').write(estimation)
    Element('output_exec_time').write(exec_time) 
    new_image = document.createElement('img')
    new_image.src = window.URL.createObjectURL(img_src)
    document.getElementById("output_upload").appendChild(new_image)

// V A R I A B L E S    G L O B A L E S

var compteurImage = 0;
var compteur_OCR = 0;
var start;
var end;
var nbImgTot = 0;
var V1;
var V2;
var button_chargement_titre = document.getElementById('chargement_titre');
let button_chargement = document.getElementById('chargement');
var source_resized;




//main function
async function checkingParasitingObjects(source_immaculate) {

  // V A R I A B L E S

  compteurImage = 0;
  compteur_OCR = 0;
  nbImgTot = 0;
  V1 = false;
  V2 = false;
  start = new Date();

  // B O U T O N S    A F F I C H A G E
  let button_resultat = document.getElementById('resultat');


  ///////////////////////////////////////////////////////

  //CNI_FR_V1_Photo
  await executionVersion1(source_immaculate);

  //CNI_FR_V2_Photo
  if(V1 == false){
    await executionVersion2(source_immaculate);
  }

  ///////////////////////////////////////////////////////

  // On OCR toute la carte
  // lectureDocumentEntier();
  
  affichageFinal();

  end = new Date();
  button_resultat.textContent = "Temps de traitement checkingParasitingObjects : " + (end-start) + " ms";
  console.log(end-start);
}

async function executionVersion1(source_immaculate)
{
  // Initialisation des variables pour la version 1
  source = source_immaculate.clone();
  nbImgTot = 6;
  width_source = 937;
  height_source = 651;
  dsize = new cv.Size(width_source, height_source);
  cv.resize(source, source, dsize, 0, 0, cv.INTER_AREA);
  source_resized = source.clone();

  // Execution de la version 1
  button_chargement_titre.textContent = "Début test première version";
  try {
    if(await matchTemplateDraw(900, source, cv.imread('bande_haut_bleue_V1_Photo'), "templ_bande_haut_bleue", "V1_Photo"))
    {
      button_chargement.textContent = "Il reste 5 champs à traiter";
      if(await matchTemplateDraw(300, source, cv.imread('nationnalite_fr_V1_Photo'), "templ_nationnalite_fr", "V1_Photo"))
      {
        button_chargement.textContent = "Il reste 4 champs à traiter";

        if(await matchTemplateDraw(600, source, cv.imread('ne_le_V1_Photo'), "templ_ne_le", "V1_Photo"))
        {
          button_chargement.textContent = "Il reste 3 champs à traiter";

          if(await matchTemplateDraw(300, source, cv.imread('nom_V1_Photo'), "templ_nom", "V1_Photo"))
          {
            button_chargement.textContent = "Il reste 2 champs à traiter";

            if(await matchTemplateDraw(300, source, cv.imread('numero_CNI_V1_Photo'), "templ_numero_CNI", "V1_Photo"))
            {
              button_chargement.textContent = "Il reste 1 champs à traiter";
              
              await matchTemplateDraw(300, source, cv.imread('bas_V1_Photo'), "bas", "V1_Photo");
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  
  // debug
  // cv.imshow('canvasFinal1', source);
  
  // Réinitialisation des compteurs
  validation("V1"); 
}

async function executionVersion2(source_immaculate)
{
  // Initialisation des variables pour la version 2

  source = source_immaculate.clone();
  //nbImgTot = 10;
  nbImgTot = 5;
  width_source = 888;
  height_source = 556;
  dsize = new cv.Size(width_source, height_source);
  cv.resize(source, source, dsize, 0, 0, cv.INTER_AREA);
  source_resized = source.clone();

  // Execution de la version 2
  button_chargement_titre.textContent = "Début test deuxième version";
  try {
    if(await matchTemplateDraw(900, source, cv.imread('date_expiration_V2_Photo'), "date_expiration", "V2_Photo"))
    {
      button_chargement.textContent = "Il reste 4 champs à traiter";
      
      if(await matchTemplateDraw(300, source, cv.imread('date_naissance_V2_Photo'), "date_naissance", "V2_Photo"))
      {
        button_chargement.textContent = "Il reste 3 champs à traiter";
        if(await matchTemplateDraw(300, source, cv.imread('numero_document_V2_Photo'), "numero_document", "V2_Photo"))
        {
          button_chargement.textContent = "Il reste 2 champs à traiter";
          if(await matchTemplateDraw(300, source, cv.imread('prenom_V2_Photo'), "prenom", "V2_Photo"))
          {
            button_chargement.textContent = "Il reste 1 champs à traiter";
            await matchTemplateDraw(300, source, cv.imread('republique_V2_Photo'), "republique", "V2_Photo");
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  // debug
  //cv.imshow('canvasFinal2', source);

  //réinitialisation des compteurs
  validation("V2"); 

}

async function lectureDocumentEntier()
{
  // On incrémente compteurImage pour afficher sur un emplacement canvas valide
  compteurImage++;

  try {
    await OCR_traitement_image(source_immaculate, 900);
  } catch (error) {
    console.error(error);
  }
}

async function matchTemplateDraw(width, source, templ, name_img, version)
{
  // Initialisation des variables
  let bool = false;
  compteurImage++;
  source_gray = new cv.Mat();
  templ_gray = new cv.Mat();
  let dest = new cv.Mat();
  let M = new cv.Mat();
  cv.cvtColor(source, source_gray, cv.COLOR_BGR2GRAY, 0);
  cv.cvtColor(templ, templ_gray, cv.COLOR_BGR2GRAY, 0);

  // Template matching
  try {
    cv.matchTemplate(source_gray, templ_gray, dest, cv.TM_CCOEFF_NORMED, M);
  } catch (error) {
    console.log("not found");
    return
  }

  // Localizing the best match with minMaxLoc

  let result = cv.minMaxLoc(dest, M);
  //console.log(result.maxVal*100);
  /*if(result.maxVal*100 < 20)
  {
    return false;
  }*/
  let maxPoint = result.maxLoc;
  let color = new cv.Scalar(255, 0, 0, 255);
  let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);

  let rectangle = createRectangle(maxPoint, point)
 
  let dst = new cv.Mat();
  
  // Crop the original image to the defined ROI
  dst = source.roi(rectangle);

  bool = await OCR_traitement_image(dst, width, name_img, version); 

  // Draw rectangle on source image
  cv.rectangle(source, maxPoint, point, color, 2, cv.LINE_8, 0);

  return bool;
} 

function createRectangle(maxPoint, point)
  {
    let x = maxPoint.x;
    let y = maxPoint.y;
    width = Math.abs(x-point.x)
    height = Math.abs(y-point.y);
    return new cv.Rect(x, y, width, height);
  }

async function OCR_traitement_image(dst, width, name_img, version)
{
  // Resizing the image with ratio
  let id = "canvasAffichage"+compteurImage;
  let width_image = dst.size().width;
  let height_image = dst.size().height;
  let ratio = height_image/width_image;
  let width_source = width;
  let height_source = width_source*ratio;
  let dsize = new cv.Size(width_source, height_source);

  cv.resize(dst, dst, dsize, 0, 0, cv.INTER_AREA);

  cv.cvtColor(dst, dst, cv.COLOR_RGB2GRAY, 0); 	

  if(version == "V1_Photo")
  {
    applyFilterV1(dst, name_img);
  }

  //Tesseract fonctionne avec des canvas, pas des cv.Mat
  cv.imshow(id, dst);
  let img = document.getElementById(id);

  return await OCR_Image(img, name_img, version)
}

//Applique un filtre sur l'image selon son nom
function applyFilterV1(dst, name_img)
{
  let anchor = new cv.Point(-1, -1);
  let M = cv.Mat.ones(5, 5, cv.CV_8U);
  switch (name_img) {
    case "templ_bande_haut_bleue":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY);
      break;
    case "templ_nationnalite_fr":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      break;
    case "templ_ne_le":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      break;
    case "templ_nom":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      break;
    case "templ_numero_CNI":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      break;
    default:
      break;
  }

}


async function OCR_Image(image, name_img, version)
{
  let bool;
  
  const { createWorker } = Tesseract;

  const worker = await createWorker({
  });

  process = await (async () => {
    await worker.loadLanguage('fra');
    await worker.initialize('fra');
    const { data: { text } } = await worker.recognize(image);
    //DEBUG
    /* console.log(name_img);
    console.log(image);
    console.log("texte OCR : " + text); */
    await worker.terminate();

    if(validatorOCR(text, name_img, version))
    {
      compteur_OCR++;
      bool = true;
    }
    else{
      bool = false;
    }
    
  })();

  /*try {
    setTimeout(process, 4000)
  } catch (e) {
    console.error('Timeout Error:', e.message)
    bool = false;
  }*/
  
  return bool;
};

// Vérifie si le texte OCR est correct
function validatorOCR(text, name_img, version)
{
  if(version == "V1_Photo")
  {
    switch(name_img)
    {
      case "templ_bande_haut_bleue":
        return validate(text, "RÉPUBLIQUE FRANÇAISE")
      case "templ_nationnalite_fr":
        return validate(text, "Nationalité Française")
      case "templ_ne_le":
        return validate(text, "Né(e) le")
      case "templ_nom":
        return validate(text, "Nom :")
      case "templ_numero_CNI":
        return validate(text, "CARTE NATIONALE D'IDENTITÉ N° :")
      case "bas":
        return validate(text, "<<<<")
      default:
        return false;
    }
  }
  else{
    switch(name_img)
    {
      case "date_expiration":
        return validate(text, "DATE D'EXPIR : Expiry date")
      case "date_naissance":
        return validate(text, "DATE DE NAISS / Date of birth")
      case "lieu_naissance":
        return validate(text, "LIEU DE NAISSANCE / Place of birth")
      case "nationalite":
        return validate(text, "NATIONALITÉ / Nationality")
      case "nom":
        return validate(text, "NOM / Surname")
      case "numero_document":
        return validate(text, "N° DU DOCUMENT / Document No")
      case "sexe":
        return validate(text, "SEXE / Sex")
      case "carte_nationale":
        return validate(text, "CARTE NATIONALE D'IDENTITÉ / IDENTITY CARD")
      case "prenom":
        return validate(text, "Prénoms / Given names")
      case "republique":
        return validate(text, "RÉPUBLIQUE FRANÇAISE")
      default:
        return false;
    }
  }
  
}

//Vérifie si le texte OCR contient les mêmes caractères que le pattern
function validate(text, pattern)
{
  let compteur = 0;
  let stringPattern = pattern;
  for (let index = 0; index < pattern.length; index++) {
    for (let j = 0; j < stringPattern.length; j++) {

      if (text[index] == stringPattern[j])
      {
        compteur++;
        stringPattern = stringPattern.replace(stringPattern[j], "");
        break;

      }
    }
    
  }

  diffLongueur = Math.abs(text.length - pattern.length);

  // DEBUG
  /* console.log("lettres non trouvees : " + stringPattern);
  console.log(compteur +"/"+pattern.length);
  console.log("Différence de longueur : "+diffLongueur); */

  //Seuils actuels de 0,5 pour les caractères trouvés et de 0,5 pour la différence de longueur
  let seuilCaracteresTrouves = pattern.length*0.5;
  let seuildiffLongueur = pattern.length*0.5;
  if(compteur >= seuilCaracteresTrouves && diffLongueur < seuildiffLongueur)//Il faut définir à partir de quel pourcentage de caractères concordants on valide
  {
    return true;
  }
  else{
    return false;
  }
}

function validation(version)
{
  let pourcentageReussite = (compteur_OCR/nbImgTot)*100;
  let champCache = nbImgTot-compteur_OCR;
  //DEBUG
  /* console.log("pourcentage de reussite : "+pourcentageReussite+"%");
  console.log("Nombre de champs caches : "+champCache); */
 
  //réinitialisation des compteurs
  compteur_OCR = 0;

  if(pourcentageReussite == 100)
  {
    if(version == "V1")
    {
      V1 = true;
    }
    else{
      V2 = true;
    }
  }
}

function affichageFinal()
{
  let button_valide = document.getElementById('valide');
  if(V1 == true || V2 == true){
    console.log("La photo est valide");
    cv.imshow('canvasSourceResized', source_resized);
    
    if (V1 == true){
      button_valide.textContent = "La photo 1 est valide";
    }
    else{
      button_valide.textContent = "La photo 2 est valide";
    }
  }
  else{
    console.log("La photo n'est pas valide");
    button_valide.textContent = "La photo n'est pas valide";
  }
  
  button_chargement_titre.textContent = "";
  button_chargement.textContent = "";
}

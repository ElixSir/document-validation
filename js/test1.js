var compteurImage = 0;
var compteur_OCR = 0;
var start;
var end;
var nbImgTot = 0;
var V1 = false;
var V2 = false;



async function realiseProcess(){
  
  start = new Date();
  
  let width_source = 0;
  let height_source = 0;
  let source;
  let dsize = new cv.Size();
  //let source_immaculate = cv.imread('template');
  let source_immaculate = cv.imread('canvasOutput12');
  

  ///////////////////////////////////////////////////////

  //CNI_FR_V1_Photo
  
  //console.log("\nCNI_FR_V1_Photo\n");

   
  source = source_immaculate.clone();
  nbImgTot = 6;
  width_source = 937;
  height_source = 651;
  dsize = new cv.Size(width_source, height_source);
  cv.resize(source, source, dsize, 0, 0, cv.INTER_AREA);

 
  try {
    if(await matchTemplateDraw(900, source, cv.imread('bande_haut_bleue_V1_Photo'), "templ_bande_haut_bleue", "V1_Photo"))
    {
      if(await matchTemplateDraw(300, source, cv.imread('nationnalite_fr_V1_Photo'), "templ_nationnalite_fr", "V1_Photo"))
      {
        if(await matchTemplateDraw(600, source, cv.imread('ne_le_V1_Photo'), "templ_ne_le", "V1_Photo"))
        {
          if(await matchTemplateDraw(300, source, cv.imread('nom_V1_Photo'), "templ_nom", "V1_Photo"))
          {
            if(await matchTemplateDraw(300, source, cv.imread('numero_CNI_V1_Photo'), "templ_numero_CNI", "V1_Photo"))
            {
              await matchTemplateDraw(300, source, cv.imread('bas_V1_Photo'), "bas", "V1_Photo");
            }
          }
        }
      }
    }
    
    // trop dur, trop dépendant de la luminosité
    //await matchTemplateDraw(300, source, cv.imread('signature_V1_Photo'), "templ_signature", "V1_Photo");
  } catch (error) {
    console.error(error);
  }
  
  cv.imshow('canvasFinal1', source);
  
  resetCompteur("V1"); 

  ///////////////////////////////////////////////////////

  //CNI_FR_V2_Photo

  if(V1 == false){
    
    //console.log("\nCNI_FR_V2_Photo\n");

    source = source_immaculate.clone();
    //nbImgTot = 10;
    nbImgTot = 5;
    width_source = 888;
    height_source = 556;
    dsize = new cv.Size(width_source, height_source);
    cv.resize(source, source, dsize, 0, 0, cv.INTER_AREA);

    try {
      if(await matchTemplateDraw(900, source, cv.imread('date_expiration_V2_Photo'), "date_expiration", "V2_Photo"))
      {
        if(await matchTemplateDraw(300, source, cv.imread('date_naissance_V2_Photo'), "date_naissance", "V2_Photo"))
        {
          if(await matchTemplateDraw(300, source, cv.imread('numero_document_V2_Photo'), "numero_document", "V2_Photo"))
          {
            if(await matchTemplateDraw(300, source, cv.imread('prenom_V2_Photo'), "prenom", "V2_Photo"))
            {
              await matchTemplateDraw(300, source, cv.imread('republique_V2_Photo'), "republique", "V2_Photo");
            }
          }
        }
      }
      /* await matchTemplateDraw(300, source, cv.imread('date_naissance_V2_Photo'), "date_naissance", "V2_Photo");
      await matchTemplateDraw(300, source, cv.imread('numero_document_V2_Photo'), "numero_document", "V2_Photo");
      await matchTemplateDraw(300, source, cv.imread('prenom_V2_Photo'), "prenom", "V2_Photo");
      await matchTemplateDraw(300, source, cv.imread('republique_V2_Photo'), "republique", "V2_Photo"); */
      //await matchTemplateDraw(600, source, cv.imread('lieu_naissance_V2_Photo'), "lieu_naissance", "V2_Photo");
      //await matchTemplateDraw(300, source, cv.imread('nationalite_V2_Photo'), "nationalite", "V2_Photo");
      //await matchTemplateDraw(300, source, cv.imread('nom_V2_Photo'), "nom", "V2_Photo");
      //await matchTemplateDraw(300, source, cv.imread('sexe_V2_Photo'), "sexe", "V2_Photo");
      //await matchTemplateDraw(300, source, cv.imread('carte_nationale_V2_Photo'), "carte_nationale", "V2_Photo");
    } catch (error) {
      console.error(error);
    }
    cv.imshow('canvasFinal2', source);

    resetCompteur("V2"); 

  }

  ///////////////////////////////////////////////////////
  //juste pour lui car on ne passe par matchTemplateDraw, pour afficher sur un emplacement canvas valide sans override une image
  compteurImage++;
  try {
    await OCR_traitement_image(source_immaculate, 900);
  } catch (error) {
    console.error(error);
  }
  

  if(V1 == true || V2 == true){
    console.log("La photo est valide");
    if (V1 == true){
      //console.log("Version 1");
      const canvas = document.getElementById('canvasFinal1');
      canvas.style.display = 'block';
    }
    else{
      //console.log("Version 2");
      const canvas = document.getElementById('canvasFinal2');
      canvas.style.display = 'block';
    }
  }
  else{
    console.log("La photo n'est pas valide");
  }
  end = new Date();

  console.log(end-start);
}

async function matchTemplateDraw(width, source, templ, name_img, version)
{
  let bool = false;
  compteurImage++;
  source_gray = new cv.Mat();
  templ_gray = new cv.Mat();
  source_black = new cv.Mat();
  templ_black = new cv.Mat();
  let dest = new cv.Mat();
  let M = new cv.Mat();
  cv.cvtColor(source, source_gray, cv.COLOR_BGR2GRAY, 0);
  cv.cvtColor(templ, templ_gray, cv.COLOR_BGR2GRAY, 0);
  cv.threshold(source, source_black, 80, 255, cv.THRESH_BINARY);
  cv.threshold(templ, templ_black, 80, 255, cv.THRESH_BINARY);

  try {
    cv.matchTemplate(source_gray, templ_gray, dest, cv.TM_CCOEFF_NORMED, M);
  } catch (error) {
    console.log("not found");
    return
  }

  let result = cv.minMaxLoc(dest, M);
  //console.log(result.maxVal*100);
  let maxPoint = result.maxLoc;
  let color = new cv.Scalar(255, 0, 0, 255);
  let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);

  let rectangle = createRectangle(maxPoint, point)
 
  let dst = new cv.Mat();
  dst = source.roi(rectangle);
  bool = await OCR_traitement_image(dst, width, name_img, version); 
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
  let id = "canvasAffichage"+compteurImage;
  let width_image = dst.size().width;
  let height_image = dst.size().height;
  let ratio = height_image/width_image;
  let width_source = width;
  let height_source = width_source*ratio;

  let dsize = new cv.Size(width_source, height_source);

  cv.resize(dst, dst, dsize, 0, 0, cv.INTER_AREA);

  cv.cvtColor(dst, dst, cv.COLOR_RGB2GRAY, 0); 	

  if(version == "V1_Scan" || version == "V1_Photo")
  {
    applyFilterV1(dst, name_img);
  }
  cv.imshow(id, dst);
  let img = document.getElementById(id);
  return await OCR_Image(img, name_img, version)
}

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
    /*case "templ_signature":
      cv.threshold(dst, dst, 80, 255, cv.THRESH_BINARY);
      break;*/
    default:
      break;
  }

}


async function OCR_Image(image, name_img, version)
{
  let bool;
  
  const { createWorker } = Tesseract;

  const worker = await createWorker({
    //logger: m => console.log(m), // Add logger here
  });

  await (async () => {
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
      //console.log("OCR OK");
      compteur_OCR++;
      bool = true;
    }
    else{
      //console.log("erreur OCR");
      bool = false;
    }
    
  })();
  return bool;
};

function validatorOCR(text, name_img, version)
{
  if(version == "V1_Scan" || version == "V1_Photo")
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
      /* case "templ_signature":
        return validate(text, "Signature\ndu titulaire :") */
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

function resetCompteur(version)
{
  let pourcentageReussite = (compteur_OCR/nbImgTot)*100;
  let champCache = nbImgTot-compteur_OCR;
  //DEBUG
  /* console.log("pourcentage de reussite : "+pourcentageReussite+"%");
  console.log("Nombre de champs caches : "+champCache); */
 
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

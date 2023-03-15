/* v.1.0 - by md2d */
const allowedPaths = [	
	'catalog/product' , 
	'catalog/category' , 
	'extension/module/ocfilter/page',
];

let fieldsValue = [] , pageRule = [] , jsonEditor, jsonText,globalRule;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const routeRoute = urlParams.get('route');

const btnClick = () => {
	if(!pageRule)
		return '';
	
	// update field values
	
	for (const [field, fieldSt] of Object.entries(pageRule)) {
		let input = $("[name=\""+fieldSt.selector+"\"]");
		if(input.css('display') == 'none')
			fieldsValue[field] = input.summernote('code');
		else
			fieldsValue[field] = input.val(); 
	}
	
	let query = '';
	$('#overdiv').css('display','flex');
	for (const [field, value] of Object.entries(pageRule)) {
		if(!value.stable){
			query = replaceVars(value.prompt , fieldsValue );
			makeQuery(query , value.maxLength?value.maxLength:90 , value.selector);
		}
	}
	setTimeout("$('#overdiv').css('display','none');" , 7100);
	
}

const btnClickSettings = () => {
	
	$('#modalEditorConfig').modal('show');
	initJsonEditor()
	
}

const replaceVars = (string , vars) => {
	//console.log(vars)
	let newstr = string
	for (const [field, value] of Object.entries(vars)) {
		newstr = newstr.replaceAll('{' +field+ '}' ,  value );
	}
	
	return newstr;
}

const makeQuery = (query , length , fieldname) => {
	
	$.post( location.href.replace(routeRoute , 'extension/module/chatgptseo/call' ) , {request: query , tokens: length } , (data) => {
		data = JSON.parse(data);
		if(data.error){
			alert(data.error.message);
		}
		
		let answer= data.choices[0].text.trim();
		let field = $('[name=\''+fieldname+'\']');
		if(field.length){
			
			if(field.css('display') == 'none') // wysiwing
				field.summernote('code' , answer);
			else
				field.val(answer);
		}
		
	} );
	
}

const hideButtons = () => {
	document.getElementById('ChatBtnSet').style.display = 'none';
}

const initLoader = () => {
  
  let checkUrl = false;
  
  allowedPaths.forEach(
    (url) => {
      if( !checkUrl && location.href.indexOf(url) > 0 )
        checkUrl = true;
    });
    
    if(!checkUrl) 
      return '';
	
	let btnGroup = document.createElement("div");
	btnGroup.className = "btn-group";
	btnGroup.id = 'ChatBtnSet';
	let buttonGPT = document.createElement("button");
	buttonGPT.innerHTML = "<i class=\"fa fa-superpowers\"></i> ChatGPT SEO"; 
	buttonGPT.className = "btn btn-primary";
	
	
	let btnSettings = document.createElement('button');
	btnSettings.innerHTML = '<i class="fa fa-sliders"></i>';
	btnSettings.className = "btn btn-primary";
	
	$(btnGroup).css({
		'position': 'fixed',
		'right': 'calc(50% - 50px)',
		'zIndex': '1000',
		//'transform': 'rotate(-90deg)',
		'top': '0',
	});
	
	btnGroup.appendChild(buttonGPT);
	btnGroup.appendChild(btnSettings);
	
	buttonGPT.addEventListener('click' , btnClick );
	btnSettings.addEventListener('click' , btnClickSettings );
	
	
	
	let over = document.createElement('div');
	over.id = 'overdiv';
	over.innerHTML = '<i class="fa-5x fa fa-spinner"></i><style>.fa-spinner {animation: spin 5s infinite linear;-webkit-animation: spin2 5s infinite linear;}@keyframes spin {from {transform: scale(1) rotate(0deg);}to {transform: scale(1) rotate(360deg);}}@-webkit-keyframes spin2 {from {-webkit-transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);}}</style>';
	$(over).css({
		'display':'none',
		'position':'fixed',
		'top':0,
		'left':0,
		'background':'rgb(0 0 0 / 62%)',
		'zIndex':9999,
		'color':'white',
		'alignItems': 'center',
		'justifyContent':'center',
		'width':'100%',
		'height':'100%'
	});
	document.body.appendChild(over);	
	
	let xhr = new XMLHttpRequest();
	// open a connection
	xhr.open("GET", location.href.replace(routeRoute , 'extension/module/chatgptseo/getFieldRule') + '&' + Math.random()  , true);

	// send the request
	xhr.send();

	// handle the response
	xhr.onreadystatechange = function () {
	  if (this.readyState == 4 && this.status == 200) {
		jsonText = this.responseText;
		try{
			globalRule = JSON.parse(this.responseText);
			
			for (const [key, value] of Object.entries(globalRule)) {
				if( location.href.indexOf(key) > 0 ){
					pageRule = value;
					let isField = false;
					for (const [field, fieldSt] of Object.entries(value)) {
						fieldsValue[field] = $("[name=\""+fieldSt.selector+"\"]").val();
						isField = isField || $("[name=\""+fieldSt.selector+"\"]").length;
					}
					if(!isField)
						hideButtons();
				}
			}
		} catch {
			alert('Error loading JSON, chech up your json file!');
			hideButtons();
		};
	  }
	}
	
	
	let modal = document.createElement('div');
	modal.innerHTML = '<div id="modalEditorConfig" class="modal" role="dialog"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="alert alert-success hide" role="alert" id="sca">{{ success }}</div><div class="modal-header"><button type="button" class="close" data-dismiss="modal">x</button><h4 class="modal-title">ChatGPT Config Editor</h4></div><div class="modal-body"><div id="jsoneditor"></div></div><div class="modal-footer"><button id="saveJsonEditor" type="button" class="btn btn-success">{{ save }}</button></div></div></div></div>';
	
	document.body.appendChild(modal);
	document.body.appendChild(btnGroup);
	
	document.getElementById('saveJsonEditor').addEventListener('click' , () => {
	  $.post( location.href.replace(routeRoute , 'extension/module/chatgptseo/saveCnfg' ) , {json: jsonEditor.getText() } , (data) => {
		$(document.getElementById('sca')).removeClass('hide'); 
	  });
	});
	loadJsonEditor();
  
}

const initJsonEditor = () => {
	if(jsonEditor)
		return false;
	
	let container = document.getElementById("jsoneditor");
	let options = {};
	jsonEditor = new JSONEditor(container, options);
	jsonEditor.set(globalRule);
}

const loadJsonEditor = () => {
  // Create a link element for the CSS file
  let cssLink = document.createElement("link");
  cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.1.8/jsoneditor.min.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  // Create a script element for the JavaScript file
  let script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.1.8/jsoneditor.min.js";
  script.type = "text/javascript";

  // Append the link and script elements to the head section of the HTML document
  document.head.appendChild(cssLink);
  document.head.appendChild(script);
}




initLoader();

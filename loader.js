/* v.1.0 - by md2d */
const allowedPaths = [	
	'{{ allowedPaths }}'
];

let fieldsValue = [] , pageRule = [] , statusInfo=[] , jsonEditor, jsonText, globalRule, isField = false;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const routeRoute = urlParams.get('route');

const btnClick = () => {
	if(!pageRule)
		return '';
	
	if(!isField){
		return massiveUpdate();
	}
	// update field values
	
	$('a[href="#language{{ lang }}"]').click();
	
	initFieldsValue(pageRule);
	
	let query = '';
	$('#overdiv').css('display','flex');
	let requestIndex = 0;
	for (const [field, value] of Object.entries(pageRule)) {
		if(!value.stable){
			statusInfo[requestIndex] = !true;
			query = replaceVars(value.prompt , fieldsValue ).replaceAll("'" , '"');
			setTimeout("makeQuery('"+query+"' , "+(value.maxLength?value.maxLength:90)+" , \""+value.selector+"\" , "+requestIndex+");" , requestIndex * 500);
			requestIndex++;
		}
	}
	setTimeout("$('#overdiv').css('display','none');" , 710000);
	
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

const checkWait = ()=> {
	for (let i = 0; i < statusInfo.length; i++){
		if( statusInfo[i] == 0)
			return true;
	} 
	return false;
}



const massiveUpdate = () => {
	
	const updateItem = (index,arr) => {
		
		if(arr.length == index){
			$('#ChatBtnSet > *').eq(1).attr('disabled', false);
			return 0;
		}
		
		const itemId = arr[index].value;
		
		let icon = document.createElement('div');
		icon.id = 'icon-'+itemId;
		icon.className = "fa fa-spinner";
		$(arr[index]).parent()[0].appendChild(icon);
		
		const type = (location.href.indexOf('catalog/category') > 0 || location.href.indexOf('editors/category') > 0) ? 'category':'product';
		
		$.get( location.href.replace(routeRoute , 'extension/module/chatgptseo/massiveUpdate' )+'&id='+itemId+'&type='+type ,  (data) => {
			console.log(itemId + ' - ' + data);
			let json = JSON.parse(data);
			if(json.success == 1)
				$(arr[index]).parent().parent().css('background', 'rgba(75,175,80,0.17)');
			else
				$(arr[index]).parent().parent().css('background', '#f26a603d');
			
		 }).done(function() {
			$(arr[index]).parent().parent().css('background', 'rgba(75,175,80,0.17)');
		  })
		  .fail(function() {
			$(arr[index]).parent().parent().css('background', '#f26a603d');
		  })
		  .always(function() {
			$('#icon-'+itemId).remove();
			updateItem(index+1, arr );
		  });
		
	}
	const items = $("input[name=\"selected[]\"]:checked");
	
	if(items.length == 0){
		$('#overdiv').css('display','flex');
		setTimeout("$('#overdiv').css('display','none')" , 100);
		return true;
	}
	
	$('#ChatBtnSet > *').eq(1).attr('disabled', 'disabled');
	
	updateItem(0,items);
	
}

const makeQuery = (query , length , fieldname , askIndex) => {
	
	$.post( location.href.replace(routeRoute , 'extension/module/chatgptseo/call' ) , {request: query , tokens: length } , (data) => {
		data = JSON.parse(data);
		if(data.error){
			alert(data.error.message);
		}
		
		let answer= data.choices[0].text.trim();
		let field = $('[name=\''+fieldname+'\']');
		statusInfo[askIndex] = 1;
		if(field.length){
			
			if(field.css('display') == 'none') // wysiwing
				field.summernote('code' , answer);
			else
				field.val(answer);
		}
		
		if(!checkWait())
			$('#overdiv').css('display','none');
		
	} ).fail( (e) => {
		console.log(e);
		alert('Error: - ' + query);
	}).always(() => {
		statusInfo[askIndex] = 1;
		if(!checkWait())
			$('#overdiv').css('display','none');
	});
	
}

const hideButtons = () => {
	document.getElementById('ChatBtnSet').style.display = 'none';
}

const initFieldRefresh = () => {
	for (const [field, value] of Object.entries(pageRule)) {
		$("*[name=\"" + value.selector + "\"]").change(() => {
			initFieldsValue(pageRule);
		});
		if(!value.stable){
			$( "<button onclick=\"updateField('"+field+"');return false;\" class=\"btn btn-success chatgptseo-refresh\"><i class=\"fa fa-refresh\"></i></button>" ).insertAfter( "*[name=\"" + value.selector + "\"]" );
		}
	}
}

const updateField = (field) => {
	
	if(!pageRule[field]['prompt']){
		alert("Can't to find that field");
	} else {
		
		let value = pageRule[field];
		const placeHolder = replaceVars(value['prompt'] , fieldsValue ).replaceAll("'" , '"');
		const apiQuery = prompt('' , placeHolder);
		
		if(apiQuery){
			$('#overdiv').css('display','flex');
			statusInfo = [0];
			makeQuery(apiQuery , value.maxLength?value.maxLength:90 , value.selector, 0 );
		}
	}
	return false;
}

const loadJson = () => {
	
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
					initFieldsValue(value);
					if(!isField && (location.href.indexOf('catalog/category') < 0) && (location.href.indexOf('catalog/product') <0) && (location.href.indexOf('editors/category') < 0) && (location.href.indexOf('editors/product') <0))
						hideButtons();
				}
			}
			initFieldRefresh();
		} catch {
			alert('Error loading JSON, chech up your json file!');
			hideButtons();
		};
	  }
	}
	
}

const initFieldsValue = (value) => {
	for (const [field, fieldSt] of Object.entries(value)) {
		let input = $("[name=\""+fieldSt.selector+"\"]");
		isField = isField || input.length > 0;
		if(input.css('display') == 'none')
			fieldsValue[field] = input.summernote('code');
		else
			fieldsValue[field] = input.val(); 
	}
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
	buttonGPT.disabled = !{{ status }};
	buttonGPT.innerHTML = "<i style=\" background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMTQwIDE0MCA1MjAgNTIwIj48cGF0aCBkPSJNNjE3LjI0IDM1NGExMjYuMzYgMTI2LjM2IDAgMCAwLTEwLjg2LTEwMy43OSAxMjcuOCAxMjcuOCAwIDAgMC0xMzcuNjUtNjEuMzIgMTI2LjM2IDEyNi4zNiAwIDAgMC05NS4zMS00Mi40OSAxMjcuODEgMTI3LjgxIDAgMCAwLTEyMS45MiA4OC40OSAxMjYuNCAxMjYuNCAwIDAgMC04NC41IDYxLjMgMTI3LjgyIDEyNy44MiAwIDAgMCAxNS43MiAxNDkuODYgMTI2LjM2IDEyNi4zNiAwIDAgMCAxMC44NiAxMDMuNzkgMTI3LjgxIDEyNy44MSAwIDAgMCAxMzcuNjUgNjEuMzIgMTI2LjM2IDEyNi4zNiAwIDAgMCA5NS4zMSA0Mi40OSAxMjcuODEgMTI3LjgxIDAgMCAwIDEyMS45Ni04OC41NCAxMjYuNCAxMjYuNCAwIDAgMCA4NC41LTYxLjNBMTI3LjgyIDEyNy44MiAwIDAgMCA2MTcuMjQgMzU0ek00MjYuNTggNjIwLjQ5YTk0Ljc5IDk0Ljc5IDAgMCAxLTYwLjg1LTIyYy43Ny0uNDIgMi4xMi0xLjE2IDMtMS43bDEwMS01OC4zNGExNi40MiAxNi40MiAwIDAgMCA4LjMtMTQuMzdWMzgxLjY5bDQyLjY5IDI0LjY1YTEuNTIgMS41MiAwIDAgMSAuODMgMS4xN3YxMTcuOTJhOTUuMTggOTUuMTggMCAwIDEtOTQuOTcgOTUuMDZ6bS0yMDQuMjQtODcuMjNhOTQuNzQgOTQuNzQgMCAwIDEtMTEuMzQtNjMuN2MuNzUuNDUgMi4wNiAxLjI1IDMgMS43OWwxMDEgNTguMzRhMTYuNDQgMTYuNDQgMCAwIDAgMTYuNTkgMGwxMjMuMzEtNzEuMnY0OS4zYTEuNTMgMS41MyAwIDAgMS0uNjEgMS4zMWwtMTAyLjEgNTguOTVhOTUuMTYgOTUuMTYgMCAwIDEtMTI5Ljg1LTM0Ljc5em0tMjYuNTctMjIwLjQ5YTk0LjcxIDk0LjcxIDAgMCAxIDQ5LjQ4LTQxLjY4YzAgLjg3LS4wNSAyLjQxLS4wNSAzLjQ4djExNi42OGExNi40MSAxNi40MSAwIDAgMCA4LjI5IDE0LjM2TDM3Ni44IDQ3Ni44bC00Mi42OSAyNC42NWExLjUzIDEuNTMgMCAwIDEtMS40NC4xM2wtMTAyLjExLTU5YTk1LjE2IDk1LjE2IDAgMCAxLTM0Ljc5LTEyOS44MXptMzUwLjc0IDgxLjYyLTEyMy4zMS03MS4yIDQyLjY5LTI0LjY0YTEuNTMgMS41MyAwIDAgMSAxLjQ0LS4xM2wxMDIuMTEgNTguOTVhOTUuMDggOTUuMDggMCAwIDEtMTQuNjkgMTcxLjU1VjQwOC43NWExNi40IDE2LjQgMCAwIDAtOC4yNC0xNC4zNnpNNTg5IDMzMC40NGMtLjc1LS40Ni0yLjA2LTEuMjUtMy0xLjc5bC0xMDEtNTguMzRhMTYuNDYgMTYuNDYgMCAwIDAtMTYuNTkgMGwtMTIzLjMxIDcxLjJ2LTQ5LjNhMS41MyAxLjUzIDAgMCAxIC42MS0xLjMxbDEwMi4xLTU4LjlBOTUuMDcgOTUuMDcgMCAwIDEgNTg5IDMzMC40NHptLTI2Ny4xMSA4Ny44Ny00Mi43LTI0LjY1YTEuNTIgMS41MiAwIDAgMS0uODMtMS4xN1YyNzQuNTdhOTUuMDcgOTUuMDcgMCAwIDEgMTU1LjktNzNjLS43Ny40Mi0yLjExIDEuMTYtMyAxLjdsLTEwMSA1OC4zNGExNi40MSAxNi40MSAwIDAgMC04LjMgMTQuMzZ6bTIzLjE5LTUwTDQwMCAzMzYuNTlsNTQuOTIgMzEuN3Y2My40Mkw0MDAgNDYzLjQxbC01NC45Mi0zMS43eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==); display: block; width: 22px; height: 21px; float: left; margin-right: 5px; zoom: 0.86; background-repeat: no-repeat; \"></i> ChatGPT SEO"; 
	buttonGPT.style.paddingBottom = '8px';
	buttonGPT.className = "btn btn-success";
	
	
	let btnSettings = document.createElement('button');
	btnSettings.innerHTML = '<i class="fa fa-sliders"></i>';
	btnSettings.disabled = !{{ status }};
	btnSettings.className = "btn btn-success";
	btnSettings.style.paddingBottom = '8px';
	$(btnSettings).attr('data-toggle' , 'tooltip').attr('data-original-title' , 'Config');
	
	let authorLink = document.createElement('a');
	authorLink.href="https://t.me/d1medrol"
	authorLink.target = "_blank";
	authorLink.innerHTML = '<i class="fa fa-support"></i>';
	authorLink.className = "btn btn-success";
	authorLink.style.paddingBottom = '8px';
	$(authorLink).attr('data-toggle' , 'tooltip').attr('data-original-title' , 'ChatGPT SEO Author');
	
	$(btnGroup).css({
		'float': 'left',
		'margin': '0 10px 0',
		'zIndex': '1'
	});
	
	btnGroup.appendChild(buttonGPT);
	btnGroup.appendChild(btnSettings);
	btnGroup.appendChild(authorLink);
	
	buttonGPT.addEventListener('click' , btnClick );
	btnSettings.addEventListener('click' , btnClickSettings );
	
	
	
	let over = document.createElement('div');
	over.id = 'overdiv';
	over.innerHTML = '<i class="fa-5x fa fa-spinner"></i><style>.fa-spinner {animation: spin 5s infinite linear;-webkit-animation: spin2 5s infinite linear;}@keyframes spin {from {transform: scale(1) rotate(0deg);}to {transform: scale(1) rotate(360deg);}}@-webkit-keyframes spin2 {from {-webkit-transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);}}.chatgptseo-refresh{float: right;right: 15px;z-index:5;position: absolute;top: 0;border-radius: 5px;}</style>';
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
	
	loadJson();
	
	
	let modal = document.createElement('div');
	modal.innerHTML = '<div id="modalEditorConfig" class="modal" role="dialog"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="alert alert-success hide" role="alert" id="sca">{{ success }}</div><div class="modal-header"><button type="button" class="close" data-dismiss="modal">x</button><h4 class="modal-title">ChatGPT Config Editor</h4></div><div class="modal-body"><div id="jsoneditor"></div></div><div class="modal-footer"><button id="saveJsonEditor" type="button" class="btn btn-success">{{ save }}</button></div></div></div></div>';
	
	document.body.appendChild(modal);
	$("#content .page-header .pull-right:last")[0].appendChild(btnGroup);
	
	document.getElementById('saveJsonEditor').addEventListener('click' , () => {
	  $.post( location.href.replace(routeRoute , 'extension/module/chatgptseo/saveCnfg' ) , {json: jsonEditor.getText() } , (data) => {
		loadJson();
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


/* v.1.2.2 - by md2d*/ 
const allowedPaths = [	
	'{{ allowedPaths }}'
];


let nTokens = parseInt("{{ nTokens }}") ;
nTokens = nTokens > 0 ? nTokens : 1;
let fieldsValue = [] , pageRule = [] , statusInfo=[] , jsonEditor, jsonText, globalRule, tokens = [], isField = false , isWorker = false;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const routeRoute = urlParams.get('route');

const btnWaitingText = "<i class=\"fa-gpt\"></i> ChatGPT SEO <i class=\"fa fa-play\"></i>";



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

const stripTags = (html) =>
{
   return html.replace(/<[^>]*>?/gm, ' '); //$(html).text();
}

const btnClickSettings = () => {
	
	$('#modalEditorConfig').modal('show');
	initJsonEditor()
	
}

const changeBtnStyle = (isGreen) => {
	const danger = "btn-warning";
	const success = "btn-success";
	$('#ChatBtnSet > *').each( function() {
		if(isGreen)
			$(this).removeClass(danger).addClass(success);
		else 
			$(this).removeClass(success).addClass(danger);
	} );
}

const replaceVars = (string , vars) => {
	//console.log(vars)
	let newstr = string
	for (const [field, value] of Object.entries(vars)) {		
		newstr = newstr.replaceAll('{' +field+ '}' ,  pageRule[field].onlyText ? stripTags(value) :value );
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

const removeElementByIndex = (arr, index) => {
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
}

const warningMsg = (msg) => {
	return '<div class="alert alert-warning alert-dismissible"><i class="fa fa-check-circle"></i> '+msg+'<button type="button" class="close" data-dismiss="alert">×</button> </div>';
}

const massiveUpdate = () => {
	
	let items = [];
	$("input[name=\"selected[]\"]:not(\".done\"):checked").each(function(){
		items.push(this.value);
	});
	items.reverse();
	
	
	if(!isWorker && items.length == 0){
		$('#overdiv').css('display','flex');
		setTimeout("$('#overdiv').css('display','none')" , 100);
		return true;
	}
	
	isWorker = !isWorker;
	isWorker ? $('#ChatBtnSet > *').eq(0).find('.fa-play').removeClass('fa-play').addClass('fa-pause') : $('#ChatBtnSet > *').eq(0).find('.fa-pause').removeClass('fa-pause').addClass('fa-play');
	
	changeBtnStyle(!isWorker);
	
	if(!isWorker) return 0;
	tokens.length = 0;
	for(let i=0; i < nTokens; i++){
		tokens.push(i);
	}
	
	const updateItem = (arr,keySeeker) => { 
		
		if(!keySeeker)
			keySeeker = 0;
		
		if( arr.length == 0 ){
			$('#ChatBtnSet > *').eq(1).attr('disabled', false);
			isWorker = false;
			$('#ChatBtnSet > *').eq(0).find('.fa-pause').removeClass('fa-pause').addClass('fa-play');
			changeBtnStyle(true);
			return 0;
		}
		
		if(!isWorker)
			return 0;
		
		const itemId = arr.pop();
		
		let icon = document.createElement('div');
		icon.id = 'icon-'+itemId;
		icon.className = "fa fa-spinner";
		$("input[value='"+itemId+"']").first().addClass('done').parent()[0].appendChild(icon);
		let isConnect = false;
		const type = (location.href.indexOf('catalog/category') > 0 || location.href.indexOf('editors/category') > 0) ? 'category':'product';
		
		$.getJSON( location.href.replace(routeRoute , 'extension/module/chatgptseo/massiveUpdate' )+'&keySeeker='+keySeeker+'&id='+itemId+'&type='+type ,  (data) => {
			try{
				console.log(itemId + ' - ' , data);
				let json = data;
				if(json.updateFields){
					Object.keys(json.updateFields).forEach(key => {
					  isConnect = isConnect + json.updateFields[key]*1;
					});
					
					if(!isConnect){ // key is exceeded
						console.log('Script haven\'t a connect with OpenAI: keySeeker №' + (json.keySeeker*1+1));
						removeElementByIndex(tokens , parseInt(json.keySeeker) );
					}
				}

				if(json.success == 1 && isConnect)
					$("input[value='"+itemId+"']").first().parent().parent().css('background', 'rgba(75,175,80,0.17)');
				else {
					$("input[value='"+itemId+"']").first().parent().parent().css('background', '#f26a603d');
				}
			} catch(e){
				console.log(itemId , e);
			}
			
		  }
		  
		  ).done(function() {
			if(isConnect)
				updateItem( arr, keySeeker);
		  })
		  .fail(function() {
			updateItem( arr, keySeeker);
			$("input[value='"+itemId+"']").eq(0).parent().parent().css('background', '#f26a603d');
		  })
		  .always(function() {
			$('#icon-'+itemId).remove();
		  });
	}
	
	
	$('#ChatBtnSet > *').eq(1).attr('disabled', 'disabled');
	
	for (let i = 0; i < Math.min(tokens.length , items.length); i++ ){
		updateItem(items, tokens[i] );
	}
	
}

const makeQuery = (query , length , fieldname , askIndex) => {
	
	const keyIndex = Math.ceil( Math.random() * nTokens) - 1;
	
	$.post( location.href.replace(routeRoute , 'extension/module/chatgptseo/call' ) , {request: query , keySeeker: keyIndex , tokens: length } , (data) => {
		data = JSON.parse(data);
		if(data.error){
			alert(data.error.message);
		}
		
		let answer= data.choices[0].text.trim();
		let field = $('[name=\''+fieldname+'\']');
		statusInfo[askIndex] = 1;
		if(field.length){
			
			if(field.css('display') == 'none'){ // wysiwing ckeditor and summernote
				answer = breakHtml(answer);
				if(typeof(tinymce) !== "undefined")
					tinymce.get(field.attr('id')).setContent(answer);
				else if(typeof(CKEDITOR) !== "undefined")
					CKEDITOR.instances[field.attr('id')].setData(answer);
				else
					field.summernote('code' , answer);
			}
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

const breakHtml = (str) => {
  str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');
  return str;
}

const hideButtons = () => {
	if(document.getElementById('ChatBtnSet'))
		document.getElementById('ChatBtnSet').style.display = 'none';
}

const initFieldRefresh = () => {
	for (const [field, value] of Object.entries(pageRule)) {
		$("*[name=\"" + value.selector + "\"]").change(() => {
			initFieldsValue(pageRule);
		});
		if(!value.stable){
			$( "<button onclick=\"updateField('"+field+"');return false;\" class=\"btn btn-success chatgptseo-refresh\"><i class=\"fa fa-gpt\"></i></button>" ).insertAfter( "*[name=\"" + value.selector + "\"]" );
		}
	}
}

const updateField = (field) => {
	try{
		initFieldsValue(pageRule);
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
	}catch(error){
		console.log(error);
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
					if(!isField && (location.href.indexOf('catalog/category') < 0) && (location.href.indexOf('catalog/product') <0) && (location.href.indexOf('editors/category') < 0) && (location.href.indexOf('editors/product') <0) && (location.href.indexOf('extension/product_extra') <0) )
						hideButtons();
				}
			}
			initFieldRefresh();
		} catch (exception){
			alert('Error loading JSON, chech up your json file!');
			console.log(exception);
			hideButtons();
		};
	  }
	}
	
}

const initFieldsValue = (value) => {
	for (const [field, fieldSt] of Object.entries(value)) {
		let input = $("[name=\""+fieldSt.selector+"\"]");
		isField = isField || input.length > 0;
		if(input.css('display') == 'none'){
			if(typeof(tinymce) !== "undefined")
				fieldsValue[field] = tinymce.get( input.attr('id') ).getContent();
			else if(typeof(CKEDITOR) !== "undefined")
				fieldsValue[field] = CKEDITOR.instances[input.attr('id')].getData();
			else
				fieldsValue[field] = input.summernote('code');
		}
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
	buttonGPT.disabled = !({{ status }}) ;
	buttonGPT.innerHTML = btnWaitingText; 
	buttonGPT.style.paddingBottom = '8px';
	buttonGPT.style.outline = 'none';
	buttonGPT.className = "btn btn-success";
	
	
	let btnSettings = document.createElement('button');
	btnSettings.innerHTML = '<i class="fa fa-sliders"></i>';
	btnSettings.disabled = ! ({{ status }}) ;
	btnSettings.className = "btn btn-success";
	btnSettings.style.paddingBottom = '8px';
	btnSettings.style.outline = 'none';
	$(btnSettings).attr('data-toggle' , 'tooltip').attr('data-original-title' , 'Config');
	
	let authorLink = document.createElement('a');
	authorLink.href="https://t.me/d1medrol"
	authorLink.target = "_blank";
	authorLink.innerHTML = '<i class="fa fa-support"></i>';
	authorLink.className = "btn btn-success";
	authorLink.style.paddingBottom = '8px';
	authorLink.style.outline = 'none';
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
	over.innerHTML = '<i class="fa-5x fa fa-spinner"></i><style>.fa-spinner {animation: spin 5s infinite linear;-webkit-animation: spin2 5s infinite linear;}@keyframes spin {from {transform: scale(1) rotate(0deg);}to {transform: scale(1) rotate(360deg);}}@-webkit-keyframes spin2 {from {-webkit-transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);}}*{outline:none}.chatgptseo-refresh{float: right;right: 15px;z-index:5;position: absolute;top: 0;border-radius: 5px;}.jsoneditor input{max-height:10px;} textarea{resize:vertical} .fa-gpt{background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMTQwIDE0MCA1MjAgNTIwIj48cGF0aCBkPSJNNjE3LjI0IDM1NGExMjYuMzYgMTI2LjM2IDAgMCAwLTEwLjg2LTEwMy43OSAxMjcuOCAxMjcuOCAwIDAgMC0xMzcuNjUtNjEuMzIgMTI2LjM2IDEyNi4zNiAwIDAgMC05NS4zMS00Mi40OSAxMjcuODEgMTI3LjgxIDAgMCAwLTEyMS45MiA4OC40OSAxMjYuNCAxMjYuNCAwIDAgMC04NC41IDYxLjMgMTI3LjgyIDEyNy44MiAwIDAgMCAxNS43MiAxNDkuODYgMTI2LjM2IDEyNi4zNiAwIDAgMCAxMC44NiAxMDMuNzkgMTI3LjgxIDEyNy44MSAwIDAgMCAxMzcuNjUgNjEuMzIgMTI2LjM2IDEyNi4zNiAwIDAgMCA5NS4zMSA0Mi40OSAxMjcuODEgMTI3LjgxIDAgMCAwIDEyMS45Ni04OC41NCAxMjYuNCAxMjYuNCAwIDAgMCA4NC41LTYxLjNBMTI3LjgyIDEyNy44MiAwIDAgMCA2MTcuMjQgMzU0ek00MjYuNTggNjIwLjQ5YTk0Ljc5IDk0Ljc5IDAgMCAxLTYwLjg1LTIyYy43Ny0uNDIgMi4xMi0xLjE2IDMtMS43bDEwMS01OC4zNGExNi40MiAxNi40MiAwIDAgMCA4LjMtMTQuMzdWMzgxLjY5bDQyLjY5IDI0LjY1YTEuNTIgMS41MiAwIDAgMSAuODMgMS4xN3YxMTcuOTJhOTUuMTggOTUuMTggMCAwIDEtOTQuOTcgOTUuMDZ6bS0yMDQuMjQtODcuMjNhOTQuNzQgOTQuNzQgMCAwIDEtMTEuMzQtNjMuN2MuNzUuNDUgMi4wNiAxLjI1IDMgMS43OWwxMDEgNTguMzRhMTYuNDQgMTYuNDQgMCAwIDAgMTYuNTkgMGwxMjMuMzEtNzEuMnY0OS4zYTEuNTMgMS41MyAwIDAgMS0uNjEgMS4zMWwtMTAyLjEgNTguOTVhOTUuMTYgOTUuMTYgMCAwIDEtMTI5Ljg1LTM0Ljc5em0tMjYuNTctMjIwLjQ5YTk0LjcxIDk0LjcxIDAgMCAxIDQ5LjQ4LTQxLjY4YzAgLjg3LS4wNSAyLjQxLS4wNSAzLjQ4djExNi42OGExNi40MSAxNi40MSAwIDAgMCA4LjI5IDE0LjM2TDM3Ni44IDQ3Ni44bC00Mi42OSAyNC42NWExLjUzIDEuNTMgMCAwIDEtMS40NC4xM2wtMTAyLjExLTU5YTk1LjE2IDk1LjE2IDAgMCAxLTM0Ljc5LTEyOS44MXptMzUwLjc0IDgxLjYyLTEyMy4zMS03MS4yIDQyLjY5LTI0LjY0YTEuNTMgMS41MyAwIDAgMSAxLjQ0LS4xM2wxMDIuMTEgNTguOTVhOTUuMDggOTUuMDggMCAwIDEtMTQuNjkgMTcxLjU1VjQwOC43NWExNi40IDE2LjQgMCAwIDAtOC4yNC0xNC4zNnpNNTg5IDMzMC40NGMtLjc1LS40Ni0yLjA2LTEuMjUtMy0xLjc5bC0xMDEtNTguMzRhMTYuNDYgMTYuNDYgMCAwIDAtMTYuNTkgMGwtMTIzLjMxIDcxLjJ2LTQ5LjNhMS41MyAxLjUzIDAgMCAxIC42MS0xLjMxbDEwMi4xLTU4LjlBOTUuMDcgOTUuMDcgMCAwIDEgNTg5IDMzMC40NHptLTI2Ny4xMSA4Ny44Ny00Mi43LTI0LjY1YTEuNTIgMS41MiAwIDAgMS0uODMtMS4xN1YyNzQuNTdhOTUuMDcgOTUuMDcgMCAwIDEgMTU1LjktNzNjLS43Ny40Mi0yLjExIDEuMTYtMyAxLjdsLTEwMSA1OC4zNGExNi40MSAxNi40MSAwIDAgMC04LjMgMTQuMzZ6bTIzLjE5LTUwTDQwMCAzMzYuNTlsNTQuOTIgMzEuN3Y2My40Mkw0MDAgNDYzLjQxbC01NC45Mi0zMS43eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==); background-position: center; background-size: contain; transform:scale(1.19); -moz-transform:scale(1.19); display: block; width: 22px; min-height: 17px;  float: left; margin-right: 5px; background-repeat: no-repeat;}#ChatBtnSet .fa-play,#ChatBtnSet .fa-pause{padding-left:5px}</style>';
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
	
	
	if($("#content .page-header .pull-right:last").length)
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

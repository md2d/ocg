/* v.1.0 - by md2d */
const allowedPaths = ['catalog/product'];

const initLoader = () => {
  
  let checkUrl = false;
  
  allowedPaths.forEach(
    (url) => {
      if( !checkUrl && location.href.indexOf(url) > 0 )
        checkUrl = true;
    });
    
    if(!checkUrl) 
      return '';
  
}

initLoader();

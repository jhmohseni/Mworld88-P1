var documentRoot;
var FS = {};
FS.assets = {};
FS.remotePath = 'http://dev.cybertronindia.com/uvmate-assets/';
var appBasePath = FS.localPath = 'css';


var spaceCounter = 0,
spaceFiles = 0;
function getSuccess(parent) {
	navigator.notification.alert('JSON.stringify(parent)');
}

function getFailed(error) {
	navigator.notification.alert('JSON.stringify(error)');
}

$(document).on('fsready', function(){
	documentRoot = FS.fs.root.fullPath;
	appBasePath = documentRoot + '/';
});

function getDirectoryPath(src) {
	if(src.indexOf('/') != -1)
		return src.substring(0, src.lastIndexOf('/'));

	return '/';
}

function downloadFilesLogic(ft, selectorDiv, filesArray, nextPage) {
	var imgCount = 0, completeCount = 0, failCount = 0, failedFiles = [];
	spaceFiles = 0;
	var len = filesArray.length;
	imgCount += len;
	spaceCounter = 100/len;
	var i,j,chunk = 3;

	var tempdata = filesArray;
	downloadChunk();

	function downloadChunk(){
		var piece = tempdata.slice(0,chunk);
		var queue = piece.length;
		if(!tempdata.length){  return; }
		tempdata = tempdata.slice(chunk);
		piece.forEach(function(img){
			
			var url = FS.remotePath + img.src,
			base = documentRoot + '/' + img.src;

			var fs_success = function(){
				//complete && complete(++completeCount,imgCount);
				len--;
				++completeCount;
				progressLoading(selectorDiv, filesArray, nextPage);
				if(completeCount + failCount === imgCount){					
					downloadingComplete(ft, failCount, failedFiles);
					preLoadFiles(filesArray, selectorDiv, nextPage);
					//success && success(completeCount, failCount, imgCount);
				}
				if(--queue === 0){
					downloadChunk();
				}
			};

			var fs_fail = function(){
				ft.download(
					url,
					base,
					function(file){
						len--;
						completeCount++;
						progressLoading(selectorDiv, filesArray, nextPage);
						if(completeCount + failCount === imgCount){							
							downloadingComplete(ft, failCount, failedFiles);
							preLoadFiles(filesArray, selectorDiv, nextPage);
						}
						if(--queue === 0){
							downloadChunk();
						}
					},
					function(error){
						failCount++;
						img['code'] = error.http_status;
						failedFiles.push(img);
						progressLoading(selectorDiv, filesArray, nextPage);
						if(completeCount + failCount === imgCount){
							downloadingComplete(ft, failCount, failedFiles);
							preLoadFiles(filesArray, selectorDiv, nextPage);
						}
						if(--queue === 0){
							downloadChunk();
						}
					}
				);
			}

			FS.fs.root.getFile(base,null, fs_success , fs_fail );

		});
	}

}

function downloadingComplete(ft, failCount, failedFiles) {
		
	if(failCount > 0) {
		$.each(failedFiles, function(k, v){
			downloadFile(ft, v.src, v.code);
		});
	}
}

// (selectorDiv, filesArray, nextPage) deprecated arguments
function downloadFile(ft, path, status) {
	//if(status != 404)
	if(status == 404) 
		return;

	var url = FS.remotePath + path,
	base = documentRoot + '/' + path;

	ft.download(
		url,
		base,
		function(file){
			//progressLoading(selectorDiv, filesArray, nextPage);
		},
		function(error){
			//navigator.notification.alert('error');
		}
	);
}

function progressLoading(selectorDiv, filesArray, nextPage) {
	spaceFiles += parseFloat(spaceCounter.toFixed(2));
	spaceFiles = (parseInt(spaceFiles) == 100) ? 100 : spaceFiles;
	selectorDiv.html('Downloading '+spaceFiles.toFixed(1)+'%');
	//selectorDiv.html('Downloading '+spaceFiles.toFixed(1)+' -- '+spaceFiles+' -- '+spaceCounter);
	if(spaceFiles == 100){
		//preLoadFiles(filesArray, selectorDiv, nextPage);
	}
}

function loadAppFiles(filesArray, statusSelector, nextPage, networkStatus) {
	var ft = new FileTransfer();
	// $.each( filesArray, function(ix, fn) {
	downloadFilesLogic(ft, statusSelector, filesArray, nextPage);          
	// });
}


function preLoadFiles(filesArray, selectorDiv, nextPage) {
	var spaceManifest = filesArray,
	spaceImagesPath = documentRoot+'/'; //FS.remotePath;
	app.preloadSpace = new createjs.LoadQueue(false, spaceImagesPath);
	app.preloadSpace.addEventListener('complete', function() {
		$.mobile.changePage( nextPage, { transition: "flip" });
	}); 
	app.preloadSpace.addEventListener('progress', function(){
		selectorDiv.html("Loading "+ (app.preloadSpace.progress*100|0) + '%');
	}); 
	app.preloadSpace.loadManifest(spaceManifest);
}



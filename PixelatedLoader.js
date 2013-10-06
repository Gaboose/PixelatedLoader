var PixelatedLoader=(function(){
	//Executes added functions in the order they were added
	var Synchronizer=function(){
		var functionArray=[];
		var readyToExecute={};
		function _executeArray(){
			while(functionArray.length>0&&readyToExecute[functionArray[0]]){
				var func=functionArray.shift();
				delete readyToExecute[func];
				func();
			}
		}
		return{
			add:function(func){
				functionArray.push(func);
			},
			execute:function(func){
				readyToExecute[func]=true;
				_executeArray();
			}
		}
	};

	var HEADER_UINT_BYTES=4;

	function _binarize(str){
		var result="";
		for(var i=0;i<str.length;i++)
			result+=String.fromCharCode(str.charCodeAt(i)&0xff);
		return result;
	}
	function _decode_ints(str){
		str=_binarize(str);
		var result=[];
		while(str.length>=HEADER_UINT_BYTES){
			var entry=0;
			for(var i=HEADER_UINT_BYTES-1;i>=0;i--){
				entry*=256;
				entry+=str.charCodeAt(i);
			}
			result.push(entry);
			str=str.substr(HEADER_UINT_BYTES);
		}
		return result;
	}
	function _decToHex(dec,len){
	    var hex=dec.toString(16);
	    while(hex.length<len)
	    	hex="0"+hex;
	    return hex;
	}
	return {
		load:function(canvas,url){
			function readHead1(){
				var len=HEADER_UINT_BYTES*3;
				if(!xhr.response||xhr.response.length<pos+len)
					return false;
				var ints=_decode_ints(xhr.response.substr(pos,len));
				baseWidth=ints[0];
				baseHeight=ints[1];
				slices=ints[2];
				imageWidth=baseWidth*Math.pow(2,slices-1);
				imageHeight=baseHeight*Math.pow(2,slices-1);
				canvas.width=imageWidth;
				canvas.height=imageHeight;
				pos+=len;
				return true;
			}
			function readHead2(){
				var len=HEADER_UINT_BYTES*slices;
				if(xhr.response.length<pos+len)
					return false;
				sliceLens=_decode_ints(xhr.response.substr(pos,len));
				pos+=len;
				return true;
			}
			function readBase(){
				var len=sliceLens[0];
				if(xhr.response.length<pos+len)
					return false;
				var img=new Image();
				img.onload=function(){
					offCanvas.width=img.width;
					offCanvas.height=img.height;
		        	offContext.drawImage(img,0,0);
					var slicePix=offContext.getImageData(0,0,img.width,img.height).data;
					var pixelSide=imageHeight/img.height;
					for (var x=0;x<img.width;x++){
						for (var y=0;y<img.height;y++){
							context.beginPath();
							context.rect(x*pixelSide,y*pixelSide,pixelSide,pixelSide);
							var i=(x+y*img.width)*4;
							context.fillStyle="#"+_decToHex(slicePix[i]*0x10000+slicePix[i+1]*0x100+slicePix[i+2],6);
							context.fill();
						}
					}
		        };
				img.src="data:image/jpeg;base64,"+window.btoa(_binarize(xhr.response.substr(pos,len)));
				pos+=len;
				slicesStarted=1;
				return true;
			}
			function readSlice(){
				var len=sliceLens[slicesStarted];
				if(xhr.response.length<pos+len)
					return false;
				var img=new Image();
				sync.add(drawPixels);
				img.onload=function(){sync.execute(drawPixels);};
				function drawPixels(){
					offCanvas.width=img.width;
					offCanvas.height=img.height;
		        	offContext.drawImage(img,0,0);
					var slicePix=offContext.getImageData(0,0,img.width,img.height).data;
					var imgdata=context.getImageData(0,0,imageWidth,imageHeight);
					var pix=imgdata.data;

					var basePixelSide=imageHeight/img.height;
					var pixelSide=basePixelSide/2;
					var baseWidth=img.width/3;
					var slicei=0;

					for(var y=0;y<img.height;y++){
						for(var x=0;x<baseWidth;x++){
							var red=slicePix[slicei++];
							var green=slicePix[slicei++];
							var blue=slicePix[slicei++];
							slicei++;
							for (var n=0;n<pixelSide;n++){
								var canvasi=(x*basePixelSide+pixelSide+(y*basePixelSide+n)*canvas.width)*4;
								for(var m=0;m<pixelSide;m++){
									pix[canvasi++]=red;
									pix[canvasi++]=green;
									pix[canvasi++]=blue;
									canvasi++;
								}
							}
							red=slicePix[slicei++];
							green=slicePix[slicei++];
							blue=slicePix[slicei++];
							slicei++;
							for (var n=0;n<pixelSide;n++){
								var canvasi=(x*basePixelSide+(y*basePixelSide+pixelSide+n)*canvas.width)*4;
								for(var m=0;m<pixelSide;m++){
									pix[canvasi++]=red;
									pix[canvasi++]=green;
									pix[canvasi++]=blue;
									canvasi++;
								}
							}
							red=slicePix[slicei++];
							green=slicePix[slicei++];
							blue=slicePix[slicei++];
							slicei++;
							for (var n=0;n<pixelSide;n++){
								var canvasi=(x*basePixelSide+pixelSide+(y*basePixelSide+pixelSide+n)*canvas.width)*4;
								for(var m=0;m<pixelSide;m++){
									pix[canvasi++]=red;
									pix[canvasi++]=green;
									pix[canvasi++]=blue;
									canvasi++;
								}
							}
						}
					}
					context.putImageData(imgdata,0,0);
		        };
				img.src="data:image/jpeg;base64,"+window.btoa(_binarize(xhr.response.substr(pos,len)));
				pos+=len;
				return ++slicesStarted>=slices;
			}

			var baseWidth;
			var baseHeight;
			var slices;
			var imageWidth;
			var imageHeight;
			var sliceLens;

			var context=canvas.getContext("2d");
			var offCanvas=document.createElement("canvas");
			var offContext=offCanvas.getContext("2d");

			var pos=0;
			var slicesStarted=0;
			var sync = Synchronizer();

			var xhr=new XMLHttpRequest();
			xhr.open("get",url,true);
			xhr.responseType="text";
			xhr.overrideMimeType("text\/plain; charset=x-user-defined");

			var i=0;
			var parsers=[readHead1,readHead2,readBase,readSlice];

			//Try to parse data on each progress event.
			xhr.addEventListener("progress",function(event){
				while(i<parsers.length&&parsers[i]())i++;
			});

			//Finish parsing data
			xhr.onload=function(){
				intervalID=setInterval(function(){
					if(i<parsers.length){
						if(parsers[i]()) i++;
					}else{
						clearInterval(intervalID);
					}
				},50);
			}
			xhr.send();
		}
	};
})();
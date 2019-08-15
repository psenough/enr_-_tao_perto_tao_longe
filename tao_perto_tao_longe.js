
var sync_stuff = false;

rand = function(n){
	return 0|(Math.random()*n);
};

var D = document;
var b = D.body;
var Ms = b.style;
Ms.margin='0px';
var blackcolor = Ms.background = "#000";
Ms.overflow = 'hidden';
var c = document.getElementById('c');

var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
//var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
//var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
var is_safari = navigator.userAgent.indexOf("Safari") > -1;
//var is_opera = navigator.userAgent.indexOf("Presto") > -1;
if ((is_chrome)&&(is_safari)) {is_safari=false;}

var backgroundAudio;
var analyser;
var bufferLength;
var dataArray;
				
function initAudio( cb ) {
	var context;
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		if (backgroundAudio != undefined) backgroundAudio.stop();
		context = new AudioContext();

		var request = new XMLHttpRequest();
		//if (is_safari) request.open('GET', 'esem_gre_ii.m4a', true);
		//	else request.open('GET', 'esem_gre_ii.ogg', true);		
		if (is_safari) request.open('GET', 'audio/himalayha_-_tao_perto_tao_longe.m4a', true);
			else request.open('GET', 'audio/himalayha_-_tao_perto_tao_longe.ogg', true);
		request.responseType = 'arraybuffer';
		console.log('requesting');

		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
	  
				backgroundAudio = context.createBufferSource(); 	// creates a sound source
				backgroundAudio.buffer = buffer;                    // tell the source which sound to play
				backgroundAudio.connect(context.destination);       // connect the source to the context's destination (the speakers)
				backgroundAudio.loop = false;
				//backgroundAudio.start(0);
				
				analyser = context.createAnalyser();
				analyser.fftSize = 256;
				bufferLength = analyser.fftSize;
				dataArray = new Uint8Array(bufferLength);
				analyser.getByteTimeDomainData(dataArray);
				backgroundAudio.connect(analyser);
				/*analyser.connect(context.destination);*/
				
				// start canvas
				//drawCanvas();
	  
				console.log('decoded');

				cb();
	  
			}, function(evt) {
				console.log('failed to load buffer');
				console.log(evt);
			});
		}
		request.send();

	} catch(e) {
		console.log('Web Audio API is not supported in this browser');
		console.log(e);
		//drawCanvas();
	}
}

var img_ref_spring = [];
var img_ref_winter = [];

var img_ref_global = [];

function ImageLoader(Ref, ImgDir, Images, Callback){
    // Keep the count of the verified images
    var allLoaded = 0;

    // The object that will be returned in the callback
    var _log = {
        success: [],
        error: []
    };

    // Executed everytime an img is successfully or wrong loaded
    var verifier = function(){
        allLoaded++;

        // triggers the end callback when all images has been tested
        if(allLoaded == Images.length){
			//console.log(_log);
            Callback.call(undefined, _log);
        }
    };

    // Loop through all the images URLs
    for (var index = 0; index < Images.length; index++) {
        // Prevent that index has the same value by wrapping it inside an anonymous fn
        (function(i){
            // Image path providen in the array e.g image.png
            var imgSource = Images[i];
            var img = new Image();
            
            img.addEventListener("load", function(){
                _log.success.push(imgSource);
                verifier();
            }, false); 
            
            img.addEventListener("error", function(err){
                _log.error.push(imgSource);
                verifier();
            }, false); 
           //console.log(img_dir + imgSource);
            img.src = ImgDir + imgSource;
			
			Ref.push(img);
        })(index);
    }
}

var vignette;

b.onload = function() {
	
	vignette = new Image();
    vignette.src = './gfx/reference_vignette.png';
	vignette.addEventListener("load", function(){
		console.log('my vignette is dark and long!');
	}, false);
	
	ImageLoader(img_ref_spring, './gfx/spring3_ddg/', spring3_ddg, 
		function(result){
			if(result.error.length != 0){
				console.log("The following images couldn't be properly loaded: ", result.error);
			}

			ImageLoader(img_ref_winter, './gfx/winter1_ddg/', winter1_ddg, 
				function(result){
					if(result.error.length != 0){
						// outputs: ["example.png", "example.jpg"]
						console.log("The following images couldn't be properly loaded: ", result.error);
					}

					img_ref_global = img_ref_spring.concat(img_ref_winter);
					
					// outputs: ["http://i.imgur.com/fHyEMsl.jpg"]
					console.log("The following images were succesfully loaded: ", result.success);
					//init();
					initAudio( function(){
						let dom = document.getElementById('btn');
						if (dom) {
							dom.value = 'Start Demo!';
							dom.disabled = false;
						}
					} );
			});
	});
	
}

var w;
var h;
var ctx;
var values = [];

var init_time = (new Date()).getTime();

let scheduled_pings;

let avg = 0.0;

function drawCanvas() {

	var num_nodes = 120;

	var sync = 100;
	var csync = 0;
	var bsync = 0;

	var bgcolor = 'rgba(0,0,0,1.0)';
	
	function drawSpectrum() {	
		analyser.getByteTimeDomainData(dataArray);
		let wb = w / bufferLength;	
		for(let i = 0; i < bufferLength; i++) {
			let v = dataArray[i] / bufferLength;
			let d = (1.0+Math.sin(v*20.0))*v*10.0;			
			color = "rgba(255,255,255,"+v*0.25+")";
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(i*wb-d,0);
			ctx.lineTo(i*wb+wb+d,0);
			ctx.lineTo(i*wb+wb+d,h);
			ctx.lineTo(i*wb-d,h);
			ctx.fill();
		}
	}
	
	function drawPings(timer) {
		let img_ref = img_ref_global;
		//if (timer < 96000) img_ref = img_ref_spring;
		//	else img_ref = img_ref_winter;

		for (let j=0; j<scheduled_pings.length; j++) {
			let timed = timer-scheduled_pings[j]['inittime'];
			if ((timed > 0) && (timed < 9000)) {
				let initimg = scheduled_pings[j]['initimg'];
				let initx = scheduled_pings[j]['initx'];
				let inity = scheduled_pings[j]['inity'];
				let niter = scheduled_pings[j]['niter'];
				let speed = scheduled_pings[j]['speed'];
				let width = scheduled_pings[j]['width'];
				ctx.save();
				var im = initimg+niter; //img_ref.length;
				for (var i=initimg; i<im; i++) {
					ctx.beginPath();
					var radius = -width*im + width*(im-i) + timed*0.5 + width*initimg;
					//console.log(initx);
					if (radius > 0) {
						ctx.arc(initx, inity, radius, 0, 2 * Math.PI);
						ctx.clip();
						//ctx.drawImage(img_ref[i],0,0,w,h);
						var sx = 35.0+Math.sin(timer*0.0001)*35.0;
						var sy = 35.0-Math.cos(timer*0.0001)*35.0;
						ctx.drawImage(img_ref[i],sx,sy,img_ref[i].width-sx,img_ref[i].height-sy,-sx,-sy,w+sx*2,h+sy*2);
					}
				}
				ctx.restore();
			}
		}
		
	}
	
	requestAnimationFrame( animate );

	function animate() {
		let timer;
		if (skip == true) timer = skip_timer;
		 else timer = ((new Date()).getTime()-init_time);
		if (timer < 196800) {
			requestAnimationFrame( animate );
		} else {
			backToStartScreen();
		}
		if (sync_stuff == true) {
			let dom = document.getElementById('timer');
			if (dom) dom.innerText = timer;
		}
		ctx.clearRect(0,0,w,h);
		ctx.globalAlpha = 1.0;
		//console.log(avg);
		//ctx.drawImage(img_ref[1],0,0,w,h);
		drawPings(timer);
		drawSpectrum();
		ctx.drawImage(vignette,0,0,w,h);
	}
}

window.onresize = resize;

function resize() {
	w = window.innerWidth;
	h = window.innerHeight;
	
	c.setAttribute("width", w);
	c.setAttribute("height", h);
	
	ctx = c.getContext("2d");
	ctx.width = w;
	ctx.height = h;
}

var wi = 25; // winter starting index

function start() {
	let dom = document.getElementById('starter_menu');
	if (dom) {//dom.parentNode.removeChild(dom);
		dom.style.display = "none";
	}
	
	resize();
	scheduled_pings = [
		 {'inittime':     0, 'initimg':  0, 'initx': -w*0.05, 'inity': h*0.5, 'niter': 5, 'speed': 0.7, 'width': 350 }
		,{'inittime':  4600, 'initimg':  4, 'initx': w*1.05, 'inity': h*0.5, 'niter': 5, 'speed': 0.5, 'width': 300 }
		,{'inittime':  8000, 'initimg': 12, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.8, 'width': 50 }
		,{'inittime': 12000, 'initimg':  0, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.8, 'width': 50 }
		,{'inittime': 16000, 'initimg':  9, 'initx': -w*0.05, 'inity': h*0.5, 'niter': 5, 'speed': 0.7, 'width': 350 }
		,{'inittime': 20600, 'initimg': 13, 'initx': w*1.05, 'inity': h*0.5, 'niter': 5, 'speed': 0.5, 'width': 300 }
		,{'inittime': 24000, 'initimg': 19, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.3, 'width': 50 }
		,{'inittime': 28000, 'initimg': 15, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.3, 'width': 50 }
		,{'inittime': 32000, 'initimg': 16, 'initx': w*(0.4+Math.random()*0.2), 'inity': h*(0.4+Math.random()*0.2), 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 36000, 'initimg': 17, 'initx': w*(0.4+Math.random()*0.2), 'inity': h*(0.4+Math.random()*0.2), 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 40000, 'initimg':  1, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 50 }
		,{'inittime': 44000, 'initimg': 11, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 48000, 'initimg': 20, 'initx': w*0.2, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 48400, 'initimg': 21, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 48800, 'initimg': 22, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 49300, 'initimg': 23, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 52000, 'initimg':  0, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 52300, 'initimg':  2, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 52600, 'initimg':  3, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 56000, 'initimg':  7, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 56500, 'initimg':  8, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 57300, 'initimg':  9, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 58800, 'initimg': 10, 'initx': w*0.25, 'inity': h*0.5, 'niter': 6, 'speed': 0.2, 'width': 35 }
		,{'inittime': 59300, 'initimg': 10, 'initx': w*0.75, 'inity': h*0.5, 'niter': 6, 'speed': 0.2, 'width': 35 }
		,{'inittime': 60000, 'initimg':  1, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 64000, 'initimg': 23, 'initx': w*(0.4+Math.random()*0.2), 'inity': h*(0.4+Math.random()*0.2), 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 68000, 'initimg': 16, 'initx': w*(0.4+Math.random()*0.2), 'inity': h*(0.4+Math.random()*0.2), 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 70500, 'initimg':  2, 'initx': w*(0.4+Math.random()*0.2), 'inity': h*(0.4+Math.random()*0.2), 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 72000, 'initimg': 13, 'initx': w*0.2, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 72400, 'initimg':  4, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 72800, 'initimg':  5, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 73150, 'initimg':  6, 'initx': w*0.8, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 50 }
		,{'inittime': 74600, 'initimg':  8, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 76100, 'initimg':  9, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 76100, 'initimg': 10, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 76200, 'initimg': 11, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 76500, 'initimg': 12, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime': 80000, 'initimg': 13, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 84000, 'initimg': 14, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 86500, 'initimg': 15, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 88000, 'initimg':  1, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 88400, 'initimg':  2, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 88800, 'initimg':  3, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 89200, 'initimg':  4, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 50 }
		,{'inittime': 90600, 'initimg': 12, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 92000, 'initimg':  8, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 92200, 'initimg':  9, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 92500, 'initimg': 10, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime': 96000, 'initimg':  1+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 97000, 'initimg':  2+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 97500, 'initimg':  3+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime': 98000, 'initimg':  6+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':100000, 'initimg':  5+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':101100, 'initimg':  8+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':101500, 'initimg':  9+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':102000, 'initimg': 10+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':104000, 'initimg': 11+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':105100, 'initimg':  1+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':105500, 'initimg':  4+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':106000, 'initimg':  7+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':108000, 'initimg': 15+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
 		,{'inittime':109000, 'initimg': 19+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':109500, 'initimg': 20+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':110000, 'initimg': 21+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':112000, 'initimg': 22+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
 		,{'inittime':113000, 'initimg': 27+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':113500, 'initimg': 28+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':114000, 'initimg': 32+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

 		,{'inittime':115000, 'initimg': 29+wi, 'initx': w*0.25, 'inity': h*0.25, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':115500, 'initimg': 30+wi, 'initx': w*0.75, 'inity': h*0.75, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':116000, 'initimg':  0+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
 		,{'inittime':117000, 'initimg':  5+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':117500, 'initimg':  6+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':118000, 'initimg':  7+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':119000, 'initimg':  8+wi, 'initx': w*0.75, 'inity': h*0.75, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':119500, 'initimg':  9+wi, 'initx': w*0.25, 'inity': h*0.25, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':120000, 'initimg': 10+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
 		,{'inittime':121000, 'initimg': 15+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':121500, 'initimg': 16+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':122000, 'initimg': 17+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':123000, 'initimg': 18+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':123500, 'initimg': 19+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':124000, 'initimg': 20+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
 		,{'inittime':125000, 'initimg': 25+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':125500, 'initimg': 26+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':126000, 'initimg': 27+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':127000, 'initimg': 28+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':127500, 'initimg': 29+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':128000, 'initimg': 30+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.25, 'width': 50 }

 		,{'inittime':131000, 'initimg': 1+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':131500, 'initimg': 2+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
 		,{'inittime':132000, 'initimg': 3+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.25, 'width': 50 }
  		
		,{'inittime':135000, 'initimg': 4+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':135500, 'initimg': 5+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':136000, 'initimg': 6+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.3, 'width': 50 }

		,{'inittime':139000, 'initimg': 7+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':139500, 'initimg': 8+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':140000, 'initimg': 9+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.3, 'width': 20 }

		,{'inittime':143000, 'initimg': 11+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':143500, 'initimg': 12+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':144000, 'initimg': 13+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.3, 'width': 50 }
		,{'inittime':145000, 'initimg': 18+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':145500, 'initimg': 19+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':146000, 'initimg': 20+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':148000, 'initimg': 14+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':149000, 'initimg': 21+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':149500, 'initimg': 22+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 50 }
		,{'inittime':150000, 'initimg': 25+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':152000, 'initimg': 26+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':153000, 'initimg': 30+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':153500, 'initimg': 31+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':154000, 'initimg': 32+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		
		,{'inittime':156000, 'initimg': 33+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':157000, 'initimg': 0+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':157500, 'initimg': 1+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':158000, 'initimg': 2+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':159000, 'initimg': 3+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':159500, 'initimg': 4+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':160000, 'initimg': 5+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
				
		,{'inittime':161000, 'initimg': 9+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':161500, 'initimg': 10+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':162000, 'initimg': 21+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':163000, 'initimg': 12+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':163500, 'initimg': 13+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':164000, 'initimg': 14+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		,{'inittime':165000, 'initimg': 20+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':165500, 'initimg':  7+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':166000, 'initimg': 22+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':167000, 'initimg': 23+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':167500, 'initimg': 24+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':168000, 'initimg': 25+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }

		,{'inittime':169000, 'initimg': 29+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':169500, 'initimg': 30+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':170000, 'initimg':  0+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':171000, 'initimg': 32+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':171500, 'initimg': 33+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':172000, 'initimg':  1+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 3, 'speed': 0.5, 'width': 50 }
		
		,{'inittime':173000, 'initimg': 7+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':173500, 'initimg': 4+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':174000, 'initimg': 6+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':176000, 'initimg': 9+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 80 }
		,{'inittime':180000, 'initimg': 12+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 80 }
		
		,{'inittime':184000, 'initimg': 13+wi, 'initx': w*0.2, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 80 }
		,{'inittime':184400, 'initimg': 14+wi, 'initx': w*0.4, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':184800, 'initimg': 16+wi, 'initx': w*0.6, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':185200, 'initimg': 17+wi, 'initx': w*0.8, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':188000, 'initimg': 18+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 50 }
		,{'inittime':188300, 'initimg': 22+wi, 'initx': w*0.25, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }
		,{'inittime':188600, 'initimg': 20+wi, 'initx': w*0.75, 'inity': h*0.5, 'niter': 1, 'speed': 0.5, 'width': 50 }

		,{'inittime':192000, 'initimg': 21+wi, 'initx': w*0.5, 'inity': h*0.5, 'niter': 2, 'speed': 0.5, 'width': 80 }

	];
	backgroundAudio.start(0, 0);
	init_time = (new Date()).getTime();
	drawCanvas();
}

function backToStartScreen(){
	let dom = document.getElementById('starter_menu');
	if (dom) {//dom.parentNode.removeChild(dom);
		dom.style.display = "block";
	}
	initAudio(function(){});
}

document.addEventListener("keydown", keyDownTextField, false);

function keyDownTextField(e) {
	if (sync_stuff == false) return;
	var keyCode = e.keyCode;
	console.log(keyCode);

	switch(keyCode) {
		case 32: // space
			//init_time = (new Date()).getTime();
			if (skip == false) {
				enterSkip();
			} else {
				initAudio(function(){
						skip = false;
						init_time = (new Date()).getTime() - skip_timer;
						backgroundAudio.start(0, skip_timer/1000);
					});
			}
		break;
	}

}

function enterSkip() {
	skip_timer = (new Date()).getTime() - init_time;
	backgroundAudio.stop();
	backgroundAudio = undefined;
	skip = true;
}

var skip = false;
var skip_timer = 0;

window.addEventListener("wheel", function(e) {
	if (sync_stuff == false) return;
    //var dir = Math.sign(e.deltaY);
    //console.log(dir + ' ' + e.deltaY);
	if (skip == false) {
		enterSkip();
	}
	skip_timer += -e.deltaY;
	if (skip_timer < 0) skip_timer = 0;
});

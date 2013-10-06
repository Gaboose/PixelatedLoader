#PixelatedLoader

Incrementally unpixelate images while they load. **[See demo.](http://gaboose.github.io/PixelatedLoader/)**

##Usage

###1. Prepare images

Encode image to produce a **sparse** file.
```bash
ensperse.py <image filename>
```
Images like **jpg** and **png** are encoded to store the first row first and the last row last, so they can load "downwards",
but **sparse** files can load like they're being enhanced by CSI.

Image dimensions, that can be factorized into more 2's, work better,
e.g. ![equation](http://latex.codecogs.com/gif.latex?1536*1024),
because ![equation](http://latex.codecogs.com/gif.latex?1536=3*2^9)
and ![equation](http://latex.codecogs.com/gif.latex?1024=2*2^9).
In fact, an image of these dimensions will have 9 "unpixelation steps".

###2. Add to HTML

Load `PixelatedLoader.min.js` at the top of your html file.
```html
<script src="PixelatedLoader.min.js"></script>
```
Then add a Canvas element and invoke `PixelatedLoader.load` for every image you want to show.
```html
<canvas id="myCanvas"></canvas>
<script>
	PixelatedLoader.load(document.getElementById("myCanvas"),"DSC_1486.jpg.sparse");
</script>
```
Replacing `DSC_1486.jpg.sparse` with your own sparse file, of course.
Also make sure `PixelatedLoader.load` is called after the Canvas DOM element is created,
like in the code snippet above.

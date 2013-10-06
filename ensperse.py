from PIL import Image
import StringIO
import sys

def encode_int(i, numBytes=4):
    result = ""
    while numBytes > 0:
        result = result + chr(i%256)
        i = i/256
        numBytes -= 1
    return result

filename = sys.argv[1]
orig = Image.open(filename)

header = StringIO.StringIO()
output = StringIO.StringIO()

baseSize = orig.size
i = 1
while baseSize[0]%2 == 0 and baseSize[1]%2 == 0:
    baseSize = (baseSize[0]/2, baseSize[1]/2)
    i += 1

print 'Image dimensions compatible for ' + str(i) + ' slices.'

header.write(encode_int(baseSize[0]))
header.write(encode_int(baseSize[1]))
header.write(encode_int(i))

# Base is a shrunk down original image that uses the
# upper left pixel for resampling
base = Image.new(orig.mode, baseSize)
pixels = base.load()
for x in xrange(baseSize[0]):
    for y in xrange(baseSize[1]):
        pixels[x, y] = orig.getpixel((
            orig.size[0] / baseSize[0] * x,
            orig.size[1] / baseSize[1] * y
        ))
outputPos = output.len
base.save(output, format="JPEG")
base.save("base.jpg")
header.write(encode_int(output.len - outputPos))

# Every slice complements a pixelated image of size (width, height)
# and is of size (width*3, height), because it encodes three
# pixels for every square pixel of it's base in the following order:
#
# X1
# 23
#
# (Pixel X is not encoded)
while baseSize[0] < orig.size[0]:
    sl = Image.new(orig.mode, (baseSize[0]*3, baseSize[1]))
    pixels = sl.load()
    basePixelSide = orig.size[0]/baseSize[0]
    for x in xrange(baseSize[0]):
        for y in xrange(baseSize[1]):
            pixels[x*3, y] = orig.getpixel((
                basePixelSide * x + basePixelSide/2,
                basePixelSide * y
            ))
            pixels[x*3+1, y] = orig.getpixel((
                basePixelSide * x,
                basePixelSide * y + basePixelSide/2
            ))
            pixels[x*3+2, y] = orig.getpixel((
                basePixelSide * x + basePixelSide/2,
                basePixelSide * y + basePixelSide/2
            ))
    outputPos = output.len
    sl.save(output, format="JPEG")
    header.write(encode_int(output.len - outputPos))
    
    baseSize = (baseSize[0]*2, baseSize[1]*2)

f = open(filename + '.sparse', 'wb')
f.write(header.getvalue())
f.write(output.getvalue())
f.close()
header.close()
output.close()

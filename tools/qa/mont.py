import sys
from PIL import Image
out=sys.argv[1];cols=int(sys.argv[2]);scale=float(sys.argv[3]);files=sys.argv[4:]
ims=[Image.open(f).convert('RGB') for f in files]
ims=[i.resize((int(i.width*scale),int(i.height*scale))) for i in ims]
w=max(i.width for i in ims);h=max(i.height for i in ims);rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(cols*(w+6),rows*(h+6)),(60,60,60))
for k,i in enumerate(ims):M.paste(i,((k%cols)*(w+6),(k//cols)*(h+6)))
M.save(out)

function draw(id){const m=MOBS.find(x=>x.id===id);return renderSheet(SP[m.sp],m.P,m.v)}
window.renderIds=(ids)=>ids.map(id=>({id,url:draw(id).toDataURL('image/png')}));
window.allIds=()=>MOBS.map(m=>m.id);

window.bossIds=()=>BOSSES.map(b=>b.id);
window.renderBoss=(id)=>{const m=BOSSES.find(x=>x.id===id);return renderSheet(SP[m.sp],m.P,m.v,4,192,160,150,{idle:{row:0,n:4},atk:{row:1,n:4}},2).toDataURL('image/png')};

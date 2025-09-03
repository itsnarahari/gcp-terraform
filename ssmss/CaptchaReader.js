// ==UserScript==
// @name         Offline captcha
// @namespace    https://scriptingtechs.blogspot.com/
// @version      0.1
// @description  https://scriptingtechs.blogspot.com/
// @author       https://scriptingtechs.blogspot.com/
// @match        https://onlinebooking.sand.telangana.gov.in/Masters/Home.aspx
// @match        https://onlinebooking.sand.telangana.gov.in/MASTERS/HOME.ASPX
// @match        https://onlinebooking.sand.telangana.gov.in/NET/Masters/HMP.aspx
// @match        https://onlinebooking.sand.telangana.gov.in/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
function solve(img){
var map=[[0,1016,3598,6147,6147,6147,6147,3598,1016,0],[0,3075,3075,2051,4095,8191,3,3,3,0],[0,3,1543,3087,6171,6171,6195,6243,3523,1795,0],[0,6,3075,6147,6339,6339,6339,3558,1854,0],[0,56,120,472,1819,7195,8191,8191,27,0],[0,6,8130,6531,6531,6531,6531,6342,124,0],[0,1020,1638,3267,2243,6339,6211,6270,24,0],[0,7168,6144,6144,6146,6175,6392,8064,7168,0],[0,1852,3574,6339,6339,6339,6339,3574,1852,0],[0,4035,3267,6243,6242,6246,3276,2040,224,0],[3,3,3103,3195,3544,3608,3608,920,251,31,7,3],[3075,4095,4095,3171,3171,3171,3171,1251,2034,30],[248,1020,1542,3074,3075,3075,3075,1027,1542,3852],[3075,4095,3075,3075,3075,3075,3075,1542,1020,248],[3075,4095,4095,3171,3171,3315,3075,3075,3847,15],[0,3075,4095,3171,3171,3171,3315,3072,3072,3840],[3075, 3075, 4095, 3171, 3171, 3315, 3315, 3075, 3847, 3855],[3075,4095,4095,3075,3075,3075,3075,1542,1020,248]];
var ch = '0123456789ABCDEFED';
img.style='';
var c = document.createElement('CANVAS');
var ctx = c.getContext('2d');
var width=130,height=80;
c.height=height;c.width=width;
ctx.drawImage(img, 0, 0);
var d=ctx.getImageData(0,0,width,height).data;
d=Array.from(Array(width*height),(v,k)=>(d[k*4]+d[k*4+1]+d[k*4+2])/3>64?0:1);
var m = 0,b=0,n=width;
d.forEach((v,k)=>{
	if(v)m=k;
	if(v&&k%width<n)n=k%width;
	if(v&&k%width>b)b=k%width;
});
m=Math.floor(m/width)-12;b-=n-1;n-=1;
d=ctx.getImageData(n,m,b,13).data;
d=Array.from(Array(b*13),(v,k)=>(d[k*4]+d[k*4+1]+d[k*4+2])/3>64?0:1);
var dd=[];
for(var x=0;x<b;x++){dd.push('');for(var y=0;y<13;y++)dd[dd.length-1]+=''+d[y*b+x];}
dd=dd.map(v=>parseInt(v,2));

return dd.map((v,k)=>
map.map((v,kk)=>
[v.map((v,kk)=>
(((dd[k+kk]||4096)^v).toString(2).match(/1/g) || []).length
).reduce((a,v)=>a+v),ch[kk],k]
).reduce((a,v)=>v[0]<a[0]?v:a)
).sort((a,b)=>a[0]-b[0]).filter((v,k,a)=>a[0][2]-v[2]==0||Math.abs(a[0][2]-v[2])>3).sort((a,b)=>a[0]-b[0]).filter((v,k,a)=>a[1][2]-v[2]==0||Math.abs(a[1][2]-v[2])>3).sort((a,b)=>a[0]-b[0]).filter((v,k,a)=>a[2][2]-v[2]==0||Math.abs(a[2][2]-v[2])>3).sort((a,b)=>a[0]-b[0]).filter((v,k,a)=>a[3][2]-v[2]==0||Math.abs(a[3][2]-v[2])>3).sort((a,b)=>a[0]-b[0]).filter((v,k,a)=>a[4][2]-v[2]==0||Math.abs(a[4][2]-v[2])>3).slice(0,Math.round(b/12)).sort((a,b)=>a[2]-b[2]).map(v=>v[1]).join('');
}
var img=document.getElementById('imgCaptcha');
document.getElementById('txtEnterCode').value=solve(img);
img.addEventListener('load',()=>{document.getElementById('txtEnterCode').value=solve(img)});

})();
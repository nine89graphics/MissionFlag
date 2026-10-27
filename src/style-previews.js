import {STYLES} from './core.js';

/**
 * Reusable 12-style SVG concept engine for 12x18 garden-flag previews.
 * Concept thumbnails are NOT production artwork. No external fonts or logos.
 * Official uploaded logos remain unchanged, inside aspect-ratio-preserving images.
 */
const color=(c)=>typeof c==='string'&&/^#[A-Fa-f0-9]{6}$/.test(c);
const escapeXml=(s)=>String(s).replace(/[&<>"']/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function path(d,stroke,fill='none',width=8) {
  return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'"/>';
}
function rect(x,y,w,h,fill,extra='') {
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+
    '" fill="'+fill+'" '+extra+'/>';
}
function circle(cx,cy,r,fill,extra='') {
  return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" '+extra+'/>';
}
function effect(i,a,b) {
  const out=[];
  switch(i) {
    case 1: // Varsity Classic
      out.push(rect(0,112,400,16,b),rect(0,486,400,20,b));
      for(let n=0;n<7;n++)out.push(rect(n*62,102,32,8,a));
      break;
    case 2: // Velocity
      for(let n=-2;n<7;n++)out.push(path('M'+(n*95)+' 130 L'+(n*95+220)+' 470',b,'none',21));
      break;
    case 3: // Predator
      for(let n=0;n<7;n++)out.push(path('M'+(n*82-130)+' 165 L'+(n*82+22)+' 90 L'+(n*82+75)+' 350',b,'none',14));
      break;
    case 4: // Vortex
      for(const r of [116,146,177,208])out.push(
        circle(200,300,r,'none','stroke="'+b+'" stroke-width="13" opacity=".7"'));
      break;
    case 5: // Sport Pattern
      for(let n=0;n<8;n++)out.push(path('M42 '+(130+n*52)+' H358',b,'none',n%2?4:8));
      break;
    case 6: // Splatter
      for(let n=0;n<22;n++)out.push(circle(
        32+(n*67)%342,110+(n*91)%375,5+(n*13)%19,b,'opacity=".42"'));
      break;
    case 7: // Ice Breaker
      for(let n=0;n<9;n++)out.push(path(
        'M'+(n*67-70)+' 120 L'+(n*58+10)+' 390 L'+(n*55-20)+' 530 Z',
        b,b,2));
      break;
    case 8: // Tie-Dye Spirit
      for(let n=0;n<7;n++)out.push(path(
        'M'+(-130+n*60)+' 155 Q'+(150+n*23)+' 300 '+(-80+n*70)+' 470',
        b,'none',25));
      break;
    case 9: // Paint Drip
      out.push(rect(0,120,400,55,b));
      for(let n=0;n<10;n++)out.push(rect(n*46,170,14,32+(n*19)%88,b));
      break;
    case 10: // Shield Pride
      out.push(path('M200 130 L340 188 L316 408 L200 495 L84 408 L60 188 Z',
        b,'none',17));
      break;
    case 11: // Digital Camo
      for(let n=0;n<34;n++)out.push(rect(
        (n*83)%400,118+(n*73)%352,18+((n*13)%42),12+(n*7)%28,
        b,'opacity=".35"'));
      break;
    case 12: // Neon Energy
      for(let n=0;n<6;n++)out.push(path(
        'M'+(25+n*60)+' 115 L'+(75+n*57)+' 240 L'+(10+n*63)+' 390',
        b,'none',11));
      out.push(circle(200,301,156,'none','stroke="'+b+'" stroke-width="17" opacity=".65"'));
      break;
    default: throw new Error('Unknown signature style');
  }
  return out.join('');
}
export function renderStylePreview({
  styleNumber,schoolName,mascotName,primaryColor,secondaryColor,
  logoDataUri=null,sport=null
}) {
  if(!Number.isSafeInteger(styleNumber)||styleNumber<1||styleNumber>STYLES.length)
    throw new Error('Unknown signature style');
  if(!color(primaryColor)||!color(secondaryColor))
    throw new Error('Both official school HEX colors are required');
  if(typeof schoolName!=='string'||!schoolName.trim()||schoolName.length>30||
    typeof mascotName!=='string'||!mascotName.trim()||mascotName.length>28)
    throw new Error('Confirm complete, readable team and mascot names');
  if(sport!==null&&(typeof sport!=='string'||sport.length>40))
    throw new Error('Invalid activity label');
  if(logoDataUri!==null&&
    (typeof logoDataUri!=='string'||logoDataUri.length>2000000||
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(logoDataUri)))
    throw new Error('Only a trusted PNG, JPEG or WebP logo may be embedded');
  const a=primaryColor,b=secondaryColor;
  const school=escapeXml(schoolName.trim());
  const mascot=escapeXml(mascotName.trim());
  const title=escapeXml(STYLES[styleNumber-1]);
  const schoolFont=Math.max(24,45-schoolName.length*.8);
  const mascotFont=Math.max(29,52-mascotName.length*.8);
  const logo=logoDataUri
    ? '<image x="94" y="189" width="212" height="221" preserveAspectRatio="xMidYMid meet" href="'+logoDataUri+'"/>'
    : '<rect x="90" y="213" width="220" height="170" rx="17" fill="#ffffff" opacity=".2"/>'+
      '<text x="200" y="298" font-size="20" fill="white" text-anchor="middle">LOGO PENDING</text>';
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" role="img"',
    ' aria-label="'+title+' flag concept for '+school+' '+mascot+'">',
    rect(0,0,400,600,a),effect(styleNumber,a,b),
    rect(24,24,352,98,'#101820','rx="8" opacity=".92"'),
    '<text x="200" y="77" font-size="'+schoolFont+
      '" font-family="Arial,Helvetica,sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">'+school+'</text>',
    circle(200,299,116,'#101820','opacity=".67"'),
    logo,
    rect(24,444,352,97,'#101820','rx="8" opacity=".92"'),
    '<text x="200" y="504" font-size="'+mascotFont+
      '" font-family="Arial,Helvetica,sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">'+mascot+'</text>',
    rect(0,559,400,41,'#121820'),
    '<text x="200" y="578" font-size="13" font-family="Arial,Helvetica,sans-serif" text-anchor="middle" fill="#ffffff">',
    '#'+styleNumber+' '+title+' · CONCEPT ONLY</text>',
    '</svg>'
  ].join('');
}
export function renderStyleBoard(details) {
  return STYLES.map((name,i)=>({number:i+1,name,
    svg:renderStylePreview({...details,styleNumber:i+1})}));
}

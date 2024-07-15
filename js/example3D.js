
rooms.example3D = function() {

lib3D();

description = `<div class="bolded"> The Thing </div><p> 
   <div class="lab"> Toggle Smooth Min
   <label class="switch">
      <input type="checkbox" id="smoothmin" checked>
      <span class="slider round"></span>
   </label>
   <br> <br> Toggle Animation
   <label class="switch">
      <input type="checkbox" id="animation" checked>
      <span class="slider round"></span>
   </label>
   <br> <br>
   <button type="button" onclick="window.location.reload();">Reset Animation</button>
`;

code = {
'init':`
   S.nL = 2;
`,
fragment: `
S.setFragmentShader(\`
   const int nL = \` + S.nL + \`;
   uniform float uTime;
   uniform float uSmin;
   uniform float uAnim;
   uniform vec3 uBgColor;

   varying vec3 vPos;

   // returns zero if we are on the sphere, positive if outside, pos if inside
   float sphere(vec3 P, vec4 S){
      return length(P - S.xyz) - S.w;
   }

   // formula pulled from https://iquilezles.org/articles/intersectors/
   float box(vec3 P, vec3 B, vec3 S){
      P = abs(P-B)-S;
      return length(max(P, 0.))+min(max(P.x,max(P.y,P.z)),0.);
   }

   // formula also pulled from https://iquilezles.org/articles/intersectors/
   // capsule is solved with params (position, extreme A, extreme B, radius1, radius2)
   float capsule(vec3 P, vec3 A, vec3 B, float r1, float r2){
      vec3 ap = P - A;
      vec3 ab = B - A;
      float t = clamp(dot(ap,ab)/dot(ab,ab), 0., 1.);
      return length(ap-t*ab)-mix(r1,r2,clamp(length(ap),0.,1.));
   }

   mat2 rotate(float t){
      float s = sin(t);
      float c = cos(t);
      return mat2(c, s, -s, c);
   }

   // pulled from https://www.shadertoy.com/view/Ml3Gz8
   // smooth min function softens edges... must be done before ray tracing
   // params are (value a, value b, smoothness k)
   float smin(float a, float b, float k){
      if(uSmin == 1.){
         float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
         return mix(a, b, h) - k*h*(1.0-h);
      }
      return min(a, b);
   }

   float smax(float a, float b, float k){
      float h = clamp(0.5 + 0.5*(a-b)/-k, 0.0, 1.0);
      return mix(a, b, h) - -k*h*(1.0-h);
   }

   float hand(vec3 P){
      float PI = 3.14;
      P.z += 1.;
      P.z *= 0.6;
      P.y *= 0.86;
      P.y += 8.;
      // palm
      float dist = box(P, vec3(0.,1.,-0.1), vec3(8.,20.,0.5)) - 2.;
      dist = smax(dist, sphere(P,vec4(0.,0.6,0.,11.)),5.);
      dist = smin(dist, capsule(P,vec3(-6.6,-5.2,-1.3),vec3(-11.8,2.1,-2.1),1.39,1.39),5.5);
      // dist = smin(dist, box(P, vec3(0., -15., 0.), vec3(150.,0.,50.)),2.);
      float time = uTime*2.;

      // thumb joint
      dist = smin(dist, capsule(P,vec3(-8.4,-2.8,-2.),vec3(-11.2,3.8,-4.1),1.48,1.47),5.5);
      dist = smin(dist, capsule(P,vec3(-0., -6.2, -1.2),vec3(-0.,-20.,-1.),6.9,6.9),5.5);
      // thumb
      float t =sin(time+0.2)*0.5+0.5;
      vec3 pos = P;  
      pos -= vec3(-11.,3.5,-4.);    
      pos.xy *= rotate(-0.1-t*0.2);
      pos.yz *= rotate(-0.5);
      float thumb = capsule(pos,vec3(0.,0.,0.),vec3(-2.9,6.4,0.),1.6,1.5);
      pos.y -= 6.4;
      pos.x += 3.;
      pos.xy *= rotate(-0.3-t*0.2);
      float top = capsule(pos,vec3(0.,0.,0.),vec3(-1.78,4.4,0.),1.61,1.19);
      top = smax(top,-(box(pos,vec3(-4.2,2.7,0.), vec3(1.4,5.,1.4))),1.2);
      thumb = smin(thumb,top,0.4);

      // index finger
      t = sin(time - PI*1.5)*0.5+0.5;
      pos = P;   
      pos -= vec3(-6.91,7.4,0.);
      pos.yz *= rotate(-0.11-t*0.29);  
      float index = capsule(pos,vec3(-0.48,-1.1,0.),vec3(0.,7.2,0.),2.6,1.71);
      pos.y -= 6.9;
      pos.yz *= rotate(-0.39-t*0.21);
      index = smin(index,capsule(pos,vec3(0.,0.,0.),vec3(0.,4.1,0.),1.55,1.45),.2);
      pos.y -= 4.; 
      pos.yz *= rotate(-0.61-t*0.2);
      top = capsule(pos,vec3(0.,0.,0.),vec3(0.,3.6,1.6),1.28,1.2);
      top = smax(top,-(box(pos,vec3(0.,2.47,2.47), vec3(3.,2.,0.2))),1.);
      index = smin(index,top,0.5);

      // middle finger
      t = sin(time - PI)*0.5+0.5;
      pos = P;   
      pos -= vec3(-2.,9.,0.);
      pos.yz *= rotate(-0.1-t*0.4);  
      float middle = capsule(pos,vec3(-0.2,-1.,0.),vec3(0.,6.9,0.),2.47,1.7);
      pos.y -= 6.9;
      pos.yz *= rotate(-0.3-t*0.2);
      middle = smin(middle,capsule(pos,vec3(0.,0.,0.),vec3(0.,4.75,0.),1.65,1.55),.2);
      pos.y -= 4.8; 
      pos.yz *= rotate(-0.75-t*0.4);
      top = capsule(pos,vec3(0.,0.,0.),vec3(0.,3.4,1.2),1.5,1.25);
      top = smax(top,-(box(pos,vec3(0.,2.4,2.1), vec3(2.4,3.,0.5))),0.8);
      middle = smin(middle,top,0.5);
      
      // ring finger
      t= sin(time - PI*0.5)*0.5+0.5;
      pos = P;   
      pos -= vec3(2.8,7.5,0.);
      pos.yz *= rotate(-0.1-t*0.3);  
      float ring = capsule(pos,vec3(0.,-1.1,0.),vec3(0.,6.9,0.),2.2,1.6);
      pos.y -= 6.9;
      pos.yz *= rotate(-0.4-t*0.2);
      ring = smin(ring,capsule(pos,vec3(0.,0.,0.),vec3(0.,4.,0.),1.5,1.4),.2);
      pos.y -= 4.; 
      pos.yz *= rotate(-0.7-t*0.2);
      top = capsule(pos,vec3(0.,0.,0.),vec3(0.,3.2,1.2),1.3,1.2);
      top = smax(top,-(box(pos,vec3(0.,2.47,2.), vec3(2.47,3.,0.5))),.6);
      ring = smin(ring,top,0.5);

      // pinky finger
      t = sin(time)*0.5+0.5;  
      pos = P;   
      pos -= vec3(6.9,5.,0.);
      pos.yz *= rotate(-0.1-t*0.2);  
      float pinky = capsule(pos,vec3(0.,0.,0.),vec3(0.,6.9,0.),1.8,1.55);
      pos.y -= 6.9;
      pos.yz *= rotate(-0.42-t*0.11);
      pinky = smin(pinky,capsule(pos,vec3(0.,0.,0.),vec3(0.,3.24,0.),1.45,1.3),0.2);
      pos.y -= 3.5; 
      pos.yz *= rotate(-0.7);
      top = capsule(pos,vec3(0.,0.,0.),vec3(0.,3.,1.1),1.2,1.);
      top = smax(top,-(box(pos,vec3(0.,2.45,2.), vec3(2.45,3.,0.5))),0.72);
      pinky = smin(pinky,top,0.5);  

      float finger = min(min(min(min(pinky, ring),middle),index),thumb);    
      dist = smin(dist, finger,2.);
      return dist;
   }

   float rayHand(vec3 V, vec3 W){
      float dist = 0.;
      for(int i=0; i<200; ++i){
         vec3 P = V + W * dist; 
         float curr = hand(P);
         dist += curr; 
         if (curr < 0.0001)
            break;
         if(dist > 400.){
            dist = 3.402823466e+38; // if above 400, just set to max dist
            break;
         }
      }
      return dist;
   }

   vec3 getNormal(vec3 p){
      return normalize(vec3(+1., -1., -1.) * hand(p + vec3(+1., -1., -1.) * 0.0001) +
                        vec3(-1., -1., +1.) * hand(p + vec3(-1., -1., +1.) * 0.0001) +
                        vec3(-1., +1., -1.) * hand(p + vec3(-1., +1., -1.) * 0.0001) +
                        vec3(+1., +1., +1.) * hand(p + vec3(+1., +1., +1.) * 0.0001));
   }

   float turbulence(vec3 p) {
      float t = 0., f = 1.;
      for (int i = 0 ; i < 10 ; i++) {
         t += abs(noise(f * p)) / f;
         f *= 2.;
      }
      return t;
   }

   vec3 clouds(float y) {
      vec3 sky = vec3(0.,0.,0.);
      float s = mix(.4,0.6, clamp(3.*y-2., 0.,1.));
      return mix(sky, vec3(s), clamp(.5*y,0.,1.));
   }

   void main() {
      vec3 col = uBgColor;
      
      // y is going from 0->15->0
      // z is going from -100->-30->-100
      vec3 orient;
      float start = 10.5;
      float end = 11.;
      if(uTime > end && uAnim == 1.) {
         gl_FragColor = vec4(sqrt(col),1.);
         return;
      }
      if(uTime > start && uTime < end && uAnim == 1.){
         float oldRange = end - start;
         float newRange = 16.9 - 0.;
         float a = (uTime - start) * newRange / oldRange;
         newRange = -10. + 100.;
         float b = ((uTime - start) * newRange / oldRange) - 100.;
         orient = vec3(0., a, b);
      } else if(uAnim == 0.) {
         orient = vec3(0., 0., -60.);
      } else {
         orient = vec3(0., 0., -100.);
      }
      vec3 tilt = vec3(0., 0., 0.);
      
      vec3 perspective = normalize(tilt-orient);
      vec3 right = normalize(cross(vec3(0., 1., 0.), perspective));
      vec3 up = cross(perspective, right);
      
      vec3 rd = mat3(right, up, perspective) * normalize(vec3(vPos.xy, 1.));
      
      float t = rayHand(orient, rd);    

      if(t < 100000.){
         vec3 p = orient + t * rd;
         vec3 n = getNormal(p);

         // col = vec3(0.18,0.05,0.02);

         col = vec3((dot(n,normalize(vec3(0.,.5,0.)))));
         col = vec3((dot(col,normalize(vec3(0.,-.5,-1.)))));
      } 
      else {
         vec3 x = vPos + vec3(.1*uTime,0.,.1*uTime);
         col = clouds(x.y + turbulence(x));
      }
      gl_FragColor = vec4(sqrt(col),1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos;
   varying   vec3 vPos;

   void main() {
      vPos = aPos;
      gl_Position = vec4(aPos, 1.);
   }

\`)
`,
render: `

   S.setUniform('3fv', 'uBgColor', [0,0,0]);
   S.setUniform('1f', 'uSmin', smoothmin.checked ? 1. : 0.);
   S.setUniform('1f', 'uAnim', animation.checked ? 1. : 0.);
   S.setUniform('1f', 'uTime', time);

   let matrixTranslate = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
   let matrixScale = (x,y,z) => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
   let matrixRotx = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
   }
   let matrixRoty = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
   }
   let matrixRotz = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];
   }

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
}

}


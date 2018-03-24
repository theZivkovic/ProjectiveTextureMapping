
uniform sampler2D projectorTexture;
uniform float projectedImageScale;
uniform vec3 lightPosition;

varying vec3 N;
varying vec3 v;
varying vec4 projectorClipCoords;

void main()
{
  vec3 L = normalize(lightPosition - v);   
  vec4 diffuseColor = vec4(0.9, 0.9, 0.9, 1.0) * max(dot(N, L), 0.0);
  
  vec4 textureColor;
  
  vec2 ndcCoords = projectorClipCoords.xy / projectorClipCoords.w;
  vec2 screenSpaceCoords = ndcCoords / 2.0 / projectedImageScale + 0.5;

  if (screenSpaceCoords.x < 0.0 || screenSpaceCoords.x > 1.0 ||
      screenSpaceCoords.y < 0.0 || screenSpaceCoords.y > 1.0)
    textureColor = vec4(0.0, 0.0, 0.0, 1.0);
  else
    textureColor = texture2D(projectorTexture, screenSpaceCoords);

  gl_FragColor = mix(diffuseColor, textureColor, 0.5);
}
uniform mat4 projectorProjectionMat;
uniform mat4 projectorViewMat;

varying vec4 projectorClipCoords;

varying vec3 N;
varying vec3 v;

void main() {

  v = vec3(modelViewMatrix * vec4(position, 1.0));       
  N = normalize(normalMatrix * normal);

  projectorClipCoords = projectionMatrix *
                        modelViewMatrix *
                        vec4(position, 1.0);

  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position,1.0);
}
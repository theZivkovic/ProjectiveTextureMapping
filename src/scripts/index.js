import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';

import '../styles/main.sass';
import ProjectiveTextureMapping from './projective-texture-mapping';


window.onload = () => {
	let canvas = document.querySelector('#container');
	const app = new ProjectiveTextureMapping(canvas);
};

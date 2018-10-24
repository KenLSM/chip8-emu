const onPixel = '@';
const offPixel = ' ';

const init = canvas => {
	canvas = Array(32);
	for(let i = 0; i < 32; i++) {
		canvas[i] = Array(64).fill(false);
	}
	return canvas;
};

const draw = canvas => {
	for(let r = 0; r < canvas.length; r++) {
		console.log(String(r).padStart(4), 
			canvas[r].reduce(
				(accum, v) => accum + (v ? onPixel : offPixel)
			, '')
		);
	}
}

module.exports = {
	init,
	draw
}
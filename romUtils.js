const parseRom = data => {
	const d = data.toString('ascii').replace(/\n|\r/g, ' ').split(' ').join('');
	// console.log(d);
	const ret = [];
	for(let i = 0; i < d.length; i += 2) {
		ret.push(d.slice(i, i + 2));
	}
	return ret;
}

const printRom = (rom, init = 0) => {
	for(let i = init; i < rom.length; i += 8) {
		const lineNum = String(i).padStart(4);
		console.log(lineNum,
			rom.slice(i, i + 2).join(''),
			rom.slice(i + 2, i + 4).join(''),
			rom.slice(i + 4, i + 6).join(''),
			rom.slice(i + 6, i + 8).join(''),
		);
	}
}

const padRom = (romData, padding) => {
	return Array(padding).fill(0).concat(romData);
}

const fillRomWithSpirtes = (romData) => {
	const sprites = [
		'F0', '90', '90', '90', 'F0', // 0 
		'20', '60', '20', '20', '70', // 1 
		'F0', '10', 'F0', '80', 'F0', // 2
		'F0', '10', 'F0', '10', 'F0', // 3
		'90', '90', 'F0', '10', '10', // 4
		'F0', '80', 'F0', '10', 'F0', // 5
		'F0', '80', 'F0', '90', 'F0', // 6
		'F0', '10', '20', '40', '40', // 7
		'F0', '90', 'F0', '90', 'F0', // 8
		'F0', '90', 'F0', '10', 'F0', // 9
		'F0', '90', 'F0', '90', '90', // A
		'E0', '90', 'E0', '90', 'E0', // B
		'F0', '80', '80', '80', 'F0', // C
		'E0', '90', '90', '90', 'E0', // D
		'F0', '80', 'F0', '80', 'F0', // E
		'F0', '80', 'F0', '80', '80', // F
	]
	for(let i = 0; i < sprites.length; i++) {
		romData[i] = sprites[i];
	}
	return romData;
}


module.exports = {
	parseRom,
	printRom,
	padRom,
	fillRomWithSpirtes
}
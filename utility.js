module.exports = {
	formatVersionFolder(version) {
		return version
			.split('.')
			.map(n => n.padStart(2, '0'))
			.join('_');
	},
};

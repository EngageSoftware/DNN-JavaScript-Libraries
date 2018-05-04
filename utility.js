'use strict';

module.exports = {
	formatVersionFolder(version) {
		const versionFolderPadding = 2;

		return version
			.split('.')
			.map(n => n.padStart(versionFolderPadding, '0'))
			.join('_');
	},

	compareStrings(a, b) {
		const upperA = a ? a.toUpperCase() : a;
		const upperB = b ? b.toUpperCase() : b;
		if (upperA < upperB) {
			return -1;
		}

		if (upperA > upperB) {
			return 1;
		}

		return 0;
	},
};

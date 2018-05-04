'use strict';

module.exports = {
	formatVersionFolder(version) {
		const versionFolderPadding = 2;

		return version
			.split('.')
			.map(n => n.padStart(versionFolderPadding, '0'))
			.join('_');
	},
};

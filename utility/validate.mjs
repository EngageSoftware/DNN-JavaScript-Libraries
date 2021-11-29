import path from 'path';
import decompress from 'decompress';
import select from 'xpath.js';
import { DOMParser } from 'xmldom';
import got from 'got';

function equalCaseInsensitive(a, b) {
	if (!a || !b) {
		return !a && !b;
	}

	return a.toUpperCase() === b.toUpperCase();
}

/**
 * Validates a package
 *
 * @param {String} file - Path to a zip package file
 * @returns {Promise<String[]>} Resolves to a list of error messages
 */
export async function validatePackage(file) {
	const validationMessages = [];
	try {
		const files = await decompress(file);
		const manifestFiles = files.filter(
			(file) => path.extname(file.path) === '.dnn'
		);
		if (manifestFiles.length > 1) {
			return ['Too many .dnn manifest files'];
		} else if (manifestFiles.length === 0) {
			return ['Missing .dnn manifest file'];
		}

		const manifestFile = manifestFiles[0];
		const manifestContents = manifestFile.data.toString('utf-8');
		const parser = new DOMParser();

		const doc = parser.parseFromString(manifestContents);
		const cdnPathNodes = select(
			doc,
			'/dotnetnuke/packages/package/components/component/javaScriptLibrary/CDNPath/text()'
		);
		const cdnResponses = cdnPathNodes
			.map(({ data }) => data)
			.filter((data) => Boolean(data))
			.map((url) => got.head(url));
		for (const response of cdnResponses) {
			try {
				await response;
			} catch (e) {
				validationMessages.push('Error checking CDN URL: ' + e);
			}
		}

		const fileNames = select(
			doc,
			'/dotnetnuke/packages/package/components/component/javaScriptLibrary/fileName/text()'
		).map(({ data }) => data);
		if (fileNames.length !== 1) {
			validationMessages.push(
				'Expected exactly one JavaScript_Library component file name, got ' +
					fileNames.length
			);
		}

		const jsFileNames = select(
			doc,
			'/dotnetnuke/packages/package/components/component/jsfiles/jsfile/name/text()'
		).map(({ data }) => data);
		if (jsFileNames.length !== 1) {
			validationMessages.push(
				'Expected exactly one JavaScriptFile component file name, got ' +
					jsFileNames.length
			);
		}

		if (
			fileNames.length === 1 &&
			jsFileNames.length === 1 &&
			fileNames[0] !== jsFileNames[0]
		) {
			validationMessages.push(
				`Expected JavaScriptFile component file name "${jsFileNames[0]}" to equal JavaScript_Library component file name "${fileNames[0]}"`
			);
		} else {
			const fileName = fileNames[0];
			const jsFiles = files.filter((file) =>
				equalCaseInsensitive(fileName, path.basename(file.path))
			);
			if (jsFiles.length === 0) {
				validationMessages.push(
					`File in manifest "${fileName}" is not in package zip`
				);
			}
		}

		const resourcesFiles = files.filter(
			(file) => path.basename(file.path) === 'Resources.zip'
		);
		const resourcesFileNames = select(
			doc,
			'/dotnetnuke/packages/package/components/component/resourceFiles/resourceFile/name/text()'
		).map(({ data }) => data);
		if (resourcesFiles.length < resourcesFileNames.length) {
			validationMessages.push(
				`"${resourcesFileNames[0]}" specified in manifest but is not in package zip`
			);
		} else if (resourcesFiles.length > resourcesFileNames.length) {
			validationMessages.push(
				`"${resourcesFiles[0].path}" is in package zip but is not specified in manifest`
			);
		}

		return validationMessages;
	} catch (e) {
		validationMessages.push('Unexpected error: ' + e);
		return validationMessages;
	}
}

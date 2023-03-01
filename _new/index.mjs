import path from 'path';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import yosay from 'yosay';
import inquirer from 'inquirer';
import packageJson from 'package-json';
import spawn from 'cross-spawn';
import eos from 'end-of-stream';
import glob from 'glob';
import { formatVersionFolder } from '../utility/index.mjs';

export default class extends Generator {
	prompting() {
		// Have Yeoman greet the user.
		this.log(
			yosay(
				`Welcome to the superb ${chalk.red(
					'DNN JavaScript Library'
				)} generator!`
			)
		);

		let yarnAdd;

		const prompts = [
			{
				type: 'input',
				name: 'libraryName',
				message: "What is the npm module's name?",
				validate: (libraryName, answers) => {
					yarnAdd = new Promise((resolve, reject) =>
						eos(
							spawn('yarn', ['add', libraryName], {
								stdio: 'ignore',
							}),
							(err) => (err ? reject(err) : resolve())
						)
					);

					return packageJson(libraryName, {
						fullMetadata: true,
					})
						.then((pkg) => {
							answers.pkg = pkg;
							if (pkg.repository && pkg.repository.url) {
								answers.githubUrl = pkg.repository.url
									.replace(/^git(?:\+https?)?:/, 'https:')
									.replace(/\.git$/, '');
							}
						})
						.then(
							() => true,
							(err) =>
								`There was an error retrieving metadata for npm package ${libraryName} \n ${err}`
						);
				},
			},
			{
				type: 'input',
				name: 'friendlyName',
				message: "What is the library's friendly name?",
				default: (answers) => answers.pkg.name,
			},
			{
				type: 'input',
				name: 'licenseUrl',
				message: "What is the URL to the library's license?",
				default: (answers) =>
					answers.githubUrl
						? `${answers.githubUrl}/blob/LICENSE`
						: answers.homepage,
			},
			{
				type: 'input',
				name: 'licenseName',
				message: 'What is the name of the license?',
				default: (answers) => answers.pkg.license,
			},
			{
				type: 'input',
				name: 'changelogUrl',
				message: "What is the URL to the library's changelog?",
				default: (answers) =>
					answers.githubUrl
						? `${answers.githubUrl}/releases`
						: answers.homepage,
			},
			{
				type: 'input',
				name: 'description',
				message: "What is the library's description?",
				default: (answers) => answers.pkg.description,
			},
			{
				type: 'list',
				name: 'relativePath',
				message: 'What is the main JavaScript file?',
				choices: ({ libraryName }) =>
					yarnAdd
						.then(() =>
							glob(
								`node_modules/${libraryName}/**/*.js`, {
								ignore: `node_modules/${libraryName}/node_modules/**/*.js`,
                                })
						)
						.then((files) =>
							files
								.map((file) =>
									file.replace(
										`node_modules/${libraryName}/`,
										''
									)
								)
								.map(path.normalize)
								.map((file) => file.replace(/\\/g, '/'))
								.concat([new inquirer.Separator(), 'Other'])
						)
						.catch((err) => {
							this.log.error(
								'There was an unexpected error retrieving files: \n %O',
								err
							);

							return ['Other'];
						}),
				default: ({ pkg }) =>
					path.normalize(pkg.browser || pkg.main).replace(/\\/g, '/'),
				filter: (relativePath) => relativePath.replace(/\\/g, '/'),
			},
			{
				type: 'input',
				name: 'relativePath',
				message: 'What is the main JavaScript file?',
				when: (answers) => answers.relativePath === 'Other',
				default: (answers) =>
					path
						.normalize(answers.pkg.browser || answers.pkg.main)
						.replace(/\\/g, '/'),
				filter: (relativePath) => relativePath.replace(/\\/g, '/'),
			},
			{
				type: 'list',
				name: 'preferredScriptLocation',
				message:
					'What is the preferred script location for the library?',
				choices: ['PageHead', 'BodyTop', 'BodyBottom'],
				default: 'BodyBottom',
			},
			{
				type: 'input',
				name: 'objectName',
				message:
					'What JavaScript object will be defined if the script loaded correctly?',
			},
		];

		return this.prompt(prompts).then((props) => {
			// To access props later use this.props.someAnswer;
			this.props = props;
			this.props.fileName = path.basename(props.relativePath);
			this.props.version = props.pkg.version;
			this.props.versionFolder = formatVersionFolder(props.pkg.version);
		});
	}

	writing() {
		const folder = this.props.libraryName;
		this.fs.copyTpl(
			this.templatePath('{libraryName}.dnn'),
			this.destinationPath(`${folder}/${this.props.libraryName}.dnn`),
			this.props
		);
		this.fs.copyTpl(
			this.templatePath('CHANGES.htm'),
			this.destinationPath(`${folder}/CHANGES.htm`),
			this.props
		);
		this.fs.copyTpl(
			this.templatePath('dnn-library.json'),
			this.destinationPath(`${folder}/dnn-library.json`),
			this.props
		);
		this.fs.copyTpl(
			this.templatePath('LICENSE.htm'),
			this.destinationPath(`${folder}/LICENSE.htm`),
			this.props
		);
	}
}

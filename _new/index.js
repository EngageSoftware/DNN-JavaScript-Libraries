'use strict';

const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const inquirer = require('inquirer');
const packageJson = require('package-json');
const globby = require('globby');
const { formatVersionFolder } = require('../utility');

module.exports = class extends Generator {
	prompting() {
		// Have Yeoman greet the user.
		this.log(
			yosay(
				chalk`Welcome to the superb {red DNN JavaScript Library} generator!`
			)
		);

		const prompts = [
			{
				type: 'input',
				name: 'libraryName',
				message: "What is the npm module's name?",
				validate: (libraryName, answers) => {
					this.spawnCommand('yarn', ['add', libraryName], {
						stdio: 'ignore',
					});

					return packageJson(libraryName, {
						fullMetadata: true,
					})
						.then(pkg => {
							answers.pkg = pkg;
							if (pkg.repository && pkg.repository.url) {
								answers.githubUrl = pkg.repository.url
									.replace(/^git(?:\+https?)?:/, 'https:')
									.replace(/\.git$/, '');
							}
						})
						.then(
							() => true,
							err =>
								`There was an error retrieving metadata for npm package ${libraryName} \n ${err}`
						);
				},
			},
			{
				type: 'input',
				name: 'friendlyName',
				message: "What is the library's friendly name?",
				default: answers => answers.pkg.name,
			},
			{
				type: 'input',
				name: 'licenseUrl',
				message: "What is the URL to the library's license?",
				default: answers =>
					answers.githubUrl
						? `${answers.githubUrl}/blob/LICENSE`
						: answers.homepage,
			},
			{
				type: 'input',
				name: 'licenseName',
				message: 'What is the name of the license?',
				default: answers => answers.pkg.license,
			},
			{
				type: 'input',
				name: 'changelogUrl',
				message: "What is the URL to the library's changelog?",
				default: answers =>
					answers.githubUrl
						? `${answers.githubUrl}/releases`
						: answers.homepage,
			},
			{
				type: 'input',
				name: 'description',
				message: "What is the library's description?",
				default: answers => answers.pkg.description,
			},
			{
				type: 'list',
				name: 'relativePath',
				message: 'What is the main JavaScript file?',
				choices: answers => {
					try {
						return globby
							.sync(`node_modules/${answers.libraryName}/**/*.js`)
							.map(file =>
								file.replace(
									`node_modules/${answers.libraryName}/`,
									''
								)
							)
							.map(path.normalize)
							.map(file => file.replace(/\\/g, '/'))
							.concat([new inquirer.Separator(), 'Other']);
					} catch (e) {
						console.error(e);
					}
				},
				default: answers =>
					path
						.normalize(answers.pkg.browser || answers.pkg.main)
						.replace(/\\/g, '/'),
				filter: libraryPath => libraryPath.replace(/\\/g, '/'),
			},
			{
				type: 'input',
				name: 'relativePath',
				message: 'What is the main JavaScript file?',
				when: answers => answers.relativePath === 'Other',
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

		return this.prompt(prompts).then(props => {
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
};

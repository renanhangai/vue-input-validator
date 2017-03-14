import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/index.js',
	moduleName: 'VueInputValidator',
	plugins: [
		babel(),
	]
};

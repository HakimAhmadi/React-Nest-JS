const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'metro', 'transformer.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes('metro_transform_worker_1.default.transform')) {
    content = content.replace(
      'return (0, metro_transform_worker_1.default).transform(config, projectRoot, filename, data, options);',
      'const worker = metro_transform_worker_1.default || metro_transform_worker_1;\n    const transformFn = config.cssInterop_transformerPath ? require(config.cssInterop_transformerPath).transform : (worker.transform || worker);\n    return transformFn(config, projectRoot, filename, data, options);'
    );
    content = content.replace(
      'await (0, metro_transform_worker_1.default).transform(config, projectRoot, filename, Buffer.from(fakeFile), options);',
      'const worker = metro_transform_worker_1.default || metro_transform_worker_1;\n    const transformFn = config.cssInterop_transformerPath ? require(config.cssInterop_transformerPath).transform : (worker.transform || worker);\n    const result = await transformFn(config, projectRoot, filename, Buffer.from(fakeFile), options);'
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-interop] Successfully applied Metro transformer compatibility patch.');
  }
}
